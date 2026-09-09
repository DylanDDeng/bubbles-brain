// Column sorting for the benchmark ledger. Server-rendered order (headline
// column, descending) is the no-JS baseline; this only reorders existing rows.
let cleanup = () => {};

function setupBenchmarkSort() {
	cleanup();
	cleanup = () => {};
	const table = document.querySelector<HTMLTableElement>('[data-bench-table]');
	if (!table) return;
	const body = table.tBodies[0];
	if (!body) return;
	const controller = new AbortController();
	cleanup = () => controller.abort();

	const headers = [...table.querySelectorAll<HTMLTableCellElement>('thead th')];
	const rows = () => [...body.querySelectorAll<HTMLTableRowElement>('tr')];
	const collator = new Intl.Collator(document.documentElement.lang || 'zh-CN');

	const cellValue = (row: HTMLTableRowElement, column: number, numeric: boolean) => {
		if (!numeric) {
			const key = headers[column]?.querySelector<HTMLElement>('[data-sort]')?.dataset.sort ?? '';
			return row.dataset[key] ?? '';
		}
		const raw = row.cells[column]?.dataset.value;
		return raw === undefined || raw === '' ? Number.NEGATIVE_INFINITY : Number(raw);
	};

	headers.forEach((header, column) => {
		const button = header.querySelector<HTMLButtonElement>('[data-sort]');
		if (!button) return;
		const numeric = button.hasAttribute('data-numeric');
		button.addEventListener(
			'click',
			() => {
				const current = header.getAttribute('aria-sort');
				// Numeric columns start high→low; text columns start A→Z.
				const descending = current ? current !== 'descending' : numeric;
				const sorted = rows()
					.map((row, index) => ({ row, index }))
					.sort((left, right) => {
						const a = cellValue(left.row, column, numeric);
						const b = cellValue(right.row, column, numeric);
						let diff =
							typeof a === 'number' && typeof b === 'number'
								? a - b
								: collator.compare(String(a), String(b));
						if (descending) diff = -diff;
						return diff || left.index - right.index;
					});
				for (const other of headers) other.removeAttribute('aria-sort');
				header.setAttribute('aria-sort', descending ? 'descending' : 'ascending');
				body.append(...sorted.map(({ row }) => row));
			},
			{ signal: controller.signal },
		);
	});
}

document.addEventListener('astro:page-load', setupBenchmarkSort);
setupBenchmarkSort();
