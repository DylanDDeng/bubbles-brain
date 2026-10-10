/**
 * The outlets that reported a hot story, as a row of little pictures: each site's icon, or the
 * account's avatar for a post on X (round, like a person). Both come from the Worker
 * (/v1/icon/…); a missing picture leaves the outlet's initial. As links they open each outlet's
 * own report; inside a card that is itself a link, they are one labelled image.
 */
import { sourcesLabel, type NewsSource } from '../lib/aiNews';

export function outletIcons(
	sources: NewsSource[],
	{
		links = false,
		max = 8,
		size = 'regular',
	}: { links?: boolean; max?: number; size?: 'regular' | 'small' } = {},
): HTMLElement {
	const row = document.createElement('span');
	row.className = size === 'small' ? 'news-outlets news-outlets--small' : 'news-outlets';
	if (!links) {
		row.setAttribute('role', 'img');
		row.setAttribute('aria-label', sourcesLabel(sources));
	}
	// One picture per outlet: two articles from the same site would show the same icon twice.
	const outlets = sources.filter(
		(source, index) =>
			sources.findIndex((other) => (other.icon ?? other.name) === (source.icon ?? source.name)) ===
			index,
	);
	const shown = outlets.slice(0, max);
	for (const source of shown) {
		const item = document.createElement(links ? 'a' : 'span');
		item.className = source.icon?.includes('/v1/icon/x/')
			? 'news-outlet news-outlet--person'
			: 'news-outlet';
		item.title = source.name;
		if (item instanceof HTMLAnchorElement) {
			item.href = source.url;
			item.target = '_blank';
			item.rel = 'noopener noreferrer';
			item.setAttribute('aria-label', source.name);
		}
		const initial = document.createElement('span');
		initial.className = 'news-outlet__initial';
		initial.setAttribute('aria-hidden', 'true');
		initial.textContent = Array.from(source.name)[0]?.toUpperCase() ?? '·';
		item.append(initial);
		if (source.icon) {
			const image = document.createElement('img');
			image.src = source.icon;
			image.alt = '';
			image.loading = 'lazy';
			image.decoding = 'async';
			image.referrerPolicy = 'no-referrer';
			// Shown once loaded, so a slow or missing picture leaves the initial, not a blank square.
			image.addEventListener('load', () => image.classList.add('is-loaded'), { once: true });
			image.addEventListener('error', () => image.remove(), { once: true });
			item.append(image);
		}
		row.append(item);
	}
	if (outlets.length > shown.length) {
		const more = document.createElement('span');
		more.className = 'news-outlets__more';
		more.textContent = `+${outlets.length - shown.length}`;
		row.append(more);
	}
	return row;
}
