import { describe, expect, it } from 'vitest';
import { vibeCodingTermCategories, getVibeCodingConcepts } from '../data/vibeCodingTerms';
import { brainPodTermReturn, buildBrainPodTerms } from './brainpodTerms';

describe('Collection room term directory', () => {
	it('returns detail pages to their matching category and pagination position', () => {
		for (const category of buildBrainPodTerms()) {
			expect(brainPodTermReturn(category.id)).toBe(`/#bc-${category.pages[0].id}`);
			for (const page of category.pages)
				for (const term of page.terms) expect(brainPodTermReturn(term.id)).toBe(`/#bc-${page.id}`);
		}
		expect(brainPodTermReturn('missing')).toBe('/#bc-vibe-coding-terms');
	});
	it('includes every published term once, in its original category and order', () => {
		const directory = buildBrainPodTerms();
		expect(directory.map((category) => category.id)).toEqual(
			vibeCodingTermCategories.map((category) => category.id),
		);
		for (const [index, category] of directory.entries()) {
			expect(category.pages.flatMap((page) => page.terms)).toEqual(
				vibeCodingTermCategories[index].terms,
			);
		}
	});
	it('uses unique deep links and preserves group boundaries on short pages', () => {
		const pages = buildBrainPodTerms().flatMap((category) => category.pages);
		expect(new Set(pages.map((page) => page.id)).size).toBe(pages.length);
		expect(pages.some((page) => page.id === 'vibe-coding-terms-ui-patterns')).toBe(true);
		const published = new Set(getVibeCodingConcepts().map((concept) => concept.id));
		for (const page of pages) {
			expect(page.terms.length).toBeGreaterThan(0);
			expect(page.terms.length).toBeLessThanOrEqual(6);
			expect(page.terms.every((term) => term.group === page.group && published.has(term.id))).toBe(
				true,
			);
		}
	});
});
