import type { KnowledgeSearchIndex, KnowledgeSearchItem } from './searchIndex';
import { changelog, type ChangelogItem } from '../data/changelog';
import { buildReadingUpdates, type ReadingUpdate } from './readingUpdates';

export type BrainPodItem = Pick<
	KnowledgeSearchItem,
	'key' | 'href' | 'title' | 'summary' | 'section' | 'section_label' | 'date' | 'external'
>;
export interface BrainPodCollection {
	kind: 'collection';
	id: string;
	title: string;
	description: string;
	href: string;
	index: number;
	items: BrainPodItem[];
}
export interface BrainPodPlaylist {
	title: string;
	description: string;
	index: number;
	items: BrainPodItem[];
}
export interface BrainPodLibrary {
	items: BrainPodItem[];
	collections: BrainPodCollection[];
	playlists: Record<string, BrainPodPlaylist>;
	featured: { item: BrainPodItem; reason: string; detail: string } | null;
	recent: { item: BrainPodItem; recordedAt: string }[];
	updates: ReadingUpdate[];
}

const collections = [
	{
		id: 'newbie-tutorials',
		title: '新手村',
		description: '从一个好问题开始。用直觉、图解与小实验，弄懂大模型背后的基本原理。',
		href: '/newbie-tutorials/',
	},
	{
		id: 'codex-tutorials',
		title: 'Codex 教程',
		description: '从第一次打开 Codex，到让 Agent 帮你完成一个项目。把想法，一步步做出来。',
		href: '/codex-tutorials/',
	},
	{
		id: 'pi-agent-tutorials',
		title: 'Pi Agent 教程',
		description: '从工具、会话，到 Compaction 与 Extension，理解一个极简 Agent 如何工作。',
		href: '/pi-agent-tutorials/',
	},
	{
		id: 'workbuddy-tutorials',
		title: 'WorkBuddy 教程',
		description: '从办公协作走向自动化，把注意力留给更有意思的事。',
		href: '/workbuddy-tutorials/',
	},
	{
		id: 'highlights',
		title: '精选阅读',
		description: '值得反复读的一手资料与深度文章。收集有分量的观点，留给下一次思考。',
		href: '/highlights/',
	},
	{
		id: 'vibe-coding-terms',
		title: 'Vibe Coding 术语',
		description: '图解、比喻，还有可以亲手操作的小实验。把 AI 编程的概念一块一块拆开。',
		href: '/vibe-coding/terms/',
	},
	{
		id: 'vibe-coding-skills',
		title: 'Vibe Coding Skills',
		description: '浏览原始 SKILL.md、作者和来源，把好方法带进工作流。',
		href: '/vibe-coding/skills/',
	},
	{
		id: 'vibe-coding-design',
		title: 'Vibe Coding Design',
		description: '从品牌的色彩、字体与界面语言中寻找灵感，看看设计如何写进 AI 的工作方式。',
		href: '/vibe-coding/design/',
	},
	{
		id: 'benchmarks',
		title: 'Benchmarks',
		description: '先弄清每个 benchmark 到底在测模型的什么能力，再去看那些分数。',
		href: '/benchmarks/',
	},
];

/** Use the same published index as the rest of the site; never maintain a separate article catalog. */
export function buildBrainPodLibrary(
	index: KnowledgeSearchIndex,
	updates: ChangelogItem[] = changelog,
): BrainPodLibrary {
	const ids = new Set(collections.map((c) => c.id));
	const items = index.items
		.filter((item) => ids.has(item.section))
		.map(({ key, href, title, summary, section, section_label, date, external }) => ({
			key,
			href,
			title,
			summary,
			section,
			section_label,
			date,
			external,
		}));
	const grouped = collections.map((c, index): BrainPodCollection => ({
		...c,
		index,
		kind: 'collection',
		items: items.filter((i) => i.section === c.id),
	}));
	const pick = (hrefs: string[]) =>
		hrefs.flatMap((href) => {
			const item = items.find((i) => i.href === href);
			return item ? [item] : [];
		});
	const featuredItem = items.find((item) => item.key === '/newbie-tutorials/how-llms-are-trained/');
	const featured = featuredItem
		? {
				item: featuredItem,
				reason: '三个动手小实验，把预训练、微调和人类反馈变成直觉。先弄懂 AI 怎么学，再去用好它。',
				detail: '新手村 · 3 个小实验',
			}
		: null;
	// Changelog dates document when the site recorded an addition or update.
	// Article dates can describe the original source; do not relabel them as collection dates.
	const seen = new Set<string>();
	const recent = [...updates]
		.sort((a, b) => b.date.localeCompare(a.date))
		.flatMap((update) =>
			(update.links ?? []).flatMap((link) => {
				const item =
					items.find((item) => item.key === link.href) ??
					items.find((item) => item.href === link.href);
				if (!item || item.key === featuredItem?.key || seen.has(item.key)) return [];
				seen.add(item.key);
				return [{ item, recordedAt: update.date }];
			}),
		)
		.slice(0, 3);
	return {
		items,
		collections: grouped,
		featured,
		recent,
		updates: buildReadingUpdates(items, updates),
		playlists: {
			start: {
				title: 'AI 的第一课',
				description: '从好奇到理解，一次弄懂一个问题。',
				index: 0,
				items: pick([
					'/newbie-tutorials/how-llms-are-trained/',
					'/newbie-tutorials/why-llms-hallucinate/',
					'/newbie-tutorials/why-ai-forgets/',
					'/newbie-tutorials/what-is-a-knowledge-base/',
				]),
			},
			agent: {
				title: '和 Agent 一起做点什么',
				description: '认识工具，开始你的第一个项目。',
				index: 1,
				items: pick([
					'/codex-tutorials/codex-app-beginner-guide/',
					'/codex-tutorials/codex-app-practical-tips/',
					'/pi-agent-tutorials/pi-agent-overview/',
					'/pi-agent-tutorials/pi-agent-tool-system/',
					'/pi-agent-tutorials/pi-agent-extensions/',
				]),
			},
			design: {
				title: '给下一个灵感找个形状',
				description: '读懂设计，再把它变成作品。',
				index: 7,
				items: items.filter((i) => i.section === 'vibe-coding-design').slice(0, 8),
			},
		},
	};
}
