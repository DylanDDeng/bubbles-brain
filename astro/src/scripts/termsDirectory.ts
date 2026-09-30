/**
 * 术语 directory: one category at a time, picked in the left rail (and kept in the address as
 * #category, which is where term pages link back to). Typing in the search box looks across
 * every category instead. Without JS every category shows, one after another.
 */
function setupTermsDirectory(root: HTMLElement) {
	if (root.dataset.ready) return;
	root.dataset.ready = 'true';
	const tabs = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-terms-tab]'));
	const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-terms-group]'));
	const search = root.querySelector<HTMLInputElement>('[data-terms-search]');
	const empty = root.querySelector<HTMLElement>('[data-terms-empty]');
	const body = root.querySelector<HTMLElement>('.terms-body');
	if (!groups.length) return;

	const current = () => {
		const id = decodeURIComponent(location.hash.slice(1));
		return groups.some((group) => group.dataset.termsGroup === id)
			? id
			: (groups[0].dataset.termsGroup ?? '');
	};

	function apply() {
		const words = (search?.value ?? '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
		const searching = words.length > 0;
		const active = searching ? '' : current();
		let shown = 0;
		for (const group of groups) {
			let inGroup = 0;
			for (const sub of group.querySelectorAll<HTMLElement>('[data-terms-sub]')) {
				let inSub = 0;
				for (const item of sub.querySelectorAll<HTMLElement>('[data-terms-item]')) {
					const match = words.every((word) => (item.dataset.search ?? '').includes(word));
					item.hidden = !match;
					if (match) inSub += 1;
				}
				sub.hidden = inSub === 0;
				inGroup += inSub;
			}
			group.hidden = searching ? inGroup === 0 : group.dataset.termsGroup !== active;
			if (!group.hidden) shown += inGroup;
		}
		for (const tab of tabs) {
			if (tab.dataset.termsTab === active) tab.setAttribute('aria-current', 'true');
			else tab.removeAttribute('aria-current');
		}
		if (empty) empty.hidden = shown > 0;
	}

	for (const tab of tabs) {
		tab.addEventListener('click', (event) => {
			event.preventDefault();
			if (search) search.value = '';
			history.replaceState(history.state, '', `#${tab.dataset.termsTab}`);
			apply();
			// Keep the reader at the top of the list rather than wherever the last category ended.
			if (body && body.getBoundingClientRect().top < 0) body.scrollIntoView();
		});
	}
	search?.addEventListener('input', apply);
	window.addEventListener('hashchange', apply);
	document.addEventListener('astro:before-swap', () => window.removeEventListener('hashchange', apply), {
		once: true,
	});
	root.classList.add('is-enhanced');
	apply();
}

function initTermsDirectory() {
	document.querySelectorAll<HTMLElement>('[data-terms-directory]').forEach(setupTermsDirectory);
}

document.addEventListener('astro:page-load', initTermsDirectory);
