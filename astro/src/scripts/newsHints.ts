/**
 * AI 动态 update hints on every Chinese page except /ai-news/ (which has its own 「有 N 条新动态」
 * button, aiNews.ts). Stories pushed since the reader last left /ai-news/ put +N beside the
 * 「AI 动态」 links, a dot on the phone menu button and (N) in front of the tab title. On arriving, or
 * coming back to the tab after a while, a notice in the corner names the newest story, once per batch.
 * A first visit only notes the time: nothing shows until something newer comes. Without news, or
 * without a readable feed, nothing shows at all.
 */
import {
	AI_NEWS_FEED_URL,
	clockTime,
	LAST_SEEN_KEY,
	loadNewsFeed,
	NEWS_FRESH_FOR,
	NEWS_SINCE_KEY,
	NEWS_TOLD_KEY,
	newerThan,
	titleWithCount,
	unreadBadge,
	type NewsItem,
} from '../lib/aiNews';

/** How often an open tab looks again (browsers slow this down in background tabs). */
const CHECK_EVERY = 3 * 60_000;
/** A tab hidden this long counts as a new arrival when it comes back. */
const AWAY_FOR = 10 * 60_000;
/** How long the notice stays when the reader leaves it alone. */
const NOTICE_FOR = 10_000;
const ARRIVED_KEY = 'ai-news:arrived';

function read(key: string, storage: () => Storage = () => localStorage): string | null {
	try {
		return storage().getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string, storage: () => Storage = () => localStorage) {
	try {
		storage().setItem(key, value);
	} catch {
		// Private windows may refuse storage; the hints then simply stay quiet.
	}
}

const valid = (value: string | null) => (value && !Number.isNaN(Date.parse(value)) ? value : null);

/** Count from the last visit to /ai-news/, else from the first visit to the site (noted now if this is it). */
function since(): string | null {
	const from = valid(read(LAST_SEEN_KEY)) ?? valid(read(NEWS_SINCE_KEY));
	if (!from) write(NEWS_SINCE_KEY, new Date().toISOString());
	return from;
}

const onNewsPage = () => location.pathname.startsWith('/ai-news/');

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
	const node = document.createElement(tag);
	node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

function paint(count: number) {
	for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href="/ai-news/"]')) {
		if (!link.closest('.site-sections, .site-menu, .home-sections')) continue;
		let badge = link.querySelector<HTMLElement>('.news-unread');
		if (!count) {
			badge?.remove();
			continue;
		}
		if (!badge) {
			badge = el('span', 'news-unread');
			link.append(badge);
		}
		badge.replaceChildren(unreadBadge(count), el('span', 'sr-only', ' 条新动态'));
	}
	const menu = document.querySelector<HTMLElement>('.site-menu summary');
	if (menu) {
		menu.dataset.label ??= menu.getAttribute('aria-label') ?? '';
		menu.classList.toggle('has-news', count > 0);
		menu.setAttribute(
			'aria-label',
			count ? `${menu.dataset.label}（AI 动态有 ${count} 条新动态）` : menu.dataset.label,
		);
	}
	document.title = titleWithCount(document.title, count);
}

let notice: HTMLElement | null = null;

function dismiss(target = notice) {
	if (!target) return;
	if (target === notice) notice = null;
	target.classList.remove('is-shown');
	// After the slide out; at once when motion is reduced and there is no transition to wait for.
	window.setTimeout(() => target.remove(), 400);
}

/** The corner notice for the newest batch, unless this batch was announced already. */
function announce(unread: NewsItem[]) {
	const newest = unread[0];
	if (!newest) return;
	const told = valid(read(NEWS_TOLD_KEY));
	if (told && Date.parse(told) >= Date.parse(newest.at)) return;
	write(NEWS_TOLD_KEY, newest.at);
	dismiss();

	const box = el('aside', 'news-notice');
	box.setAttribute('aria-label', 'AI 动态更新');
	const head = el('div', 'news-notice__head');
	const close = el('button', 'news-notice__close');
	close.type = 'button';
	close.setAttribute('aria-label', '关闭');
	const icon = el('i', 'ph ph-x');
	icon.setAttribute('aria-hidden', 'true');
	close.append(icon);
	head.append(
		el(
			'span',
			'news-notice__meta',
			`AI 动态 · ${unread.length} 条新动态 · ${clockTime(newest.at)}`,
		),
		close,
	);
	const title = el('a', 'news-notice__title', newest.title);
	title.href = newest.url;
	title.target = '_blank';
	title.rel = 'noopener noreferrer';
	const all = el('a', 'news-notice__all', `看全部 ${unread.length} 条`);
	all.href = '/ai-news/';
	box.append(head, title, all);

	let timer = 0;
	const wait = () => {
		window.clearTimeout(timer);
		timer = window.setTimeout(() => dismiss(box), NOTICE_FOR);
	};
	const hold = () => window.clearTimeout(timer);
	box.addEventListener('mouseenter', hold);
	box.addEventListener('focusin', hold);
	box.addEventListener('mouseleave', wait);
	box.addEventListener('focusout', (event) => {
		if (!box.contains(event.relatedTarget as Node | null)) wait();
	});
	close.addEventListener('click', () => dismiss(box));
	title.addEventListener('click', () => dismiss(box));

	// A live region must exist before its text does for screen readers to read it out.
	const status = document.querySelector<HTMLElement>('[data-news-notice-status]');
	document.body.append(box);
	if (status) status.textContent = `AI 动态有 ${unread.length} 条新动态`;
	notice = box;
	requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('is-shown')));
	wait();
}

/** Set when the reader arrives or comes back after a while: the next check may show the notice. */
let mayAnnounce = false;
let hiddenAt = 0;

async function check() {
	if (!document.documentElement.lang.startsWith('zh')) return;
	if (onNewsPage()) return paint(0);
	const from = since();
	// A first visit has nothing to compare with: no notice now, nor later in this visit.
	if (!from) {
		mayAnnounce = false;
		return;
	}
	const feed = await loadNewsFeed(AI_NEWS_FEED_URL, NEWS_FRESH_FOR);
	if (!feed || onNewsPage()) return;
	const unread = newerThan(feed, from);
	paint(unread.length);
	if (mayAnnounce) {
		mayAnnounce = false;
		announce(unread);
	}
}

if (typeof document !== 'undefined') {
	if (!read(ARRIVED_KEY, () => sessionStorage)) {
		write(ARRIVED_KEY, '1', () => sessionStorage);
		mayAnnounce = true;
	}
	document.addEventListener('astro:page-load', () => void check());
	document.addEventListener('astro:before-swap', () => dismiss());
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			hiddenAt = Date.now();
			return;
		}
		if (hiddenAt && Date.now() - hiddenAt >= AWAY_FOR) mayAnnounce = true;
		void check();
	});
	window.setInterval(() => void check(), CHECK_EVERY);
}
