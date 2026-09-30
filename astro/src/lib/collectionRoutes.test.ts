import { describe, expect, it } from 'vitest';
import {
	collectionDirectories,
	collectionHome,
	collectionHomes,
	collectionHref,
	isCollectionDirectory,
	isRetiredDirectory,
	rehypeCollectionLinks,
	retiredDirectories,
} from './collectionRoutes';
import { loadSiteManifest } from './siteManifest';
import { loadLegacyContent } from './legacyContent';
import { renderCloudflareRedirects } from './redirectManifest';
import { buildBrainPodLibrary } from './brainpod';
import { buildKnowledgeSearchIndex } from './searchIndex';
import { roomAnchorTarget } from '../scripts/homeRedirects';

describe('collection directories', () => {
	it('gives every collection one directory home, and keeps only the series paths retired', async () => {
		const manifest = await loadSiteManifest();
		const redirects = renderCloudflareRedirects(await loadLegacyContent());
		for (const [route, id] of Object.entries(collectionDirectories)) {
			expect(collectionHref(route)).toBe(collectionHomes[id]);
			expect(redirects.split('\n').some((line) => line.startsWith(`${route} `))).toBe(false);
			expect(isCollectionDirectory(route)).toBe(true);
			const retired = retiredDirectories.includes(route);
			expect(isRetiredDirectory(route)).toBe(retired);
			// A retired path has no page; every other directory is a real, listed page.
			expect(manifest.some((record) => record.route === route)).toBe(!retired);
		}
		for (const route of ['/tutorials/', '/highlights/', '/vibe-coding/', '/benchmarks/'])
			expect(manifest.some((record) => record.route === route)).toBe(true);
		expect(isRetiredDirectory('/highlights/2025/')).toBe(true);
	});
	it('sends tutorial series to their anchor on the shared tutorials page', () => {
		expect(collectionHome('newbie-tutorials')).toBe('/tutorials/#newbie-tutorials');
		expect(collectionHref('/codex-tutorials/')).toBe('/tutorials/#codex-tutorials');
	});
	it('preserves article identities, English pages and external source links', () => {
		for (const href of [
			'/workbuddy-tutorials/workbuddy-feishu-workflow-guide/',
			'/en/highlights/',
			'/vibe-coding/terms/frontend/',
			'https://example.com/highlights/',
			'//example.com/highlights/',
		]) {
			expect(collectionHref(href)).toBe(href);
			expect(isRetiredDirectory(href)).toBe(false);
		}
	});
	it('rewrites historical Markdown directory links and old home-room anchors', () => {
		const tree = {
			type: 'root',
			children: [
				{ type: 'element', tagName: 'a', properties: { href: '/highlights/2025/#july' } },
				{
					type: 'element',
					tagName: 'a',
					properties: { href: '/workbuddy-tutorials/workbuddy-beginner-guide/' },
				},
				{ type: 'element', tagName: 'a', properties: { href: '/#bc-vibe-coding-skills' } },
			],
		};
		rehypeCollectionLinks()(tree);
		expect(tree.children[0].properties.href).toBe('/highlights/');
		expect(tree.children[1].properties.href).toBe('/workbuddy-tutorials/workbuddy-beginner-guide/');
		expect(tree.children[2].properties.href).toBe('/vibe-coding/skills/');
	});
	it('redirects old home-room anchors on the home page to their directory pages', () => {
		expect(roomAnchorTarget('#bc-highlights')).toBe('/highlights/');
		expect(roomAnchorTarget('#bc-tutorials')).toBe('/tutorials/');
		expect(roomAnchorTarget('#bc-pi-agent-tutorials')).toBe('/tutorials/#pi-agent-tutorials');
		expect(roomAnchorTarget('#bc-vibe-coding-terms-ui-patterns-3')).toBe(
			'/vibe-coding/terms/#ui-patterns',
		);
		expect(roomAnchorTarget('#bc-benchmarks-coding')).toBe('/benchmarks/#coding');
		expect(roomAnchorTarget('#top')).toBeUndefined();
	});
	it('keeps every published entry accessible from its collection', async () => {
		const index = await buildKnowledgeSearchIndex({ locale: 'zh-CN' });
		const library = buildBrainPodLibrary(index);
		for (const collection of library.collections) {
			expect(collection.href).toBe(collectionHomes[collection.id]);
			expect(collection.items.map((item) => item.key)).toEqual(
				index.items.filter((item) => item.section === collection.id).map((item) => item.key),
			);
		}
	});
});
