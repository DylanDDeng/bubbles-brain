/**
 * Faster page changes under Astro's client router.
 *
 * Astro's own prefetch drops the page into the HTTP cache, but our HTML is served with
 * `max-age=0, must-revalidate`, so the router's fetch on click downloads it again and the
 * reader waits a full round trip anyway. Instead this keeps prefetched pages in memory and
 * hands them to the router (prefetch is turned off in astro.config.mjs):
 *
 * - a link is fetched after the pointer rests on it for a moment, on keyboard focus, or the
 *   instant a finger touches it;
 * - header links marked `data-nav-prefetch` are fetched once the page is idle;
 * - a click on a link already fetched (or still arriving) uses that copy, so the page changes
 *   as soon as it is there;
 * - if the change still takes a moment, a thin bar at the top shows the click was taken.
 *
 * `data-astro-prefetch="false"` and `data-astro-reload` opt a link out, as with Astro.
 */
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';

interface FetchedPage {
	html: string;
	mediaType: string;
	/** Final URL when the server redirected. */
	redirected?: string;
}

/** A fetched page is used for a click within this long; afterwards the router fetches anew. */
const FRESH_MS = 5 * 60_000;
const HOVER_DELAY_MS = 80;
const PROGRESS_DELAY_MS = 150;
const MAX_PAGES = 30;

const pages = new Map<string, { at: number; page: Promise<FetchedPage | null> }>();

const pageKey = (url: URL) => url.origin + url.pathname + url.search;

function slowConnection() {
	const connection = (
		navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
	).connection;
	return Boolean(connection?.saveData || connection?.effectiveType?.includes('2g'));
}

/** The URL a link would take the router to, or null when it is not a page we should fetch. */
function prefetchableUrl(anchor: HTMLAnchorElement | null): URL | null {
	if (!anchor?.href || anchor.hasAttribute('download') || anchor.hasAttribute('data-astro-reload'))
		return null;
	if (anchor.dataset.astroPrefetch === 'false') return null;
	if (anchor.target && anchor.target !== '_self') return null;
	const url = new URL(anchor.href, location.href);
	if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return null;
	// Same page (only the hash differs): the router just scrolls.
	if (url.pathname === location.pathname && url.search === location.search) return null;
	// Feeds, media and other files are not pages.
	if (/\.(?!html?$)[a-z0-9]+$/i.test(url.pathname)) return null;
	return url;
}

function fetchPage(url: URL) {
	const key = pageKey(url);
	const known = pages.get(key);
	if (known && Date.now() - known.at < FRESH_MS) return;
	const page = fetch(key, { priority: 'low' } as RequestInit)
		.then(async (response): Promise<FetchedPage | null> => {
			const mediaType = (response.headers.get('content-type') ?? '').split(';', 1)[0]!.trim();
			if (!response.ok || (mediaType !== 'text/html' && mediaType !== 'application/xhtml+xml'))
				return null;
			return {
				html: await response.text(),
				mediaType,
				redirected: response.redirected ? response.url : undefined,
			};
		})
		.catch(() => null)
		.then((result) => {
			if (!result) pages.delete(key);
			return result;
		});
	pages.delete(key);
	pages.set(key, { at: Date.now(), page });
	// Forget the oldest pages first.
	while (pages.size > MAX_PAGES) pages.delete(pages.keys().next().value!);
}

function prefetchLink(anchor: HTMLAnchorElement | null) {
	const url = prefetchableUrl(anchor);
	if (url && !slowConnection()) fetchPage(url);
}

let hoverTimer: number | undefined;
document.addEventListener('pointerover', (event) => {
	const anchor = (event.target as Element).closest?.('a');
	if (!anchor || event.pointerType !== 'mouse') return;
	clearTimeout(hoverTimer);
	hoverTimer = window.setTimeout(() => prefetchLink(anchor), HOVER_DELAY_MS);
});
document.addEventListener('pointerout', (event) => {
	const anchor = (event.target as Element).closest?.('a');
	if (anchor && !anchor.contains(event.relatedTarget as Node | null)) clearTimeout(hoverTimer);
});
// A touch lands ~100ms before its click; start right away.
document.addEventListener(
	'pointerdown',
	(event) => prefetchLink((event.target as Element).closest?.('a')),
	{ passive: true },
);
document.addEventListener('focusin', (event) =>
	prefetchLink((event.target as Element).closest?.('a')),
);

/** Header links are where readers go next, and each page is only a few KB. */
function prefetchHeaderLinks() {
	const run = () =>
		document
			.querySelectorAll<HTMLAnchorElement>('a[data-nav-prefetch]')
			.forEach((anchor) => prefetchLink(anchor));
	if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 3000 });
	else setTimeout(run, 1000);
}

/** The router's own preparation, fed from memory instead of the network. */
async function prepareFromMemory(
	event: TransitionBeforePreparationEvent,
	fetched: FetchedPage,
): Promise<void> {
	if (fetched.redirected) {
		const target = new URL(fetched.redirected);
		if (target.origin !== event.to.origin) return event.preventDefault();
		target.hash = event.to.hash;
		event.to = target;
	}
	const newDocument = new DOMParser().parseFromString(
		fetched.html,
		fetched.mediaType as DOMParserSupportedType,
	);
	newDocument.querySelectorAll('noscript').forEach((element) => element.remove());
	if (!newDocument.querySelector('[name="astro-view-transitions-enabled"]'))
		return event.preventDefault();
	event.newDocument = newDocument;
	// Like the router: wait for new stylesheets so the page never shows unstyled.
	const loads: Promise<unknown>[] = [];
	for (const sheet of newDocument.querySelectorAll('head link[rel=stylesheet]')) {
		const href = sheet.getAttribute('href');
		if (!href || document.querySelector(`link[rel=stylesheet][href="${CSS.escape(href)}"]`))
			continue;
		const preload = document.createElement('link');
		preload.rel = 'preload';
		preload.as = 'style';
		preload.href = href;
		loads.push(
			new Promise((resolve) => {
				preload.addEventListener('load', resolve);
				preload.addEventListener('error', resolve);
				document.head.append(preload);
			}),
		);
	}
	if (loads.length && !event.signal.aborted) await Promise.all(loads);
}

document.addEventListener('astro:before-preparation', (event) => {
	if (event.formData) return;
	const key = pageKey(event.to);
	const known = pages.get(key);
	if (!known || Date.now() - known.at >= FRESH_MS) return;
	// One use per fetch: the next visit gets a current copy.
	pages.delete(key);
	const routerLoader = event.loader;
	event.loader = async () => {
		const fetched = await known.page;
		if (event.signal.aborted) return;
		if (fetched) await prepareFromMemory(event, fetched);
		else await routerLoader();
	};
});

// ------------------------------------------------------------------ progress bar
let progressTimer: number | undefined;
document.addEventListener('astro:before-preparation', () => {
	clearTimeout(progressTimer);
	progressTimer = window.setTimeout(() => {
		// It lives in the old body, so the swap removes it.
		const bar = document.createElement('div');
		bar.className = 'nav-progress';
		bar.setAttribute('aria-hidden', 'true');
		document.body.append(bar);
		// Lay it out at zero first so the growth is a transition.
		void bar.offsetWidth;
		bar.classList.add('is-running');
	}, PROGRESS_DELAY_MS);
});
document.addEventListener('astro:after-swap', () => clearTimeout(progressTimer));

document.addEventListener('astro:page-load', () => {
	pages.delete(pageKey(new URL(location.href)));
	prefetchHeaderLinks();
});
