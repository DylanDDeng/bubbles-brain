// Progressive enhancement for /benchmarks/cases/. Without JavaScript the gallery lists every
// task, and a task page shows its newest run with every other run linked in the rail.
let controller: AbortController | undefined;

const VIEW_KEY = 'eval-cases-view';
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function readView(): string | null {
	try {
		return localStorage.getItem(VIEW_KEY);
	} catch {
		return null;
	}
}

function saveView(view: string) {
	try {
		localStorage.setItem(VIEW_KEY, view);
	} catch {
		// Private mode or blocked storage: the choice just won't persist.
	}
}

/* ---------------------------------------------------------------- gallery */

function setupGallery(root: HTMLElement, signal: AbortSignal) {
	const filters = root.querySelector<HTMLElement>('[data-eval-filters]');
	const grid = root.querySelector<HTMLElement>('[data-eval-grid]');
	if (!filters || !grid) return;
	const categoryButtons = [
		...filters.querySelectorAll<HTMLButtonElement>('[data-filter-category]'),
	];
	const viewButtons = [...filters.querySelectorAll<HTMLButtonElement>('[data-view]')];
	const modelSelect = filters.querySelector<HTMLSelectElement>('[data-filter-model]');
	const yearSelect = filters.querySelector<HTMLSelectElement>('[data-filter-year]');
	const sortSelect = filters.querySelector<HTMLSelectElement>('[data-sort]');
	const cards = [...grid.querySelectorAll<HTMLElement>('.eval-card')];
	const empty = root.querySelector<HTMLElement>('[data-eval-empty]');

	const now = Date.now();
	for (const card of cards) {
		const latest = Date.parse(card.dataset.latest ?? '');
		const badge = card.querySelector<HTMLElement>('[data-eval-new]');
		if (badge && now - latest >= 0 && now - latest < NEW_WINDOW_MS) badge.hidden = false;
	}

	const has = (select: HTMLSelectElement | null, value: string) =>
		!!select && [...select.options].some((option) => option.value === value);
	const params = new URLSearchParams(location.search);
	const state = {
		category: params.get('type') ?? '',
		model: params.get('model') ?? '',
		year: params.get('year') ?? '',
		sort: params.get('sort') ?? 'recent',
		view: params.get('view') ?? readView() ?? 'grid',
	};
	if (!categoryButtons.some((button) => button.dataset.filterCategory === state.category))
		state.category = '';
	if (!has(modelSelect, state.model)) state.model = '';
	if (!has(yearSelect, state.year)) state.year = '';
	if (!has(sortSelect, state.sort)) state.sort = 'recent';
	if (!viewButtons.some((button) => button.dataset.view === state.view)) state.view = 'grid';

	function paint() {
		categoryButtons.forEach((button) =>
			button.setAttribute('aria-pressed', String(button.dataset.filterCategory === state.category)),
		);
		viewButtons.forEach((button) =>
			button.setAttribute('aria-pressed', String(button.dataset.view === state.view)),
		);
		if (modelSelect) modelSelect.value = state.model;
		if (yearSelect) yearSelect.value = state.year;
		if (sortSelect) sortSelect.value = state.sort;
		grid!.dataset.view = state.view;

		const ordered = [...cards].sort((a, b) =>
			state.sort === 'models'
				? Number(b.dataset.count) - Number(a.dataset.count) ||
					Number(a.dataset.order) - Number(b.dataset.order)
				: Number(a.dataset.order) - Number(b.dataset.order),
		);
		let visible = 0;
		for (const card of ordered) {
			const show =
				(!state.category || card.dataset.category === state.category) &&
				(!state.model || (card.dataset.models ?? '').split(' ').includes(state.model)) &&
				(!state.year || (card.dataset.years ?? '').split(' ').includes(state.year));
			card.hidden = !show;
			if (show) visible += 1;
			grid!.append(card);
		}
		if (empty) empty.hidden = visible > 0;

		const next = new URLSearchParams();
		if (state.category) next.set('type', state.category);
		if (state.model) next.set('model', state.model);
		if (state.year) next.set('year', state.year);
		if (state.sort !== 'recent') next.set('sort', state.sort);
		const query = next.toString();
		history.replaceState(history.state, '', `${location.pathname}${query ? `?${query}` : ''}`);
	}

	filters.addEventListener(
		'click',
		(event) => {
			const button = (event.target as Element).closest<HTMLButtonElement>('button');
			if (!button) return;
			if (button.dataset.filterCategory !== undefined)
				state.category = button.dataset.filterCategory;
			if (button.dataset.view) {
				state.view = button.dataset.view;
				saveView(state.view);
			}
			paint();
		},
		{ signal },
	);
	for (const [select, key] of [
		[modelSelect, 'model'],
		[yearSelect, 'year'],
		[sortSelect, 'sort'],
	] as const) {
		select?.addEventListener(
			'change',
			() => {
				state[key] = select.value;
				paint();
			},
			{ signal },
		);
	}
	filters.hidden = false;
	paint();
}

