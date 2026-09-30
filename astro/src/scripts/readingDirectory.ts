/** 精选阅读 directory: filter the month-grouped list by text and year. Without JS everything shows. */
function setupReadingDirectory(root: HTMLElement) {
	if (root.dataset.ready) return;
	root.dataset.ready = 'true';
	const search = root.querySelector<HTMLInputElement>('[data-reading-search]');
	const yearButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-reading-year]'));
	const months = Array.from(root.querySelectorAll<HTMLElement>('[data-reading-month]'));
	const empty = root.querySelector<HTMLElement>('[data-reading-empty]');
	let year = '';

	function apply() {
		const words = (search?.value ?? '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
		let shown = 0;
		for (const month of months) {
			const inYear = !year || month.dataset.readingMonth === year;
			let count = 0;
			for (const item of month.querySelectorAll<HTMLElement>('[data-reading-item]')) {
				const text = item.dataset.search ?? '';
				const match = inYear && words.every((word) => text.includes(word));
				item.hidden = !match;
				if (match) count += 1;
			}
			month.hidden = count === 0;
			const label = month.querySelector<HTMLElement>('[data-reading-count]');
			if (label) label.textContent = `${count} 篇`;
			shown += count;
		}
		if (empty) empty.hidden = shown > 0;
	}

	search?.addEventListener('input', apply);
	yearButtons.forEach((button) =>
		button.addEventListener('click', () => {
			year = button.dataset.readingYear ?? '';
			yearButtons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
			apply();
		}),
	);
}

function initReadingDirectory() {
	document.querySelectorAll<HTMLElement>('[data-reading-directory]').forEach(setupReadingDirectory);
}

document.addEventListener('astro:page-load', initReadingDirectory);
