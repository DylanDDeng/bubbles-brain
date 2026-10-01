import { collectionHomes, sectionHomes } from '../lib/collectionRoutes';

/**
 * The directories used to live in the home page as #bc-<id> panels. Shared links and
 * bookmarks still carry those anchors, so send them to the directory page that replaced them.
 */
export function roomAnchorTarget(hash: string): string | undefined {
	if (!hash.startsWith('#bc-')) return undefined;
	const id = hash.slice(4);
	const direct = collectionHomes[id] ?? sectionHomes[id];
	if (direct) return direct;
	const term = /^vibe-coding-terms-([a-z]+(?:-[a-z]+)*?)(?:-\d+)?$/.exec(id);
	if (term) return `/vibe-coding/terms/#${term[1]}`;
	const bench = /^benchmarks-([a-z]+)$/.exec(id);
	if (bench) return `/benchmarks/#${bench[1]}`;
	return undefined;
}

function redirectRoomAnchor() {
	if (location.pathname !== '/') return;
	const target = roomAnchorTarget(location.hash);
	if (target) location.replace(target);
}

if (typeof document !== 'undefined') {
	document.addEventListener('astro:page-load', redirectRoomAnchor);
	window.addEventListener('hashchange', redirectRoomAnchor);
}
