/** The site's top-level sections, shown in the header on every page. */
export interface SiteSection {
	id: string;
	label: string;
	href: string;
	/** Path prefixes that belong to this section. */
	prefixes: string[];
}

const zhSections: SiteSection[] = [
	{
		id: 'tutorials',
		label: '教程',
		href: '/tutorials/',
		prefixes: [
			'/tutorials/',
			'/newbie-tutorials/',
			'/codex-tutorials/',
			'/pi-agent-tutorials/',
			'/workbuddy-tutorials/',
			'/deepseek-harness-tutorials/',
		],
	},
	{ id: 'highlights', label: '精选阅读', href: '/highlights/', prefixes: ['/highlights/'] },
	{ id: 'ai-news', label: 'AI 动态', href: '/ai-news/', prefixes: ['/ai-news/'] },
	{ id: 'vibe-coding', label: 'Vibe Coding', href: '/vibe-coding/', prefixes: ['/vibe-coding/'] },
	{ id: 'benchmarks', label: 'Benchmarks', href: '/benchmarks/', prefixes: ['/benchmarks/'] },
];

const enSections: SiteSection[] = [
	{ id: 'highlights', label: 'Highlights', href: '/en/highlights/', prefixes: ['/en/highlights/'] },
	{ id: 'benchmarks', label: 'Benchmarks', href: '/en/benchmarks/', prefixes: ['/en/benchmarks/'] },
];

export function siteSections(locale: 'zh-CN' | 'en'): SiteSection[] {
	return locale === 'en' ? enSections : zhSections;
}

export function activeSiteSection(pathname: string, locale: 'zh-CN' | 'en') {
	return siteSections(locale).find((section) =>
		section.prefixes.some((prefix) => pathname.startsWith(prefix)),
	)?.id;
}
