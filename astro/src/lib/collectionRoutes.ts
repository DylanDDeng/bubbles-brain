/** One Chinese directory per collection, hosted in the home collection room. */
export const collectionDirectories: Record<string, string> = {
	'/newbie-tutorials/': 'newbie-tutorials',
	'/codex-tutorials/': 'codex-tutorials',
	'/pi-agent-tutorials/': 'pi-agent-tutorials',
	'/workbuddy-tutorials/': 'workbuddy-tutorials',
	'/highlights/': 'highlights',
	'/vibe-coding/terms/': 'vibe-coding-terms',
	'/vibe-coding/skills/': 'vibe-coding-skills',
	'/vibe-coding/design/': 'vibe-coding-design',
	'/benchmarks/': 'benchmarks',
};

export function isRetiredDirectory(path: string): boolean {
	return Object.hasOwn(collectionDirectories, path) || /^\/highlights\/\d{4}\/$/.test(path);
}

export function collectionHref(href: string): string {
	// Rewrite only internal directory links; article identities and external sources stay intact.
	if (!href.startsWith('/') || href.startsWith('//')) return href;
	const path = href.split(/[?#]/)[0];
	const id =
		collectionDirectories[path] || (/^\/highlights\/\d{4}\/$/.test(path) ? 'highlights' : '');
	return id ? `/#bc-${id}` : href;
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
