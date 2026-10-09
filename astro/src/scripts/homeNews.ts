/**
 * The home search box: while it has focus and is empty, the latest AI 动态 open under it. Typing
 * closes them (Enter still searches, news included); Escape, clicking elsewhere or opening a story
 * closes them too. The feed is fetched once the page is idle, so the list is there on first focus;
 * if it cannot be read the box is just a search box.
 */
import { homeNews, LAST_SEEN_KEY, loadNewsFeed, type HomeNews } from '../lib/aiNews';

const SHOWN = 5;

function readLastSeen(): string | null {
	try {
		return localStorage.getItem(LAST_SEEN_KEY);
	} catch {
		return null;
	}
}

function row({ item, time, seenBefore }: HomeNews['rows'][number]): HTMLLIElement {
	const li = document.createElement('li');
	if (seenBefore) {
		const seen = document.createElement('div');
		seen.className = 'home-news__seen';
		seen.textContent = '上次看到这里';
		li.append(seen);
	}
	const link = document.createElement('a');
	link.className = 'home-news__row';
	link.href = item.url;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	const when = document.createElement('time');
	when.className = 'home-news__time';
	when.dateTime = item.at;
	when.textContent = time;
	const headline = document.createElement('span');
	headline.className = 'home-news__headline';
	headline.textContent = item.title;
	const go = document.createElement('span');
	go.className = 'home-news__go';
	go.setAttribute('aria-hidden', 'true');
	go.textContent = '↗';
	link.append(when, headline, go);
	li.append(link);
	return li;
}

let stop: AbortController | null = null;

function init() {
	stop?.abort();
	stop = null;
	const root = document.querySelector<HTMLElement>('[data-home-news]');
	const shell = root?.querySelector<HTMLElement>('.home-search-shell');
	const input = root?.querySelector<HTMLInputElement>('input[type="search"]');
	const panel = root?.querySelector<HTMLElement>('.home-news');
	const list = root?.querySelector<HTMLElement>('[data-home-news-list]');
	const updated = root?.querySelector<HTMLElement>('[data-home-news-updated]');
	const all = root?.querySelector<HTMLAnchorElement>('[data-home-news-all]');
	const url = root?.dataset.homeNews;
	if (!root || !shell || !input || !panel || !list || !updated || !all || !url) return;

	const controller = new AbortController();
	stop = controller;
	const { signal } = controller;
	let ready = false;

	const isOpen = () => !panel.hidden;
	const open = () => {
		if (!ready || input.value.trim() !== '' || !shell.contains(document.activeElement)) return;
		panel.hidden = false;
		shell.classList.add('is-open');
	};
	const close = () => {
		panel.hidden = true;
		shell.classList.remove('is-open');
	};

	let loading: Promise<void> | null = null;
	const load = () => {
		loading ??= loadNewsFeed(url).then((feed) => {
			if (signal.aborted || !feed) {
				loading = null;
				return;
			}
			const news = homeNews(feed, readLastSeen(), new Date(), SHOWN);
			if (!news.rows.length) return;
			list.replaceChildren(...news.rows.map(row));
			updated.textContent = news.updated;
			all.textContent = news.today ? `今天推送了 ${news.today} 条，看全部` : '看全部 AI 动态';
			ready = true;
			open();
		});
		return loading;
	};
	const idle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 1200));
	idle(() => void load());

	input.addEventListener('focus', () => void load().then(open), { signal });
	input.addEventListener('input', () => (input.value.trim() ? close() : open()), { signal });
	shell.addEventListener(
		'focusout',
		(event) => {
			if (!shell.contains(event.relatedTarget as Node | null)) close();
		},
		{ signal },
	);
	// Clicking the panel's own text keeps the focus in the box rather than closing it.
	panel.addEventListener(
		'pointerdown',
		(event) => {
			if (!(event.target as Element).closest('a')) event.preventDefault();
		},
		{ signal },
	);
	panel.addEventListener(
		'click',
		(event) => {
			if ((event.target as Element).closest('.home-news__row')) close();
		},
		{ signal },
	);
	shell.addEventListener(
		'keydown',
		(event) => {
			if (!isOpen()) return;
			if (event.key === 'Escape') {
				event.preventDefault();
				close();
				input.focus();
				return;
			}
			if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
			const stops = [
				input,
				...[...list.querySelectorAll<HTMLElement>('.home-news__row')].filter(
					(link) => link.offsetParent !== null,
				),
			];
			const at = stops.indexOf(document.activeElement as HTMLElement);
			if (at === -1) return;
			event.preventDefault();
			const next =
				event.key === 'ArrowDown' ? Math.min(at + 1, stops.length - 1) : Math.max(at - 1, 0);
			stops[next].focus();
		},
		{ signal },
	);
}

if (typeof document !== 'undefined') {
	document.addEventListener('astro:page-load', init);
	document.addEventListener('astro:before-swap', () => {
		stop?.abort();
		stop = null;
	});
}
