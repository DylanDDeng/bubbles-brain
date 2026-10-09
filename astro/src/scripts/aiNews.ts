/**
 * AI 动态: reads the feed the bubble-ai-news Worker keeps (refreshed every 15 minutes from the
 * Feishu Base) and shows one Beijing day at a time, picked in the left rail and kept in the address
 * as #YYYY-MM-DD. Typing in the search box looks across every day instead.
 */
import {
	COVER_RATIO,
	dayTitle,
	clockTime,
	parseFeed,
	railLabel,
	searchFeed,
	updatedLabel,
	type NewsFeed,
	type NewsItem,
} from '../lib/aiNews';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

function card(item: NewsItem): HTMLElement {
	const link = el('a', 'news-card');
	link.href = item.url;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	if (item.cover) {
		const frame = el('span', 'news-card__cover');
		const image = el('img');
		// Reserve the cover's own shape up front so the masonry can deal cards before images load.
		image.style.aspectRatio = String(item.coverRatio ?? COVER_RATIO.fallback);
		image.src = item.cover;
		image.alt = '';
		image.loading = 'lazy';
		image.decoding = 'async';
		image.referrerPolicy = 'no-referrer';
		// A source that blocks hotlinking leaves a text card, not a broken image.
		image.addEventListener('error', () => frame.remove(), { once: true });
		frame.append(image);
		link.append(frame);
	}
	const body = el('span', 'news-card__body');
	body.append(el('span', 'news-card__title', item.title));
	if (item.summary) body.append(el('span', 'news-card__summary', item.summary));
	const time = el('time', 'news-card__time', clockTime(item.at));
	time.dateTime = item.at;
	body.append(time);
	link.append(body);
	return link;
}

const COLUMN_MIN = 240;
const COLUMN_GAP = 16;

function columnCount(grid: HTMLElement): number {
	return Math.max(1, Math.floor((grid.clientWidth + COLUMN_GAP) / (COLUMN_MIN + COLUMN_GAP)));
}

/**
 * Masonry that reads left to right: each card, newest first, goes to the column that is shortest
 * so far. (CSS columns would fill the first column top to bottom, burying the newest stories.)
 */
function layOut(grid: HTMLElement, cards: HTMLElement[]) {
	const columns = Array.from({ length: columnCount(grid) }, () => el('div', 'news-col'));
	grid.replaceChildren(...columns);
	grid.dataset.columns = String(columns.length);
	for (const node of cards) {
		const shortest = columns.reduce((low, column) =>
			column.offsetHeight < low.offsetHeight ? column : low,
		);
		shortest.append(node);
	}
}

function setupNews(root: HTMLElement) {
	if (root.dataset.ready) return;
	root.dataset.ready = 'true';
	const rail = root.querySelector<HTMLElement>('[data-news-rail]')!;
	const main = root.querySelector<HTMLElement>('[data-news-main]')!;
	const title = root.querySelector<HTMLElement>('[data-news-title]')!;
	const grid = root.querySelector<HTMLElement>('[data-news-grid]')!;
	const status = root.querySelector<HTMLElement>('[data-news-status]')!;
	const updated = root.querySelector<HTMLElement>('[data-news-updated]')!;
	const search = root.querySelector<HTMLInputElement>('[data-news-search]');
	const older = root.querySelector<HTMLButtonElement>('[data-news-older]')!;
	const olderLabel = root.querySelector<HTMLElement>('[data-news-older-label]')!;
	const body = root.querySelector<HTMLElement>('.news-body');
	let feed: NewsFeed | null = null;
	let shown: HTMLElement[] = [];
	// Re-deal the cards only when the number of columns changes, not on every pixel of a resize.
	const resize = new ResizeObserver(() => {
		if (shown.length && grid.dataset.columns !== String(columnCount(grid))) layOut(grid, shown);
	});
	resize.observe(grid);
	document.addEventListener('astro:before-swap', () => resize.disconnect(), { once: true });

	const currentDay = () => {
		const wanted = decodeURIComponent(location.hash.slice(1));
		return feed?.days.find((day) => day.day === wanted)?.day ?? feed?.days[0]?.day ?? '';
	};

	const showDay = (day: string) => {
		if (search) search.value = '';
		history.replaceState(history.state, '', `#${day}`);
		render();
		// Keep the reader at the top of the list rather than wherever the last day ended.
		if (body && body.getBoundingClientRect().top < 0) body.scrollIntoView();
	};

	function render() {
		if (!feed) return;
		const query = search?.value.trim() ?? '';
		const active = query ? '' : currentDay();
		const items = query
			? searchFeed(feed, query)
			: (feed.days.find((day) => day.day === active)?.items ?? []);

		for (const link of rail.querySelectorAll<HTMLAnchorElement>('a')) {
			if (link.dataset.day !== active) {
				link.removeAttribute('aria-current');
				continue;
			}
			link.setAttribute('aria-current', 'true');
			// On a phone the rail is one sideways row: bring the chosen day into view.
			if (rail.scrollWidth > rail.clientWidth) {
				rail.scrollLeft =
					link.offsetLeft - rail.offsetLeft - (rail.clientWidth - link.offsetWidth) / 2;
			}
		}
		title.textContent = query ? '搜索结果' : dayTitle(active);
		shown = items.map(card);
		layOut(grid, shown);
		status.hidden = items.length > 0;
		status.textContent = query ? '没有找到。换个词试试。' : '这一天还没有动态。';

		const index = feed.days.findIndex((day) => day.day === active);
		const next = !query && index >= 0 ? feed.days[index + 1] : undefined;
		older.hidden = !next;
		if (next) {
			olderLabel.textContent = dayTitle(next.day);
			older.dataset.day = next.day;
		}
	}

	function fail() {
		main.setAttribute('aria-busy', 'false');
		status.hidden = false;
		status.textContent = '暂时读不到最新动态，过一会儿再来看看。';
	}

	older.addEventListener('click', () => {
		if (older.dataset.day) showDay(older.dataset.day);
	});
	search?.addEventListener('input', render);
	const onHash = () => render();
	window.addEventListener('hashchange', onHash);
	document.addEventListener(
		'astro:before-swap',
		() => window.removeEventListener('hashchange', onHash),
		{
			once: true,
		},
	);

	fetch(root.dataset.feedUrl ?? '', { headers: { accept: 'application/json' } })
		.then((response) =>
			response.ok ? response.json() : Promise.reject(new Error(String(response.status))),
		)
		.then((raw: unknown) => {
			feed = parseFeed(raw);
			if (!feed || !feed.days.length) return fail();
			const now = new Date();
			updated.textContent = updatedLabel(feed.updatedAt, now);
			rail.replaceChildren(
				...feed.days.map((day) => {
					const link = el('a', undefined, railLabel(day.day, now));
					link.href = `#${day.day}`;
					link.dataset.day = day.day;
					link.addEventListener('click', (event) => {
						event.preventDefault();
						showDay(day.day);
					});
					return link;
				}),
			);
			main.setAttribute('aria-busy', 'false');
			root.classList.add('is-ready');
			render();
		})
		.catch(fail);
}

function initNews() {
	document.querySelectorAll<HTMLElement>('[data-ai-news]').forEach(setupNews);
}

document.addEventListener('astro:page-load', initNews);