/* ------------------------------------------------------------- task stage */

interface Run {
	id: string;
	kind: 'html' | 'image' | 'video';
	file: string;
	thumb: string;
	railThumb: string;
	name: string;
	title: string;
	vendor: string;
	logo: string | null;
	initial: string;
	sub: string;
}

// Demos are authored for a desktop window. Render them at a fixed desktop viewport and scale the
// frame to the stage, so a narrow stage shows the same composition instead of a squeezed layout.
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

function unmount(stage: HTMLElement) {
	stage.querySelector('iframe, video')?.remove();
	delete stage.dataset.running;
}

const playLabel = (kind: Run['kind']) => (kind === 'video' ? '播放视频' : '点击运行');

// Rendered videos play natively, letterboxed on the stage; they are not demos and need no scaling.
function mountVideo(stage: HTMLElement, src: string) {
	const video = document.createElement('video');
	video.src = src;
	video.controls = true;
	video.playsInline = true;
	video.autoplay = true;
	video.preload = 'auto';
	video.title = stage.dataset.title ?? '';
	stage.append(video);
	stage.dataset.running = 'true';
}

function mount(stage: HTMLElement) {
	const src = stage.dataset.src;
	if (!src || stage.classList.contains('is-image')) return;
	unmount(stage);
	if (stage.classList.contains('is-video')) {
		mountVideo(stage, src);
		return;
	}
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
	const reload = stage.closest('.eval-slot')?.querySelector<HTMLElement>('[data-eval-reload]');
	if (reload) reload.hidden = false;
}

