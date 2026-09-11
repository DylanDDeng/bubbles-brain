import { describe, expect, it } from 'vitest';
import {
	collectionDirectories,
	collectionHref,
	isRetiredDirectory,
	rehypeCollectionLinks,
} from './collectionRoutes';
import { loadSiteManifest } from './siteManifest';
import { loadLegacyContent } from './legacyContent';
import { renderCloudflareRedirects } from './redirectManifest';
import { buildBrainPodLibrary } from './brainpod';
import { buildKnowledgeSearchIndex } from './searchIndex';

describe('single collection directory', () => {
	it('removes duplicate routes without adding compatibility redirects', async () => {
		const manifest = await loadSiteManifest();
		const redirects = renderCloudflareRedirects(await loadLegacyContent());
		for (const [route, id] of Object.entries(collectionDirectories)) {
			expect(collectionHref(route)).toBe(`/#bc-${id}`);
			expect(manifest.some((record) => record.route === route)).toBe(false);
			expect(redirects.split('\n').some((line) => line.startsWith(`${route} `))).toBe(false);
		}
		expect(isRetiredDirectory('/highlights/2025/')).toBe(true);
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
	it('rewrites historical Markdown directory links during rendering', () => {
		const tree = {
			type: 'root',
			children: [
				{ type: 'element', tagName: 'a', properties: { href: '/highlights/2025/#july' } },
				{
					type: 'element',
					tagName: 'a',
					properties: { href: '/workbuddy-tutorials/workbuddy-beginner-guide/' },
				},
			],
		};
		rehypeCollectionLinks()(tree);
		expect(tree.children[0].properties.href).toBe('/#bc-highlights');
		expect(tree.children[1].properties.href).toBe('/workbuddy-tutorials/workbuddy-beginner-guide/');
	});
	it('keeps every published entry accessible from the same collection', async () => {
		const index = await buildKnowledgeSearchIndex({ locale: 'zh-CN' });
		const library = buildBrainPodLibrary(index);
		for (const collection of library.collections) {
			expect(collection.href).toBe(`/#bc-${collection.id}`);
			expect(collection.items.map((item) => item.key)).toEqual(
				index.items.filter((item) => item.section === collection.id).map((item) => item.key),
			);
		}
	});
});
