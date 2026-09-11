const PAGE_SIZE = 5;

/** Enhance the complete server-rendered list without creating a second directory route. */
export function mountCollectionLists(room: HTMLElement, signal: AbortSignal) {
	for (const list of room.querySelectorAll<HTMLElement>('[data-collection-list]')) {
		const items = Array.from(list.querySelectorAll<HTMLElement>('[data-list-item]'));
		const search = list.querySelector<HTMLInputElement>('[data-list-search]')!;
		const year = list.querySelector<HTMLSelectElement>('[data-list-year]');
		const previous = list.querySelector<HTMLButtonElement>('[data-list-prev]')!;
		const next = list.querySelector<HTMLButtonElement>('[data-list-next]')!;
		const status = list.querySelector<HTMLElement>('[data-list-status]')!;
		const pagination = list.querySelector<HTMLElement>('[data-list-pagination]')!;
		const key = `collection-list:${list.dataset.collectionList}`;
		let page = 0;
		try {
			const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
			if (saved && Number.isInteger(saved.page) && saved.page >= 0) {
				page = saved.page;
				search.value = typeof saved.query === 'string' ? saved.query : '';
				if (year) year.value = typeof saved.year === 'string' ? saved.year : '';
			}
		} catch {
			/* Browsing works without session storage. */
		}
		function paint() {
			const query = search.value.trim().toLocaleLowerCase();
			const matched = items.filter(
				(item) =>
					(item.dataset.search || '').includes(query) &&
					(!year?.value || item.dataset.year === year.value),
			);
			const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
			page = Math.max(0, Math.min(page, pages - 1));
			const visible = new Set(matched.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));
			items.forEach((item) => {
				item.hidden = !visible.has(item);
			});
			list.querySelector<HTMLElement>('[data-list-empty]')!.hidden = matched.length > 0;
			pagination.hidden = matched.length === 0 || items.length <= PAGE_SIZE;
			previous.disabled = page === 0;
			next.disabled = page === pages - 1;
			status.textContent = `${page + 1} / ${pages} · ${matched.length} 篇`;
			try {
				sessionStorage.setItem(
					key,
					JSON.stringify({ page, query: search.value, year: year?.value || '' }),
				);
			} catch {
				/* Optional. */
			}
		}
		list.querySelector<HTMLElement>('[data-list-controls]')!.hidden = items.length <= PAGE_SIZE;
		search.addEventListener(
			'input',
			() => {
				page = 0;
				paint();
			},
			{ signal },
		);
		year?.addEventListener(
			'change',
			() => {
				page = 0;
				paint();
			},
			{ signal },
		);
		previous.addEventListener(
			'click',
			() => {
				page--;
				paint();
			},
			{ signal },
		);
		next.addEventListener(
			'click',
			() => {
				page++;
				paint();
			},
			{ signal },
		);
		paint();
	}
}
