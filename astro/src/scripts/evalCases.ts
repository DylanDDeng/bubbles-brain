// Progressive enhancement for /benchmarks/cases/. Without JavaScript the gallery lists every
// case and each poster opens the raw demo in a new tab.
let controller: AbortController | undefined;

function setupGallery(root: HTMLElement, signal: AbortSignal) {
	const filters = root.querySelector<HTMLElement>('[data-eval-filters]');
	if (!filters) return;
	const yearButtons = [...filters.querySelectorAll<HTMLButtonElement>('[data-filter-year]')];
	const categoryButtons = [
		...filters.querySelectorAll<HTMLButtonElement>('[data-filter-category]'),
	];
	const modelSelect = filters.querySelector<HTMLSelectElement>('[data-filter-model]');
	const sections = [...root.querySelectorAll<HTMLElement>('[data-eval-year]')];
	const empty = root.querySelector<HTMLElement>('[data-eval-empty]');

	const params = new URLSearchParams(location.search);
	const state = {
		year: params.get('year') ?? '',
		category: params.get('type') ?? '',
		model: params.get('model') ?? '',
	};
	if (!yearButtons.some((button) => button.dataset.filterYear === state.year)) state.year = '';
	if (!categoryButtons.some((button) => button.dataset.filterCategory === state.category))
		state.category = '';
	if (modelSelect && ![...modelSelect.options].some((option) => option.value === state.model))
		state.model = '';

	function paint() {
		yearButtons.forEach((button) =>
			button.setAttribute('aria-pressed', String(button.dataset.filterYear === state.year)),
		);
		categoryButtons.forEach((button) =>
			button.setAttribute('aria-pressed', String(button.dataset.filterCategory === state.category)),
		);
		if (modelSelect) modelSelect.value = state.model;

		let visible = 0;
		for (const section of sections) {
			let sectionVisible = 0;
			const yearMatch = !state.year || section.dataset.evalYear === state.year;
			for (const card of section.querySelectorAll<HTMLElement>('.eval-card')) {
				const show =
					yearMatch &&
					(!state.category || card.dataset.category === state.category) &&
					(!state.model || (card.dataset.models ?? '').split(' ').includes(state.model));
				card.hidden = !show;
				if (show) sectionVisible += 1;
			}
			section.hidden = sectionVisible === 0;
			visible += sectionVisible;
		}
		if (empty) empty.hidden = visible > 0;

		const next = new URLSearchParams();
		if (state.year) next.set('year', state.year);
		if (state.category) next.set('type', state.category);
		if (state.model) next.set('model', state.model);
		const query = next.toString();
		history.replaceState(history.state, '', `${location.pathname}${query ? `?${query}` : ''}`);
	}

	filters.addEventListener(
		'click',
		(event) => {
			const button = (event.target as Element).closest<HTMLButtonElement>('button');
			if (!button) return;
			if (button.dataset.filterYear !== undefined) state.year = button.dataset.filterYear;
			if (button.dataset.filterCategory !== undefined)
				state.category = button.dataset.filterCategory;
			paint();
		},
		{ signal },
	);
	modelSelect?.addEventListener(
		'change',
		() => {
			state.model = modelSelect.value;
			paint();
		},
		{ signal },
	);
	filters.hidden = false;
	paint();
}

// Demos are authored for a desktop window. Render them at a fixed desktop viewport and scale the
// frame to the card, so a narrow card shows the same composition instead of a squeezed layout.
const DEMO_WIDTH = 1280;
const stageScale = new ResizeObserver((entries) => {
	for (const entry of entries) {
		const stage = entry.target as HTMLElement;
		stage.style.setProperty(
			'--eval-scale',
			String(Math.min(1, entry.contentRect.width / DEMO_WIDTH)),
		);
	}
});

function mount(stage: HTMLElement, focus = false) {
	const src = stage.dataset.src;
	if (!src) return;
	stage.querySelector('iframe')?.remove();
	const frame = document.createElement('iframe');
	frame.src = src;
	frame.title = stage.dataset.title ?? '';
	// Isolation comes from the `sandbox` CSP that /eval-demos/* is served with (enforced by
	// verify-site). A sandbox attribute here as well makes some embedded browsers refuse to load
	// the frame at all (ERR_BLOCKED_BY_CLIENT), leaving a blank stage.
	frame.setAttribute('allow', 'fullscreen');
	stage.append(frame);
	stage.dataset.running = 'true';
	stageScale.observe(stage);
	const reload = stage.closest('.eval-run')?.querySelector<HTMLElement>('[data-eval-reload]');
	if (reload) reload.hidden = false;
	if (focus) frame.focus();
}

function setupTask(root: HTMLElement, signal: AbortSignal) {
	for (const stage of root.querySelectorAll<HTMLElement>('[data-eval-stage]')) {
		const label = stage.querySelector<HTMLElement>('[data-play-label]');
		if (label) label.textContent = '点击运行';
		if (stage.dataset.autorun) mount(stage);
	}
	root.addEventListener(
		'click',
		(event) => {
			const target = event.target as Element;
			const poster = target.closest<HTMLAnchorElement>('.eval-poster');
			if (poster) {
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
				event.preventDefault();
				mount(poster.closest<HTMLElement>('[data-eval-stage]')!, true);
				return;
			}
			if (!target.closest('[data-eval-reload]')) return;
			const stage = target.closest('.eval-run')?.querySelector<HTMLElement>('[data-eval-stage]');
			if (stage) mount(stage, true);
		},
		{ signal },
	);
}

function init() {
	controller?.abort();
	controller = new AbortController();
	const gallery = document.querySelector<HTMLElement>('[data-eval-gallery]');
	if (gallery) setupGallery(gallery, controller.signal);
	const task = document.querySelector<HTMLElement>('[data-eval-task]');
	if (task) setupTask(task, controller.signal);
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
	controller?.abort();
	stageScale.disconnect();
});

export {};
