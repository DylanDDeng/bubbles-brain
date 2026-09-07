import { vibeCodingTermCategories } from '../data/vibeCodingTerms';

/** Reuse the published taxonomy and keep its semantic groups together when paging. */
export function buildBrainPodTerms() {
	return vibeCodingTermCategories.map((category) => {
		const pages: { id: string; group?: string; terms: typeof category.terms }[] = [];
		for (const term of category.terms) {
			let page = pages.at(-1);
			if (!page || page.terms.length === 6 || page.group !== term.group) {
				page = {
					id: `vibe-coding-terms-${category.id}${pages.length ? `-${pages.length + 1}` : ''}`,
					group: term.group,
					terms: [],
				};
				pages.push(page);
			}
			page.terms.push(term);
		}
		return { id: category.id, label: category.label, pages };
	});
}

/** Return from any detail route to the page containing that exact term. */
export function brainPodTermReturn(id: string) {
	for (const category of buildBrainPodTerms()) {
		const page =
			category.id === id
				? category.pages[0]
				: category.pages.find((page) => page.terms.some((term) => term.id === id));
		if (page) return `/#bc-${page.id}`;
	}
	return '/#bc-vibe-coding-terms';
}
