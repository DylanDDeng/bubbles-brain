import { buildBrainPodLibrary, type BrainPodItem } from './brainpod';
import { loadLegacyContent, type LegacyContentEntry } from './legacyContent';
import { buildKnowledgeSearchIndex } from './searchIndex';
import { sourceFromUrl, sourceMark, type SourceMark } from './sourceVendor';

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
	{ id: 'newbie-tutorials', level: '零基础' },
	{ id: 'codex-tutorials', level: '上手' },
	{ id: 'pi-agent-tutorials', level: '原理' },
	{ id: 'workbuddy-tutorials', level: '办公' },
] as const;

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
	/** The company logo (or letter) shown beside the source. */
	mark: SourceMark;
	featured: boolean;
}

/** 精选阅读 grouped by month, newest first. */
export function highlightsByMonth(data: DirectoryData) {
	const entries: ReadingEntry[] = (data.collection('highlights')?.items ?? []).map((item) => {
		const legacy = data.legacyByRoute.get(item.key);
		const intro = legacy?.frontmatter.articleIntro as { sourceName?: string } | undefined;
		const sourceUrl = legacy?.frontmatter.sourceUrl;
		const source = intro?.sourceName || sourceFromUrl(sourceUrl);
		return {
			item,
			source,
			mark: sourceMark(source, sourceUrl),
			featured: legacy?.frontmatter.featured === true,
		};
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
