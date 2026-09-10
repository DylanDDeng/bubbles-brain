import { describe, expect, it } from 'vitest';
import { vibeCodingTermCategories, getVibeCodingConcepts } from '../data/vibeCodingTerms';
import { vibeCodingPatternProfiles } from '../data/vibeCodingPatternDetails';
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
	it('places Divider after Section in the UI layout group with a detail route', () => {
		const terms = vibeCodingTermCategories.find((category) => category.id === 'ui-patterns')!.terms;
		const sectionIndex = terms.findIndex((term) => term.id === 'section');
		expect(terms[sectionIndex + 1]).toMatchObject({
			id: 'divider',
			name: 'Divider',
			chineseName: '分割线',
			group: '布局骨架',
		});
		expect(getVibeCodingConcepts().filter((concept) => concept.id === 'divider')).toEqual([
			expect.objectContaining({ categoryId: 'ui-patterns', isCategory: false }),
		]);
		expect(brainPodTermReturn('divider')).toBe('/#bc-vibe-coding-terms-ui-patterns-2');
	});
	it('gives Divider a complete illustrated profile with recognition and quiz feedback', () => {
		const profile = vibeCodingPatternProfiles.divider;
		expect(profile).toBeDefined();
		expect(profile.parts).toHaveLength(4);
		expect(profile.variants.map((variant) => variant.sketch)).toEqual([
			'dv-horizontal',
			'dv-vertical',
			'dv-label',
		]);
		expect(
			profile.spot!.regions.filter((region) => region.correct).map((region) => region.id),
		).toEqual(['divider']);
		expect(profile.quiz!.options.filter((option) => option.correct)).toHaveLength(1);
		for (const text of [
			profile.question,
			profile.anatomyIntro,
			...profile.parts.map((part) => part.note),
			...profile.variants.map((variant) => variant.description),
			...profile.spot!.regions.map((region) => region.note),
			...profile.quiz!.options.map((option) => option.feedback),
			...profile.usage.fit,
			...profile.usage.unfit,
			...profile.prompts,
			profile.promptTip,
			profile.warning,
		])
			expect(text.trim().length).toBeGreaterThan(0);
		expect(profile.usage.fit.length).toBeGreaterThan(0);
		expect(profile.usage.unfit.length).toBeGreaterThan(0);
		expect(profile.prompts).toHaveLength(4);
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
