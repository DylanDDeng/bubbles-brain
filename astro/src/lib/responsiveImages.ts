import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import sharp from 'sharp';

import { responsiveVariantPath, responsiveWidths } from './articleFigures';

export const RESPONSIVE_IMAGE_LOCK_VERSION = 1;
export const RESPONSIVE_IMAGE_PARAMS = {
	avif: { quality: 55, effort: 4 },
	webp: { quality: 82, smartSubsample: true },
} as const;

const rasterExtensions = new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp']);
const formats = ['avif', 'webp'] as const;

export interface ResponsiveImageLockEntry {
	source_sha256: string;
	width: number;
	variants: string[];
}

export interface ResponsiveImageLock {
	version: typeof RESPONSIVE_IMAGE_LOCK_VERSION;
	params: typeof RESPONSIVE_IMAGE_PARAMS;
	sources: Record<string, ResponsiveImageLockEntry>;
}

export interface ResponsiveImageRoots {
	contentRoot: string;
	staticRoot: string;
	lockPath: string;
}

export interface ResponsiveImageSummary {
	referenced: number;
	generated: number;
	current: number;
	pruned: number;
}

async function filesUnder(directory: string): Promise<string[]> {
	let entries;
	try {
		entries = await readdir(directory, { withFileTypes: true });
	} catch {
		return [];
	}
	const nested = await Promise.all(
		entries.map((entry) => {
			const path = resolve(directory, entry.name);
			return entry.isDirectory() ? filesUnder(path) : [path];
		}),
	);
	return nested.flat();
}

