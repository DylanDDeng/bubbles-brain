import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkResponsiveImages, generateResponsiveImages } from './responsiveImages';

let root: string;
let roots: { contentRoot: string; staticRoot: string; lockPath: string };

async function writeSource(name: string, width: number, color: string): Promise<void> {
	await sharp({ create: { width, height: 100, channels: 3, background: color } })
		.png()
		.toFile(join(roots.staticRoot, 'media', name));
}

beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 'responsive-images-'));
	roots = {
		contentRoot: join(root, 'content'),
		staticRoot: join(root, 'static'),
		lockPath: join(root, 'responsive-images.lock.json'),
	};
	await mkdir(join(roots.contentRoot, 'daily'), { recursive: true });
	await mkdir(join(roots.staticRoot, 'media'), { recursive: true });
	await writeSource('wide.png', 1000, '#ff0000');
	await writeFile(
		join(roots.contentRoot, 'daily', 'post.md'),
		'# Post\n\n![Wide](/media/wide.png)\n\n![Missing](/media/missing.png)\n',
	);
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

describe('responsive image lock', () => {
	it('generates every variant once and then reports the tree as current', async () => {
		const first = await generateResponsiveImages(roots, 2);
		expect(first).toEqual({ referenced: 1, generated: 6, current: 0, pruned: 0 });

		const lock = JSON.parse(await readFile(roots.lockPath, 'utf8'));
		expect(lock.sources['/media/wide.png'].variants).toEqual([
			'/_responsive/media/wide-640.avif',
			'/_responsive/media/wide-640.webp',
			'/_responsive/media/wide-960.avif',
			'/_responsive/media/wide-960.webp',
			'/_responsive/media/wide-1000.avif',
			'/_responsive/media/wide-1000.webp',
		]);
		await expect(checkResponsiveImages(roots)).resolves.toEqual([]);

		const second = await generateResponsiveImages(roots, 2);
		expect(second).toEqual({ referenced: 1, generated: 0, current: 6, pruned: 0 });
	});

	it('fails the check when a referenced source changes without regeneration', async () => {
		await generateResponsiveImages(roots, 2);
		await writeSource('wide.png', 1000, '#00ff00');
		await expect(checkResponsiveImages(roots)).resolves.toEqual([
			'source changed since generation: /media/wide.png',
		]);

		const regenerated = await generateResponsiveImages(roots, 2);
		expect(regenerated.generated).toBe(6);
		await expect(checkResponsiveImages(roots)).resolves.toEqual([]);
	});

	it('fails the check for missing variants and newly referenced images', async () => {
		await generateResponsiveImages(roots, 2);
		await rm(join(roots.staticRoot, '_responsive', 'media', 'wide-640.avif'));
		await writeSource('tall.png', 700, '#0000ff');
		await writeFile(join(roots.contentRoot, 'daily', 'more.md'), '<img src="/media/tall.png">\n');

		const problems = await checkResponsiveImages(roots);
		expect(problems).toContain('missing lock entry for /media/tall.png');
		expect(problems).toContain('missing variant /_responsive/media/wide-640.avif');
	});

	it('prunes variants and lock entries for images that are no longer referenced', async () => {
		await generateResponsiveImages(roots, 2);
		await writeFile(join(roots.contentRoot, 'daily', 'post.md'), '# Post\n');
		await expect(checkResponsiveImages(roots)).resolves.toEqual([
			'stale lock entry for unreferenced /media/wide.png',
		]);

		const pruned = await generateResponsiveImages(roots, 2);
		expect(pruned).toEqual({ referenced: 0, generated: 0, current: 0, pruned: 6 });
		await expect(checkResponsiveImages(roots)).resolves.toEqual([]);
	});

	it('rejects a lock written with different encoder parameters', async () => {
		await generateResponsiveImages(roots, 2);
		const lock = JSON.parse(await readFile(roots.lockPath, 'utf8'));
		lock.params.avif.quality = 60;
		await writeFile(roots.lockPath, JSON.stringify(lock));
		await expect(checkResponsiveImages(roots)).resolves.toEqual([
			`responsive image lock is missing or outdated: ${roots.lockPath}`,
		]);
	});
});
