/**
 * AI 动态: reads the feed the bubble-ai-news Worker keeps (refreshed every 15 minutes from the
 * Feishu Base) and shows one Beijing day at a time, picked in the left rail and kept in the address
 * as #YYYY-MM-DD. The rail groups days by month: the newest month starts open, older ones closed;
 * a month whose older days have aged out of the feed is read from the archive when it is opened.
 * A day reads as a timeline: one row per bot push, newest first, its time label pinned while
 * its cards scroll: the push time (23:08) in light grey, one per bot batch. Stories that arrived since the
 * reader's last visit (kept in this browser only) are marked 新, with a 上次看到这里 line under them.
 * News is searched from the site search in the header (commandSearch.ts, /search/).
 */
import {
	archiveUrl,
	dayTitle,
	timeGroups,
	LAST_SEEN_KEY,
	monthLabel,
	monthOf,
	parseArchive,
	parseFeed,
	railLabel,
	railMonths,
	seenLabel,
	updatedLabel,
	type NewsDay,
	type NewsFeed,
	type NewsItem,
	type RailMonth,
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
	link.append(body);
	return link;
}

/** This tab's starting point, so a reload keeps the same 新 marks (sessionStorage dies with the tab). */
const VISIT_BASELINE_KEY = 'ai-news:visit-baseline';

/**
 * The reader's previous visit, fixed for the whole of this one: read once per tab from the time
 * saved when they last left, then kept in the tab so reloads and day switches do not move it.
 */
function readLastSeen(): string | null {
	const valid = (value: string | null) =>
		value && !Number.isNaN(Date.parse(value)) ? value : null;
	try {
		const kept = sessionStorage.getItem(VISIT_BASELINE_KEY);
		if (kept !== null) return valid(kept);
		const previous = valid(localStorage.getItem(LAST_SEEN_KEY));
		sessionStorage.setItem(VISIT_BASELINE_KEY, previous ?? '');
		return previous;
	} catch {
		return null;
	}
}

function writeLastSeen(iso: string) {
	try {
		localStorage.setItem(LAST_SEEN_KEY, iso);
	} catch {
		// Private windows may refuse storage; the page simply marks nothing as new next time.
	}
}

/**
 * One row per push time: a pinned label with the time (23:08) beside that batch's cards.
 * Stories newer than the last visit are 新; the 上次看到这里 line goes above the first older row.
 */