export function localImageReferences(markdown: string): string[] {
	const references = new Set<string>();
	const patterns = [
		/!\[[^\]]*\]\(<?(\/[^\s)>]+\.(?:avif|jpe?g|png|webp))(?:[?#][^\s)>]*)?>?(?:\s+["'][^"']*["'])?\)/gi,
		/<img\b[^>]*\bsrc=["'](\/[^"']+\.(?:avif|jpe?g|png|webp))(?:[?#][^"']*)?["'][^>]*>/gi,
	];
	for (const pattern of patterns) {
		for (const match of markdown.matchAll(pattern)) if (match[1]) references.add(match[1]);
	}
	return [...references];
}

export async function referencedRasterImages(
	contentRoot: string,
	staticRoot: string,
): Promise<string[]> {
	const markdownFiles = (await filesUnder(contentRoot)).filter((path) => path.endsWith('.md'));
	const referenced = new Set<string>();
	for (const file of markdownFiles) {
		for (const reference of localImageReferences(await readFile(file, 'utf8'))) {
			if (!rasterExtensions.has(extname(reference).toLowerCase())) continue;
			try {
				await access(resolve(staticRoot, `.${reference}`));
				referenced.add(reference);
			} catch {
				// Missing sources render as ordinary images without responsive variants.
			}
		}
	}
	return [...referenced].sort();
}

function sha256(bytes: Uint8Array): string {
	return createHash('sha256').update(bytes).digest('hex');
}

async function readLock(lockPath: string): Promise<ResponsiveImageLock | null> {
	let raw: string;
	try {
		raw = await readFile(lockPath, 'utf8');
	} catch {
		return null;
	}
	const parsed = JSON.parse(raw) as ResponsiveImageLock;
	if (
		parsed?.version !== RESPONSIVE_IMAGE_LOCK_VERSION ||
		JSON.stringify(parsed.params) !== JSON.stringify(RESPONSIVE_IMAGE_PARAMS) ||
		typeof parsed.sources !== 'object'
	) {
		return null;
	}
	return parsed;
}

function variantsFor(publicPath: string, width: number): string[] {
	return responsiveWidths(width).flatMap((candidate) =>
		formats.map((format) => responsiveVariantPath(publicPath, candidate, format)),
	);
}

async function isPresent(path: string): Promise<boolean> {
	try {
		return (await stat(path)).size > 0;
	} catch {
		return false;
	}
}

export async function generateResponsiveImages(
	roots: ResponsiveImageRoots,
	concurrency = 4,
): Promise<ResponsiveImageSummary> {
	const referenced = await referencedRasterImages(roots.contentRoot, roots.staticRoot);
	const previous = (await readLock(roots.lockPath))?.sources ?? {};
	const sources: Record<string, ResponsiveImageLockEntry> = {};
	const totals: ResponsiveImageSummary = {
		referenced: referenced.length,
		generated: 0,
		current: 0,
		pruned: 0,
	};
	const queue = [...referenced];

	async function processOne(publicPath: string): Promise<void> {
		const sourcePath = resolve(roots.staticRoot, `.${publicPath}`);
		const bytes = await readFile(sourcePath);
		const sourceSha256 = sha256(bytes);
		const metadata = await sharp(bytes).metadata();
		if (!metadata.width) return;
		const variants = variantsFor(publicPath, metadata.width);
		const entry: ResponsiveImageLockEntry = {
			source_sha256: sourceSha256,
			width: metadata.width,
			variants,
		};
		const unchanged = previous[publicPath]?.source_sha256 === sourceSha256;
		for (const variant of variants) {
			const outputPath = resolve(roots.staticRoot, `.${variant}`);
			if (unchanged && (await isPresent(outputPath))) {
				totals.current += 1;
				continue;
			}
			const width = Number(variant.match(/-(\d+)\.(?:avif|webp)$/)?.[1]);
			await mkdir(resolve(outputPath, '..'), { recursive: true });
			const pipeline = sharp(bytes).rotate().resize({ width, withoutEnlargement: true });
			if (variant.endsWith('.avif'))
				await pipeline.avif(RESPONSIVE_IMAGE_PARAMS.avif).toFile(outputPath);
			else await pipeline.webp(RESPONSIVE_IMAGE_PARAMS.webp).toFile(outputPath);
			totals.generated += 1;
		}
		sources[publicPath] = entry;
	}

	await Promise.all(
		Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
			for (let next = queue.shift(); next; next = queue.shift()) await processOne(next);
		}),
	);

	const expected = new Set(Object.values(sources).flatMap((entry) => entry.variants));
	const outputRoot = resolve(roots.staticRoot, '_responsive');
	for (const file of await filesUnder(outputRoot)) {
		const publicPath = `/${relative(roots.staticRoot, file).split(sep).join('/')}`;
		if (expected.has(publicPath)) continue;
		await rm(file);
		totals.pruned += 1;
	}

	const lock: ResponsiveImageLock = {
		version: RESPONSIVE_IMAGE_LOCK_VERSION,
		params: RESPONSIVE_IMAGE_PARAMS,
		sources: Object.fromEntries(
			Object.keys(sources)
				.sort()
				.map((key) => [key, sources[key]!]),
		),
	};
	await writeFile(roots.lockPath, `${JSON.stringify(lock, null, '\t')}\n`);
	return totals;
}

export async function checkResponsiveImages(roots: ResponsiveImageRoots): Promise<string[]> {
	const lock = await readLock(roots.lockPath);
	if (!lock) return [`responsive image lock is missing or outdated: ${roots.lockPath}`];
	const referenced = await referencedRasterImages(roots.contentRoot, roots.staticRoot);
	const problems: string[] = [];
	for (const publicPath of referenced) {
		const entry = lock.sources[publicPath];
		if (!entry) {
			problems.push(`missing lock entry for ${publicPath}`);
			continue;
		}
		const sourceSha256 = sha256(await readFile(resolve(roots.staticRoot, `.${publicPath}`)));
		if (entry.source_sha256 !== sourceSha256)
			problems.push(`source changed since generation: ${publicPath}`);
		const expected = variantsFor(publicPath, entry.width);
		if (JSON.stringify(expected) !== JSON.stringify(entry.variants)) {
			problems.push(`variant list is stale for ${publicPath}`);
		}
		for (const variant of entry.variants) {
			if (!(await isPresent(resolve(roots.staticRoot, `.${variant}`)))) {
				problems.push(`missing variant ${variant}`);
			}
		}
	}
	const referencedSet = new Set(referenced);
	for (const publicPath of Object.keys(lock.sources)) {
		if (!referencedSet.has(publicPath))
			problems.push(`stale lock entry for unreferenced ${publicPath}`);
	}
	return problems;
}
