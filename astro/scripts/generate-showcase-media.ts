/**
 * Showcase media upkeep. For every work it
 *   1. cuts a short, silent, 640px-wide hover preview (`<id>-preview.mp4`) when one is missing,
 *      starting after any black opening so the tile does not play a dark frame;
 *   2. writes src/data/showcaseMedia.json, a content hash per file. Pages link `?v=<hash>`, which
 *      lets /media/showcase/* be cached for a year: a re-encoded file gets a new URL.
 *
 * Needs ffmpeg only when a preview has to be cut. `--force` re-cuts every preview.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { showcaseWorks } from '../src/data/showcase';
import { showcaseFiles, showcasePreviewPath } from '../src/lib/showcaseMedia';

const astroRoot = resolve(import.meta.dirname, '..');
const staticRoot = resolve(astroRoot, '../static');
const manifestPath = resolve(astroRoot, 'src/data/showcaseMedia.json');
const force = process.argv.includes('--force');

const PREVIEW_SECONDS = 6;

const local = (publicPath: string) => resolve(staticRoot, `.${publicPath}`);

async function exists(path: string) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function ffmpeg(args: string[]) {
	const run = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], { encoding: 'utf8' });
	if (run.error) throw new Error(`ffmpeg is needed to cut previews: ${run.error.message}`);
	return run;
}

/** Seconds of black at the very start of the film (0 when it opens on a picture). */
function blackOpening(video: string): number {
	const run = ffmpeg([
		'-t',
		'10',
		'-i',
		video,
		'-an',
		'-vf',
		'blackdetect=d=0.05:pix_th=0.1',
		'-f',
		'null',
		'-',
	]);
	const first = run.stderr.match(/black_start:([\d.]+) black_end:([\d.]+)/);
	return first && Number(first[1]) < 0.05 ? Number(first[2]) : 0;
}

function cutPreview(video: string, preview: string, duration: number) {
	const start = Math.max(0, Math.min(blackOpening(video), duration - PREVIEW_SECONDS));
	const run = ffmpeg([
		'-y',
		'-ss',
		start.toFixed(2),
		'-t',
		String(PREVIEW_SECONDS),
		'-i',
		video,
		'-an',
		'-vf',
		'scale=640:-2,fps=30',
		'-c:v',
		'libx264',
		'-preset',
		'slow',
		'-crf',
		'28',
		'-pix_fmt',
		'yuv420p',
		'-movflags',
		'+faststart',
		preview,
	]);
	if (run.status !== 0) throw new Error(`ffmpeg failed for ${video}:\n${run.stderr}`);
	return start;
}

const hash = async (path: string) =>
	createHash('sha256')
		.update(await readFile(path))
		.digest('hex')
		.slice(0, 10);

let cut = 0;
const versions: Record<string, string> = {};
for (const work of showcaseWorks) {
	const preview = showcasePreviewPath(work.video);
	if (force || !(await exists(local(preview)))) {
		const start = cutPreview(local(work.video), local(preview), work.duration);
		console.log(`cut ${preview} from ${start.toFixed(1)}s`);
		cut += 1;
	}
	for (const path of showcaseFiles(work)) versions[path] = await hash(local(path));
}

const sorted = Object.fromEntries(
	Object.keys(versions)
		.sort()
		.map((key) => [key, versions[key]]),
);
await writeFile(manifestPath, `${JSON.stringify(sorted, null, '\t')}\n`);
console.log(
	`Showcase media: ${showcaseWorks.length} works, ${cut} previews cut, versions written.`,
);
