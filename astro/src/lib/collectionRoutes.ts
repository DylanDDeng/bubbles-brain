/** The old per-collection directory paths, keyed to their collection id. */
export const collectionDirectories: Record<string, string> = {
	'/newbie-tutorials/': 'newbie-tutorials',
	'/codex-tutorials/': 'codex-tutorials',
	'/pi-agent-tutorials/': 'pi-agent-tutorials',
	'/workbuddy-tutorials/': 'workbuddy-tutorials',
	'/highlights/': 'highlights',
	'/vibe-coding/terms/': 'vibe-coding-terms',
	'/vibe-coding/skills/': 'vibe-coding-skills',
	'/vibe-coding/design/': 'vibe-coding-design',
	'/vibe-coding/showcase/': 'vibe-coding-showcase',
	'/benchmarks/': 'benchmarks',
};

/** Where each collection's directory lives. Tutorial series share one page, one anchor each. */
export const collectionHomes: Record<string, string> = {
	'newbie-tutorials': '/tutorials/#newbie-tutorials',
	'codex-tutorials': '/tutorials/#codex-tutorials',
	'pi-agent-tutorials': '/tutorials/#pi-agent-tutorials',
	'workbuddy-tutorials': '/tutorials/#workbuddy-tutorials',
	highlights: '/highlights/',
	'vibe-coding-terms': '/vibe-coding/terms/',
	'vibe-coding-skills': '/vibe-coding/skills/',
	'vibe-coding-design': '/vibe-coding/design/',
	'vibe-coding-showcase': '/vibe-coding/showcase/',
	benchmarks: '/benchmarks/',
};

/** Top-level section pages, for links that used to point at a room section. */
export const sectionHomes: Record<string, string> = {
	tutorials: '/tutorials/',
	highlights: '/highlights/',
	'vibe-coding': '/vibe-coding/',
	benchmarks: '/benchmarks/',
};

/** Directory paths with no page of their own; the release keeps them returning 404. */
export const retiredDirectories = [
	'/newbie-tutorials/',
	'/codex-tutorials/',
	'/pi-agent-tutorials/',
	'/workbuddy-tutorials/',
];

const yearArchive = /^\/highlights\/\d{4}\/$/;

export function isRetiredDirectory(path: string): boolean {
	return retiredDirectories.includes(path) || yearArchive.test(path);
}

/** Any collection directory path, served by a directory page or retired; never a legacy index page. */
export function isCollectionDirectory(path: string): boolean {
	return Object.hasOwn(collectionDirectories, path) || yearArchive.test(path);
}

export function collectionHome(id: string): string {
	return collectionHomes[id] ?? sectionHomes[id] ?? '/';
}

/** Rewrite an internal link to a collection directory, or an old home-room anchor, to where it lives now. */
export function collectionHref(href: string): string {
	if (!href.startsWith('/') || href.startsWith('//')) return href;
	const room = /^\/#bc-([\w-]+)$/.exec(href);
	if (room) return collectionHome(room[1]);
	const path = href.split(/[?#]/)[0];
	const id = collectionDirectories[path] || (yearArchive.test(path) ? 'highlights' : '');
	return id ? collectionHome(id) : href;
}

type LinkNode = {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: LinkNode[];
};
export function rehypeCollectionLinks() {
	return (tree: LinkNode) => {
		function visit(node: LinkNode) {
			if (node.tagName === 'a' && typeof node.properties?.href === 'string')
				node.properties.href = collectionHref(node.properties.href);
			node.children?.forEach(visit);
		}
		visit(tree);
	};
}