function timeline(items: NewsItem[], lastSeen: string | null, now: Date): HTMLElement[] {
	const isNew = (item: NewsItem) => !!lastSeen && item.at > lastSeen;
	const nodes: HTMLElement[] = [];
	let sawNew = false;
	let marked = false;
	for (const group of timeGroups(items)) {
		const fresh = group.items.some(isNew);
		if (sawNew && !fresh && !marked && lastSeen) {
			const line = el('div', 'news-seen');
			line.append(
				el('span'),
				el('span', 'news-seen__label', `上次看到这里 · ${seenLabel(lastSeen, now)}`),
				el('span'),
			);
			nodes.push(line);
			marked = true;
		}
		sawNew ||= fresh;

		const row = el('section', 'news-moment');
		if (fresh) row.classList.add('is-new');
		const label = el('div', 'news-moment__label');
		const dot = el('span', 'news-moment__dot');
		dot.setAttribute('aria-hidden', 'true');
		const time = el('time', 'news-moment__time', group.time);
		time.dateTime = group.items[0].at;
		label.append(dot, time);
		if (fresh) label.append(el('span', 'news-moment__new', '新'));
		const cards = el('div', 'news-moment__cards');
		cards.append(...group.items.map(card));
		row.append(label, cards);
		nodes.push(row);
	}
	return nodes;
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
	const older = root.querySelector<HTMLButtonElement>('[data-news-older]')!;
	const olderLabel = root.querySelector<HTMLElement>('[data-news-older-label]')!;
	const body = root.querySelector<HTMLElement>('.news-body');
	const feedUrl = root.dataset.feedUrl ?? '';
	let feed: NewsFeed | null = null;
	/** Archived months read so far; a month's request is shared while it is in flight. */
	const archives = new Map<string, NewsDay[]>();
	const loading = new Map<string, Promise<void>>();
	/** Months whose archive could not be read: retried only when the reader opens them again. */
	const failed = new Set<string>();
	/** Months whose days are listed in the rail. The newest starts open. */
	const open = new Set<string>();
	// The previous visit, fixed for this tab; this visit is saved whenever the page is hidden or left.
	const lastSeen = readLastSeen();
	const saveVisit = () => writeLastSeen(new Date().toISOString());
	const onHide = () => {
		if (document.visibilityState === 'hidden') saveVisit();
	};
	document.addEventListener('visibilitychange', onHide);
	window.addEventListener('pagehide', saveVisit);
	document.addEventListener(
		'astro:before-swap',
		() => {
			saveVisit();
			document.removeEventListener('visibilitychange', onHide);
			window.removeEventListener('pagehide', saveVisit);
		},
		{ once: true },
	);

	// The frosted bottom edge fades away once the end of the list is on screen.
	const veil = root.querySelector<HTMLElement>('[data-news-veil]');
	const end = root.querySelector<HTMLElement>('[data-news-end]');
	if (veil && end) {
		const atEnd = new IntersectionObserver(([entry]) =>
			veil.classList.toggle('is-hidden', entry.isIntersecting),
		);
		atEnd.observe(end);
		document.addEventListener('astro:before-swap', () => atEnd.disconnect(), { once: true });
	}

	const months = () => (feed ? railMonths(feed, archives) : []);
	const knownDays = () => months().flatMap((month) => month.days);
	const wantedDay = () => decodeURIComponent(location.hash.slice(1));

	/** Reads one archived month once; the rail and the page redraw when it arrives. */
	const loadArchive = (month: string): Promise<void> => {
		if (archives.has(month)) return Promise.resolve();
		let request = loading.get(month);
		if (!request) {
			request = fetch(archiveUrl(feedUrl, month), { headers: { accept: 'application/json' } })
				.then((response) => (response.ok ? response.json() : null))
				.then((raw: unknown) => {
					const days = parseArchive(raw, month);
					if (days) archives.set(month, days);
					else failed.add(month);
				})
				.catch(() => {
					failed.add(month);
				})
				.finally(() => {
					loading.delete(month);
					render();
				});
			loading.set(month, request);
		}
		return request;
	};

	/** The day to show: the address's when it is known (or its month can be fetched), else the newest. */
	const currentDay = (): string => {
		const wanted = wantedDay();
		if (knownDays().some((day) => day.day === wanted)) return wanted;
		const month = months().find((entry) => entry.month === monthOf(wanted));
		if (month?.archived && !month.loaded && !failed.has(month.month)) {
			open.add(month.month);
			void loadArchive(month.month);
			return wanted;
		}
		return knownDays()[0]?.day ?? '';
	};

	const showDay = (day: string) => {
		open.add(monthOf(day));
		history.replaceState(history.state, '', `#${day}`);
		render();
		// Keep the reader at the top of the list rather than wherever the last day ended.
		if (body && body.getBoundingClientRect().top < 0) body.scrollIntoView();
	};

	const toggleMonth = (month: RailMonth) => {
		if (open.has(month.month)) open.delete(month.month);
		else {
			open.add(month.month);
			failed.delete(month.month);
			if (month.archived && !month.loaded) void loadArchive(month.month);
		}
		render();
	};

	function drawRail(active: string) {
		const now = new Date();
		rail.replaceChildren(
			...months().map((month) => {
				const group = el('div', 'news-month');
				const expanded = open.has(month.month);
				const toggle = el('button', 'news-month__toggle');
				toggle.type = 'button';
				toggle.setAttribute('aria-expanded', String(expanded));
				toggle.append(monthLabel(month.month, now), el('i', 'ph ph-caret-right'));
				toggle.lastElementChild!.setAttribute('aria-hidden', 'true');
				toggle.addEventListener('click', () => toggleMonth(month));
				group.append(toggle);
				if (expanded) {
					const days = el('div', 'news-month__days');
					for (const day of month.days) {
						const link = el('a', undefined, railLabel(day.day, now));
						link.href = `#${day.day}`;
						link.dataset.day = day.day;
						if (day.day === active) link.setAttribute('aria-current', 'true');
						link.addEventListener('click', (event) => {
							event.preventDefault();
							showDay(day.day);
						});
						days.append(link);
					}
					if (loading.has(month.month)) days.append(el('span', 'news-month__loading', '…'));
					group.append(days);
				}
				return group;
			}),
		);
		// On a phone the rail is one sideways row: bring the chosen day into view.
		const current = rail.querySelector<HTMLElement>('[aria-current]');
		if (current && rail.scrollWidth > rail.clientWidth) {
			rail.scrollLeft =
				current.offsetLeft - rail.offsetLeft - (rail.clientWidth - current.offsetWidth) / 2;
		}
	}

	function render() {
		if (!feed) return;
		const active = currentDay();
		drawRail(active);
		const days = knownDays();
		const day = days.find((entry) => entry.day === active);
		title.textContent = dayTitle(active);
		const items = day?.items ?? [];
		grid.replaceChildren(...timeline(items, lastSeen, new Date()));
		status.hidden = items.length > 0;
		status.textContent = loading.has(monthOf(active)) ? '正在读取往期动态…' : '这一天还没有动态。';

		// The next older day: one already known, else the newest day of the next archived month.
		const index = days.findIndex((entry) => entry.day === active);
		const next = index >= 0 ? days[index + 1] : undefined;
		// Includes this day's own month: its older days may still be waiting in the archive.
		const nextMonth = next
			? undefined
			: months().find((month) => month.month <= monthOf(active) && month.archived && !month.loaded);
		older.hidden = !next && !nextMonth;
		older.dataset.day = next?.day ?? '';
		older.dataset.month = nextMonth?.month ?? '';
		if (next) olderLabel.textContent = dayTitle(next.day);
		else if (nextMonth) {
			const label = monthLabel(nextMonth.month, new Date());
			olderLabel.textContent = nextMonth.month === monthOf(active) ? `${label}更早` : label;
		}
	}

	function fail() {
		main.setAttribute('aria-busy', 'false');
		status.hidden = false;
		status.textContent = '暂时读不到最新动态，过一会儿再来看看。';
	}

	older.addEventListener('click', () => {
		if (older.dataset.day) return showDay(older.dataset.day);
		const month = older.dataset.month;
		if (!month) return;
		const from = currentDay();
		open.add(month);
		void loadArchive(month).then(() => {
			const following = knownDays().find((entry) => entry.day < from);
			if (following) showDay(following.day);
		});
	});
	const onHash = () => render();
	window.addEventListener('hashchange', onHash);
	document.addEventListener(
		'astro:before-swap',
		() => window.removeEventListener('hashchange', onHash),
		{
			once: true,
		},
	);

	fetch(feedUrl, { headers: { accept: 'application/json' } })
		.then((response) =>
			response.ok ? response.json() : Promise.reject(new Error(String(response.status))),
		)
		.then((raw: unknown) => {
			feed = parseFeed(raw);
			if (!feed || !feed.days.length) return fail();
			updated.textContent = updatedLabel(feed.updatedAt, new Date());
			open.add(monthOf(feed.days[0].day));
			// A link to a day in another month opens that month too.
			if (wantedDay()) open.add(monthOf(wantedDay()));
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
