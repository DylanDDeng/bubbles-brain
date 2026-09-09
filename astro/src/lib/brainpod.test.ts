import { describe, expect, it } from 'vitest';
import { buildBrainPodLibrary } from './brainpod';
import { buildKnowledgeSearchIndex } from './searchIndex';
import type { ChangelogItem } from '../data/changelog';

describe('BrainPod integration with the published knowledge index', () => {
	it('keeps article identity and external-source behavior from the shared index', async () => {
		const index = await buildKnowledgeSearchIndex({ locale: 'zh-CN' });
		const library = buildBrainPodLibrary(index);
		expect(library.collections).toHaveLength(9);
		expect(new Set(library.items.map((item) => item.key)).size).toBe(library.items.length);
		expect(library.items.some((item) => item.external)).toBe(true);
		expect(library.items.some((item) => ['about', 'x-trending'].includes(item.section))).toBe(
			false,
		);
		for (const item of library.items) {
			const source = index.items.find((source) => source.key === item.key);
			expect(source).toBeDefined();
			expect(item).toMatchObject({
				href: source!.href,
				title: source!.title,
				summary: source!.summary,
				external: source!.external,
			});
		}
		expect(new Set(library.collections.flatMap((c) => c.items.map((i) => i.href)))).toEqual(
			new Set(library.items.map((i) => i.href)),
		);
	});
	it('builds learning paths exclusively from available published articles', async () => {
		const index = await buildKnowledgeSearchIndex({ locale: 'zh-CN' });
		const library = buildBrainPodLibrary(index);
		expect(library.playlists.start.items[0].href).toBe('/newbie-tutorials/how-llms-are-trained/');
		for (const playlist of Object.values(library.playlists)) {
			expect(playlist.items.length).toBeGreaterThan(0);
			expect(playlist.items.every((item) => library.items.includes(item))).toBe(true);
		}
		const missingFirst = {
			...index,
			items: index.items.filter((i) => i.href !== library.playlists.start.items[0].href),
		};
		expect(buildBrainPodLibrary(missingFirst).playlists.start.items).not.toContainEqual(
			library.playlists.start.items[0],
		);
	});
	it('recommends an available article and removes the recommendation when it is unavailable', async () => {
		const index = await buildKnowledgeSearchIndex({ locale: 'zh-CN' });
		const library = buildBrainPodLibrary(index);
		expect(library.featured?.item.key).toBe('/newbie-tutorials/how-llms-are-trained/');
		expect(library.items).toContain(library.featured?.item);
		expect(library.featured?.reason).toBeTruthy();
		const withoutFeatured = {
			...index,
			items: index.items.filter((item) => item.key !== library.featured?.item.key),
		};
		expect(buildBrainPodLibrary(withoutFeatured).featured).toBeNull();
	});
	it('uses the newest site update date, deduplicates articles and omits non-content links', async () => {
		const index = await buildKnowledgeSearchIndex({ locale: 'zh-CN' });
		const first = index.items.find((item) => item.section === 'highlights' && !item.external)!;
		const second = index.items.find((item) => item.external)!;
		const update = (date: string, hrefs: string[]): ChangelogItem => ({
			date,
			title: '更新',
			tag: '测试',
			type: 'content',
			summary: '',
			links: hrefs.map((href) => ({ href, label: '阅读' })),
		});
		const library = buildBrainPodLibrary(index, [
			update('2026-09-01', [first.key]),
			update('2026-09-04', [
				'/search/',
				first.key,
				first.key,
				'/missing/',
				'/newbie-tutorials/how-llms-are-trained/',
			]),
			update('2026-09-03', [second.key]),
		]);
		expect(library.recent.map(({ item, recordedAt }) => [item.key, recordedAt])).toEqual([
			[first.key, '2026-09-04'],
			[second.key, '2026-09-03'],
		]);
		expect(library.recent[0].item.date).toBe(first.date);
		expect(library.recent[1].item.external).toBe(true);
		expect(library.recent[1].item.href).toBe(second.href);
	});
	it('limits recent notes to three available articles without duplicating the featured pick', async () => {
		const index = await buildKnowledgeSearchIndex({ locale: 'zh-CN' });
		const available = buildBrainPodLibrary(index).items;
		const updates: ChangelogItem[] = [
			{
				date: '2026-09-04',
				title: '更新',
				tag: '测试',
				type: 'content',
				summary: '',
				links: available.map((item) => ({ label: item.title, href: item.key })),
			},
		];
		const library = buildBrainPodLibrary(index, updates);
		expect(library.recent).toHaveLength(3);
		expect(
			library.recent.every(
				({ item }) => library.items.includes(item) && item.key !== library.featured?.item.key,
			),
		).toBe(true);
	});
	it('does not invent collection dates when no site update record exists', async () => {
		const index = await buildKnowledgeSearchIndex({ locale: 'zh-CN' });
		expect(buildBrainPodLibrary(index, []).recent).toEqual([]);
	});
});
