import { buildBrainPodLibrary, type BrainPodItem } from './brainpod';
import { loadLegacyContent, type LegacyContentEntry } from './legacyContent';
import { buildKnowledgeSearchIndex } from './searchIndex';

/** Data for the section directory pages, built from the same published index as the rest of the site. */
export async function loadDirectoryData() {
	const [index, legacy] = await Promise.all([
		buildKnowledgeSearchIndex({ locale: 'zh-CN' }),
		loadLegacyContent(),
	]);
	const library = buildBrainPodLibrary(index);
	const legacyByRoute = new Map<string, LegacyContentEntry>(
		legacy.filter((entry) => entry.locale === 'zh-CN').map((entry) => [entry.route, entry]),
	);
	const collection = (id: string) => library.collections.find((c) => c.id === id);
	return { library, index, legacyByRoute, collection };
}

export type DirectoryData = Awaited<ReturnType<typeof loadDirectoryData>>;

export const TUTORIAL_SERIES = [
	{ id: 'newbie-tutorials', level: '零基础', lede: '一课只回答一个问题，先有直觉再讲术语。' },
	{ id: 'codex-tutorials', level: '上手', lede: '从第一次打开 Codex，到让它帮你完成一个项目。' },
	{ id: 'pi-agent-tutorials', level: '原理', lede: '读一个极简 Agent 的源码，看它如何工作。' },
	{ id: 'workbuddy-tutorials', level: '办公', lede: '从办公协作走向自动化。' },
] as const;

/** The four 新手村 lessons each carry one character: 编 / 念 / 忘 / 造. */
export const NEWBIE_MARKS: Record<string, string> = {
	'why-llms-hallucinate': '编',
	'what-is-a-knowledge-base': '念',
	'why-ai-forgets': '忘',
	'how-llms-are-trained': '造',
};

export function newbieMark(item: Pick<BrainPodItem, 'href'>) {
	const slug = item.href.split('/').filter(Boolean).at(-1) ?? '';
	return NEWBIE_MARKS[slug];
}

/** Series lessons in reading order: frontmatter weight first, then oldest first. */
export function seriesLessons(data: DirectoryData, id: string): BrainPodItem[] {
	const items = [...(data.collection(id)?.items ?? [])];
	const weight = (item: BrainPodItem) => {
		const value = data.legacyByRoute.get(item.key)?.frontmatter.weight;
		return typeof value === 'number' ? value : Number.POSITIVE_INFINITY;
	};
	return items.sort(
		(a, b) => weight(a) - weight(b) || (a.date ?? '').localeCompare(b.date ?? ''),
	);
}

export interface ReadingEntry {
	item: BrainPodItem;
	source: string;
	featured: boolean;
}

/** 精选阅读 grouped by month, newest first. */
export function highlightsByMonth(data: DirectoryData) {
	const entries: ReadingEntry[] = (data.collection('highlights')?.items ?? []).map((item) => {
		const legacy = data.legacyByRoute.get(item.key);
		const intro = legacy?.frontmatter.articleIntro as { sourceName?: string } | undefined;
		const sourceUrl = legacy?.frontmatter.sourceUrl;
		let source = intro?.sourceName ?? '';
		if (!source && typeof sourceUrl === 'string') {
			try {
				source = new URL(sourceUrl).hostname.replace(/^www\./, '');
			} catch {
				source = '';
			}
		}
		return { item, source, featured: legacy?.frontmatter.featured === true };
	});
	const months = new Map<string, ReadingEntry[]>();
	for (const entry of entries) {
		const key = (entry.item.date ?? '0000-00').slice(0, 7);
		months.set(key, [...(months.get(key) ?? []), entry]);
	}
	return [...months.entries()]
		.sort(([a], [b]) => b.localeCompare(a))
		.map(([key, list]) => ({
			key,
			year: key.slice(0, 4),
			month: Number(key.slice(5, 7)),
			entries: list.sort((a, b) => (b.item.date ?? '').localeCompare(a.item.date ?? '')),
		}));
}

export const CHINESE_MONTHS = [
	'',
	'一月',
	'二月',
	'三月',
	'四月',
	'五月',
	'六月',
	'七月',
	'八月',
	'九月',
	'十月',
	'十一月',
	'十二月',
];

export const shortDate = (date: string | null) => (date ? date.slice(5, 10).replace('-', '.') : '');
