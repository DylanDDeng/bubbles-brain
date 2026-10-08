import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { showcaseWorks } from '../data/showcase';
import versions from '../data/showcaseMedia.json';
import {
	showcaseFiles,
	showcaseMediaUrl,
	showcasePosterSrcset,
	showcasePreviewPath,
} from './showcaseMedia';

const staticRoot = resolve(import.meta.dirname, '../../../static');
const local = (publicPath: string) => resolve(staticRoot, `.${publicPath}`);
const regenerate = 'run `npm run showcase:media` and commit the result';

describe('showcase media', () => {
	it('has a small hover preview for every work', async () => {
		for (const work of showcaseWorks) {
			const preview = showcasePreviewPath(work.video);
			const size = await stat(local(preview)).then(
				(file) => file.size,
				() => 0,
			);
			expect(size, `${preview} is missing; ${regenerate}`).toBeGreaterThan(0);
			expect(size, `${preview} is too heavy for a hover preview`).toBeLessThan(2 * 1024 * 1024);
		}
	});

	it('versions every file with its current content hash', async () => {
		const expected: Record<string, string> = {};
		for (const work of showcaseWorks) {
			for (const path of showcaseFiles(work)) {
				expected[path] = createHash('sha256')
					.update(await readFile(local(path)))
					.digest('hex')
					.slice(0, 10);
			}
		}
		expect(versions, `showcaseMedia.json is stale; ${regenerate}`).toEqual(expected);
		const work = showcaseWorks[0]!;
		expect(showcaseMediaUrl(work.video)).toBe(`${work.video}?v=${expected[work.video]}`);
	});

	it('keeps a multi-part work consistent with its first part', () => {
		for (const work of showcaseWorks.filter((entry) => entry.movements?.length)) {
			const [first] = work.movements!;
			expect(work.video).toBe(first!.video);
			expect(work.poster).toBe(first!.poster);
			expect(work.duration).toBe(
				work.movements!.reduce((total, movement) => total + movement.duration, 0),
			);
		}
	});

	it('serves every poster in sizes for the gallery tiles', () => {
		for (const work of showcaseWorks) {
			const srcset = showcasePosterSrcset(work.poster, 'avif');
			expect(
				srcset,
				`${work.poster} has no responsive variants; run \`npm run images:generate\``,
			).toMatch(/-640\.avif 640w/);
		}
	});
});