function setupTask(root: HTMLElement, signal: AbortSignal) {
	const data = root.querySelector('[data-eval-runs]')?.textContent;
	const theater = root.querySelector<HTMLElement>('[data-eval-theater]');
	if (!data || !theater) return;
	const runs = JSON.parse(data) as Run[];
	const slots = {
		a: theater.querySelector<HTMLElement>('[data-slot="a"]')!,
		b: theater.querySelector<HTMLElement>('[data-slot="b"]'),
	};
	const railItems = [...root.querySelectorAll<HTMLAnchorElement>('[data-run]')];
	const counter = root.querySelector<HTMLElement>('[data-counter]');
	const compareToggle = root.querySelector<HTMLButtonElement>('[data-compare-toggle]');
	type Key = 'a' | 'b';
	const state = {
		index: { a: 0, b: Math.min(1, runs.length - 1) } as Record<Key, number>,
		running: { a: false, b: false } as Record<Key, boolean>,
		compare: false,
	};

	const hashIndex = runs.findIndex((run) => `#${run.id}` === location.hash);
	if (hashIndex > 0) state.index.a = hashIndex;
	if (state.index.a === state.index.b) state.index.b = (state.index.a + 1) % runs.length;

	function renderSlot(key: Key) {
		const slot = slots[key];
		if (!slot) return;
		const run = runs[state.index[key]];
		const stage = slot.querySelector<HTMLElement>('[data-eval-stage]')!;
		unmount(stage);
		stage.dataset.src = run.file;
		stage.dataset.title = run.title;
		stage.classList.toggle('is-image', run.kind === 'image');
		stage.classList.toggle('is-video', run.kind === 'video');
		const poster = slot.querySelector<HTMLAnchorElement>('[data-slot-poster]')!;
		poster.href = run.file;
		const thumb = slot.querySelector<HTMLImageElement>('[data-slot-thumb]')!;
		thumb.src = run.thumb;
		thumb.alt = run.title;
		slot.querySelector<HTMLElement>('[data-slot-play]')!.hidden = run.kind === 'image';
		slot.querySelector<HTMLElement>('[data-play-label]')?.replaceChildren(playLabel(run.kind));
		const avatar = slot.querySelector<HTMLElement>('[data-slot-avatar]')!;
		avatar.title = run.vendor;
		if (run.logo) {
			const img = document.createElement('img');
			img.src = run.logo;
			img.alt = '';
			img.width = 14;
			img.height = 14;
			avatar.replaceChildren(img);
		} else {
			avatar.replaceChildren(run.initial);
		}
		slot.querySelector<HTMLElement>('[data-slot-name]')!.textContent = run.name;
		slot.querySelector<HTMLElement>('[data-slot-sub]')!.textContent = run.sub;
		const open = slot.querySelector<HTMLAnchorElement>('[data-slot-open]')!;
		open.href = run.file;
		slot.querySelector<HTMLElement>('[data-slot-open-label]')!.textContent =
			run.kind === 'image' ? '查看原图' : '新窗口打开';
		slot.querySelector<HTMLElement>('[data-eval-reload]')!.hidden = true;
		// Keep playing when the viewer flips between runs: once a slot is live, the next run starts too.
		if (state.running[key] && run.kind !== 'image') mount(stage);
	}

	function paintChrome() {
		const active: Key = state.compare ? 'b' : 'a';
		if (counter) counter.textContent = `${state.index[active] + 1} / ${runs.length}`;
		railItems.forEach((item, index) => {
			const isA = index === state.index.a;
			const isB = state.compare && index === state.index.b;
			if (isA || isB) item.setAttribute('aria-current', 'true');
			else item.removeAttribute('aria-current');
			const badge = item.querySelector<HTMLElement>('[data-rail-slot]');
			if (badge) badge.textContent = state.compare ? (isA ? 'A' : isB ? 'B' : '') : '';
		});
		theater!.dataset.compare = String(state.compare);
		if (slots.b) slots.b.hidden = !state.compare;
		compareToggle?.setAttribute('aria-pressed', String(state.compare));
		history.replaceState(history.state, '', `#${runs[state.index.a].id}`);
	}

	function select(key: Key, index: number) {
		const other: Key = key === 'a' ? 'b' : 'a';
		if (state.compare && index === state.index[other]) {
			// Picking the run already on the other side swaps the two.
			state.index[other] = state.index[key];
			renderSlot(other);
		}
		state.index[key] = index;
		renderSlot(key);
		paintChrome();
		railItems[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
	}

	function step(delta: number) {
		const key: Key = state.compare ? 'b' : 'a';
		let next = state.index[key];
		do next = (next + delta + runs.length) % runs.length;
		while (state.compare && next === state.index.a && runs.length > 2);
		select(key, next);
	}

	// The frame is not focused on start, so ←/→/C keep driving the page until the viewer clicks
	// into the demo (games then get their keys).
	function run(key: Key) {
		const stage = slots[key]?.querySelector<HTMLElement>('[data-eval-stage]');
		if (!stage) return;
		state.running[key] = true;
		mount(stage);
	}

	function setCompare(on: boolean) {
		if (!slots.b || runs.length < 2) return;
		state.compare = on;
		if (on) {
			// Start by comparing against the neighbour of whatever is on stage.
			state.index.b = (state.index.a + 1) % runs.length;
			state.running.b = state.running.a;
			renderSlot('b');
		} else {
			unmount(slots.b.querySelector<HTMLElement>('[data-eval-stage]')!);
			state.running.b = false;
		}
		paintChrome();
	}

	for (const [key, slot] of Object.entries(slots) as Array<[Key, HTMLElement | null]>) {
		slot
			?.querySelector<HTMLElement>('[data-play-label]')
			?.replaceChildren(playLabel(runs[state.index[key]].kind));
		slot?.addEventListener(
			'click',
			(event) => {
				const target = event.target as Element;
				if (target.closest('[data-eval-reload]')) {
					run(key);
					return;
				}
				const poster = target.closest('[data-slot-poster]');
				if (!poster || runs[state.index[key]].kind === 'image') return;
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
				event.preventDefault();
				run(key);
			},
			{ signal },
		);
	}

	railItems.forEach((item, index) =>
		item.addEventListener(
			'click',
			(event) => {
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
				event.preventDefault();
				select(state.compare ? 'b' : 'a', index);
			},
			{ signal },
		),
	);
	root
		.querySelectorAll<HTMLButtonElement>('[data-step]')
		.forEach((button) =>
			button.addEventListener('click', () => step(Number(button.dataset.step)), { signal }),
		);
	compareToggle?.addEventListener('click', () => setCompare(!state.compare), { signal });

	document.addEventListener(
		'keydown',
		(event) => {
			if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
			const target = event.target as HTMLElement;
			// A focused video keeps its own keys: ←/→ seek, Enter/space play, not switch runs.
			if (target.closest('input, textarea, select, video, [contenteditable="true"]')) return;
			const key: Key = state.compare ? 'b' : 'a';
			if (runs.length > 1 && event.key === 'ArrowLeft') step(-1);
			else if (runs.length > 1 && event.key === 'ArrowRight') step(1);
			else if (runs.length > 1 && (event.key === 'c' || event.key === 'C'))
				setCompare(!state.compare);
			else if (event.key === 'Enter' && !target.closest('a, button, summary')) run(key);
			else if (event.key === 'o' || event.key === 'O')
				window.open(runs[state.index[key]].file, '_blank', 'noopener');
			else return;
			event.preventDefault();
		},
		{ signal },
	);

	if (state.index.a !== 0) renderSlot('a');
	if (slots.b) renderSlot('b');
	if (runs.length > 1) {
		root.querySelector<HTMLElement>('[data-theater-bar]')!.hidden = false;
		const keys = root.querySelector<HTMLElement>('[data-eval-keys]');
		if (keys) keys.hidden = false;
		paintChrome();
	}
	// A lone demo starts by itself; a lone video waits for a click rather than pulling megabytes.
	if (theater.dataset.autorun && runs[state.index.a].kind === 'html') run('a');

	setupPrompt(root, signal);
}

function setupPrompt(root: HTMLElement, signal: AbortSignal) {
	const body = root.querySelector<HTMLElement>('[data-prompt-body]');
	if (!body) return;
	const more = root.querySelector<HTMLButtonElement>('[data-prompt-more]');
	if (more && body.scrollHeight > 220) {
		body.classList.add('is-collapsed');
		more.hidden = false;
		more.addEventListener(
			'click',
			() => {
				const collapsed = body.classList.toggle('is-collapsed');
				more.textContent = collapsed ? '展开全部' : '收起';
			},
			{ signal },
		);
	}
	const copy = root.querySelector<HTMLButtonElement>('[data-copy-prompt]');
	if (!copy || !navigator.clipboard) return;
	copy.hidden = false;
	const label = copy.querySelector<HTMLElement>('[data-copy-label]')!;
	copy.addEventListener(
		'click',
		() => {
			navigator.clipboard.writeText(body.textContent?.trim() ?? '').then(
				() => {
					label.textContent = '已复制';
					setTimeout(() => (label.textContent = '复制'), 1600);
				},
				() => {
					label.textContent = '复制失败';
				},
			);
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
