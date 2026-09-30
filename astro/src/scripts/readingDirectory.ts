/**
 * Section directories (精选阅读, 术语, Skills, Design): filter grouped lists by text and,
 * where offered, by a filter button. Without JS everything shows.
 *
 * Markup: [data-reading-directory] holds [data-reading-search], optional [data-reading-filter]
 * buttons, [data-reading-group] groups of [data-reading-item] (each with data-search text),
 * an optional [data-reading-count] per group and a [data-reading-empty] note.
 */
function setupReadingDirectory(root: HTMLElement) {
	if (root.dataset.ready) return;
	root.dataset.ready = 'true';
	const search = root.querySelector<HTMLInputElement>('[data-reading-search]');
	const filters = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-reading-filter]'));
	const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-reading-group]'));
	const empty = root.querySelector<HTMLElement>('[data-reading-empty]');
	const unit = root.dataset.readingUnit ?? '';
	let filter = '';

	function apply() {
		const words = (search?.value ?? '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
		let shown = 0;
		for (const group of groups) {
			const inFilter = !filter || group.dataset.readingGroup === filter;
			let count = 0;
			for (const item of group.querySelectorAll<HTMLElement>('[data-reading-item]')) {
				const text = item.dataset.search ?? '';
				const match = inFilter && words.every((word) => text.includes(word));
				item.hidden = !match;
				if (match) count += 1;
			}
			group.hidden = count === 0;
			const label = group.querySelector<HTMLElement>('[data-reading-count]');
			if (label) label.textContent = `${count}${unit ? ` ${unit}` : ''}`;
			shown += count;
		}
		if (empty) empty.hidden = shown > 0;
	}

	search?.addEventListener('input', apply);
	filters.forEach((button) =>
		button.addEventListener('click', () => {
			filter = button.dataset.readingFilter ?? '';
			filters.forEach((other) =>
				other.setAttribute('aria-pressed', other === button ? 'true' : 'false'),
			);
			apply();
		}),
	);
}

function initReadingDirectory() {
	document.querySelectorAll<HTMLElement>('[data-reading-directory]').forEach(setupReadingDirectory);
}

document.addEventListener('astro:page-load', initReadingDirectory);
