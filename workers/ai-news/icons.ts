/**
 * The little pictures beside a hot story: each outlet's site icon, or the account's avatar when
 * the source is a post on X. GET /v1/icon/site/<host> and /v1/icon/x/<handle> fetch one on first
 * request, shrink it, keep it in R2 and serve it from this Worker's own domain, so readers never
 * touch a third-party icon service. Only icons the current feed names are fetched: this is not an
 * open image proxy.
 */
import type { Feed } from './feed';

const X_HOSTS = new Set(['x.com', 'twitter.com', 'mobile.twitter.com', 'www.x.com', 'www.twitter.com']);
/** First path segments on X that are pages, not accounts. */
const X_PAGES = new Set(['i', 'home', 'search', 'explore', 'intent', 'hashtag', 'share', 'settings', 'messages', 'notifications']);
const HANDLE = /^[A-Za-z0-9_]{1,15}$/;
const HOST = /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/;

export const ICON_PREFIX = '/v1/icon/';

function httpUrl(raw: string, base: string): string | null {
	try {
		const url = new URL(raw.trim(), base);
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
	} catch {
		return null;
	}
}

/** Where the icon for a source link is served: an X account's avatar, else its site's icon. */
export function iconPath(url: string): string | null {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return null;
	}
	const host = parsed.hostname.toLowerCase();
	if (X_HOSTS.has(host)) {
		const handle = parsed.pathname.split('/')[1] ?? '';
		if (HANDLE.test(handle) && !X_PAGES.has(handle.toLowerCase())) return `${ICON_PREFIX}x/${handle.toLowerCase()}`;
	}
	const site = host.replace(/^www\./, '');
	return HOST.test(site) ? `${ICON_PREFIX}site/${site}` : null;
}

export type IconKey = { kind: 'site'; host: string } | { kind: 'x'; handle: string };

/** The icon a request path asks for, or null for anything else. */
export function parseIconPath(pathname: string): IconKey | null {
	const site = pathname.match(/^\/v1\/icon\/site\/([a-z0-9.-]+)$/);
	if (site && HOST.test(site[1])) return { kind: 'site', host: site[1] };
	const x = pathname.match(/^\/v1\/icon\/x\/([a-z0-9_]+)$/);
	if (x && HANDLE.test(x[1])) return { kind: 'x', handle: x[1] };
	return null;
}

/** Every icon path the feed's hot stories use. */
export function feedIcons(feed: Feed): Set<string> {
	const paths = new Set<string>();
	for (const day of feed.days) for (const item of day.items) for (const source of item.sources ?? []) if (source.icon) paths.add(source.icon);
	return paths;
}

/**
 * A page's declared icons, best first: apple-touch-icon (large and square), then icons by their
 * declared size, then the rest; /favicon.ico last. URLs are resolved against the page.
 */
export function findIconLinks(html: string, pageUrl: string): string[] {
	const found: { url: string; score: number }[] = [];
	for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
		const rel = attr(tag, 'rel')?.toLowerCase() ?? '';
		if (!/(^|\s)(icon|apple-touch-icon|apple-touch-icon-precomposed)(\s|$)/.test(rel)) continue;
		const href = attr(tag, 'href');
		const url = href ? httpUrl(href.replace(/&amp;/g, '&'), pageUrl) : null;
		if (!url) continue;
		const size = Number(attr(tag, 'sizes')?.match(/(\d+)x\d+/i)?.[1] ?? 0);
		const score = rel.includes('apple-touch-icon') ? 1000 : size >= 32 ? 500 + size : size || 100;
		found.push({ url, score });
	}
	const ordered = found.sort((a, b) => b.score - a.score).map((entry) => entry.url);
	const fallback = new URL('/favicon.ico', pageUrl).href;
	return [...new Set([...ordered, fallback])];
}

function attr(tag: string, name: string): string | null {
	const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
	return match ? (match[2] ?? match[3] ?? match[4] ?? null) : null;
}

/** The site a subdomain belongs to (cn.wsj.com → wsj.com), for when the subdomain has no icon. */
export function parentHost(host: string): string | null {
	const labels = host.split('.');
	if (labels.length < 3) return null;
	const parent = labels.slice(1);
	// bbc.co.uk's parent is co.uk, which is not a site.
	if (parent.length === 2 && parent[0].length <= 3 && parent[1].length === 2) return null;
	return parent.join('.');
}
