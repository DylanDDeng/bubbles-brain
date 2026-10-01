import { isRetiredDirectory } from './collectionRoutes';
import { benchmarkLedger, benchmarkRoute, pick } from './benchmarks';
import { legacyEntryIsRoutable, loadLegacyContent } from './legacyContent';
import { designBrands } from '../data/designBrands';
import { showcaseHref, showcaseWorks } from '../data/showcase';
import { getVibeCodingConcepts } from '../data/vibeCodingTerms';

export { renderRss } from './siteRss';

export interface SiteRecord {
	route: string;
	title: string;
	description: string;
	locale: 'zh-CN' | 'en';
	section: string;
	lastmod: Date | null;
	alternateRoute: string | null;
}

const SITE = 'https://bubblenews.today';

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function canonical(route: string): string {
	return new URL(route, SITE).href;
}

export async function loadSiteManifest(): Promise<SiteRecord[]> {
	const legacyEntries = await loadLegacyContent();
	const records: Omit<SiteRecord, 'alternateRoute'>[] = [
		{
			route: '/',
			title: "Bubble's Brain",
			description: '精选、可检索、可复用的个人 AI 知识库',
			locale: 'zh-CN',
			section: 'home',
			lastmod: null,
		},
		{
			route: '/en/',
			title: "Bubble's Brain",
			description: 'A curated, searchable, reusable personal AI knowledge base',
			locale: 'en',
			section: 'home',
			lastmod: null,
		},
		{
			route: '/search/',
			title: '知识搜索',
			description: '搜索 Codex、Pi Agent、WorkBuddy 教程与知识文章',
			locale: 'zh-CN',
			section: 'knowledge',
			lastmod: null,
		},
		{
			route: '/tutorials/',
			title: '教程',
			description: '从一个好问题开始，到让 Agent 替你把项目做出来。新手村、Codex、Pi Agent、WorkBuddy 四个系列。',
			locale: 'zh-CN',
			section: 'tutorials',
			lastmod: null,
		},
		{
			route: '/highlights/',
			title: '精选阅读',
			description: '值得反复读的一手资料与深度文章。每篇都是精读或全译，附原文入口。',
			locale: 'zh-CN',
			section: 'highlights',
			lastmod: null,
		},
		{
			route: '/vibe-coding/',
			title: 'Vibe Coding',
			description: '术语图解、好用的 Skills、品牌设计语言，和别人用 AI 做出的作品。',
			locale: 'zh-CN',
			section: 'vibe-coding',
			lastmod: null,
		},
		{
			route: '/vibe-coding/skills/',
			title: 'Vibe Coding Skills',
			description: '浏览原始 SKILL.md、作者和来源，把好方法带进工作流。',
			locale: 'zh-CN',
			section: 'vibe-coding',
			lastmod: null,
		},
		{
			route: '/vibe-coding/showcase/',
			title: 'Vibe Coding Showcase',
			description: '别人用 AI 做出来的作品：用代码生成的视频，以后还有网页与更多。',
			locale: 'zh-CN',
			section: 'vibe-coding',
			lastmod: null,
		},
		{
			route: '/vibe-coding/terms/',
			title: 'Vibe Coding 术语',
			description: 'Vibe Coding 与 AI 编程常见术语解释',
			locale: 'zh-CN',
			section: 'vibe-coding',
			lastmod: null,
		},
		{
			route: '/vibe-coding/design/',
			title: 'Design 设计理念库',
			description: '大公司如何用 DESIGN.md 描述自己的视觉语言：色彩、字体、组件规则与设计哲学',
			locale: 'zh-CN',
			section: 'vibe-coding',
			lastmod: null,
		},
		{
			route: '/changelog/',
			title: '更新日志',
			description: "记录 Bubble's Brain 知识库的每一次内容收录、功能迭代与体验演进",
			locale: 'zh-CN',
			section: 'changelog',
			lastmod: null,
		},
		{
			route: '/benchmarks/',
			title: 'Benchmarks',
			description: '前沿模型的第三方评测成绩汇总，手工核对',
			locale: 'zh-CN',
			section: 'benchmarks',
			lastmod: null,
		},
		{
			route: '/en/benchmarks/',
			title: 'Benchmarks',
			description: 'Hand-checked third-party benchmark results for frontier models',
			locale: 'en',
			section: 'benchmarks',
			lastmod: null,
		},
	];

	for (const benchmark of benchmarkLedger.benchmarks) {
		for (const locale of ['zh-CN', 'en'] as const) {
			records.push({
				route: benchmarkRoute(benchmark.id, locale),
				title: pick(benchmark.name, locale),
				description: pick(benchmark.measures, locale),
				locale,
				section: 'benchmarks',
				lastmod: null,
			});
		}
	}

	for (const concept of getVibeCodingConcepts()) {
		records.push({
			route: `/vibe-coding/terms/${concept.id}/`,
			title: `${concept.chineseName}（${concept.name}）`,
			description: concept.description,
			locale: 'zh-CN',
			section: 'vibe-coding',
			lastmod: null,
		});
	}

	for (const brand of designBrands) {
		records.push({
			route: `/vibe-coding/design/${brand.id}/`,
			title: `${brand.name} 的设计语言`,
			description: brand.tagline,
			locale: 'zh-CN',
			section: 'vibe-coding',
			lastmod: null,
		});
	}

	for (const work of showcaseWorks) {
		records.push({
			route: showcaseHref(work),
			title: `${work.title} · Showcase`,
			description: work.note,
			locale: 'zh-CN',
			section: 'vibe-coding',
			lastmod: new Date(work.added),
		});
	}

	for (const entry of legacyEntries) {
		if (!legacyEntryIsRoutable(entry)) continue;
		records.push({
			route: entry.route,
			title: entry.title,
			description: entry.description,
			locale: entry.locale,
			section: entry.section,
			lastmod: entry.date,
		});
	}

	const byRoute = new Map<string, Omit<SiteRecord, 'alternateRoute'>>();
	for (const record of records.filter((record) => !isRetiredDirectory(record.route))) {
		if (byRoute.has(record.route))
			throw new Error(`Duplicate site manifest route: ${record.route}`);
		byRoute.set(record.route, record);
	}

	return [...byRoute.values()]
		.map((record) => {
			const alternateRoute =
				record.locale === 'en' ? record.route.replace(/^\/en/, '') : `/en${record.route}`;
			return { ...record, alternateRoute: byRoute.has(alternateRoute) ? alternateRoute : null };
		})
		.sort((a, b) => a.route.localeCompare(b.route));
}

export function renderSitemapUrlset(records: SiteRecord[]): string {
	const rows = records.map((record) => {
		const alternates = [
			record,
			...(record.alternateRoute ? [{ ...record, route: record.alternateRoute }] : []),
		]
			.map((alternate) => {
				const locale = alternate.route.startsWith('/en/') ? 'en' : 'zh-CN';
				return `<xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(canonical(alternate.route))}"/>`;
			})
			.join('');
		const lastmod = record.lastmod ? `<lastmod>${record.lastmod.toISOString()}</lastmod>` : '';
		return `<url><loc>${escapeXml(canonical(record.route))}</loc>${lastmod}${alternates}</url>`;
	});
	return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${rows.join('')}</urlset>\n`;
}

export function renderSitemapIndex(): string {
	return `<?xml version="1.0" encoding="utf-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${SITE}/zh-cn/sitemap.xml</loc></sitemap><sitemap><loc>${SITE}/en/sitemap.xml</loc></sitemap></sitemapindex>\n`;
}

export function xmlResponse(body: string): Response {
	return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
