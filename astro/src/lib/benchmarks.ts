import ledger from '../../../data/benchmarks.json';

export type BenchmarkLocale = 'zh-CN' | 'en';

interface Bilingual {
	zh: string;
	en: string;
}

export const benchmarkCategories = [
	{ id: 'general', name: { zh: '综合能力', en: 'General intelligence' } },
	{ id: 'coding', name: { zh: 'Coding', en: 'Coding' } },
	{ id: 'finance', name: { zh: '金融', en: 'Finance' } },
] as const;

export type BenchmarkCategory = (typeof benchmarkCategories)[number]['id'];

export interface BenchmarkDefinition {
	id: string;
	category: BenchmarkCategory;
	name: Bilingual;
	source: string;
	checked_at?: string;
	url: string;
	format: 'integer' | 'percent';
	score_label?: Bilingual;
	measures: Bilingual;
	explainer: Bilingual;
	description: Bilingual;
	related_reading?: { title: Bilingual; href: Bilingual };
}

export interface BenchmarkScore {
	value: number;
	almost_resolved?: number;
	average_pass_rate?: number;
	all_pass?: number;
	worst_at_5?: number;
	best_at_5?: number;
	average_cost_usd?: number;
	average_duration_seconds?: number;
	source_model?: string;
	ci?: number;
	agent?: string;
	note?: Bilingual;
	note_url?: string;
}

export interface BenchmarkModel {
	id: string;
	name: string;
	creator: string;
	scores: Partial<Record<string, BenchmarkScore>>;
}

export interface BenchmarkLedger {
	schema_version: 1;
	checked_at: string;
	benchmarks: BenchmarkDefinition[];
	models: BenchmarkModel[];
}

export const benchmarkLedger = ledger as BenchmarkLedger;

/** Each benchmark has one primary domain; only render populated groups. */
export function groupedBenchmarks(benchmarks = benchmarkLedger.benchmarks) {
	return benchmarkCategories
		.map((category) => ({
			...category,
			benchmarks: benchmarks.filter((benchmark) => benchmark.category === category.id),
		}))
		.filter((group) => group.benchmarks.length > 0);
}

export function pick(text: Bilingual, locale: BenchmarkLocale): string {
	return locale === 'en' ? text.en : text.zh;
}

export function benchmarkParagraphs(text: string, locale: BenchmarkLocale): string[] {
	const sentences = Array.from(
		new Intl.Segmenter(locale, { granularity: 'sentence' }).segment(text),
	);
	const paragraphs: string[] = [];
	for (let index = 0; index < sentences.length; index += 2) {
		paragraphs.push(
			sentences
				.slice(index, index + 2)
				.map(({ segment }) => segment)
				.join(''),
		);
	}
	return paragraphs;
}

export function formatScore(score: BenchmarkScore, format: BenchmarkDefinition['format']): string {
	return format === 'percent' ? `${score.value.toFixed(1)}%` : String(score.value);
}

export function benchmarkRoute(benchmarkId: string, locale: BenchmarkLocale): string {
	return `${locale === 'en' ? '/en' : ''}/benchmarks/${benchmarkId}/`;
}

/** Return to the category containing this benchmark, in the existing directory. */
export function benchmarkDirectoryRoute(
	benchmark: BenchmarkDefinition,
	locale: BenchmarkLocale,
): string {
	return `${locale === 'en' ? '/en/benchmarks/' : '/'}#bc-benchmarks-${benchmark.category}`;
}

export interface RankedScore {
	model: BenchmarkModel;
	score: BenchmarkScore;
}

/**
 * Models that have a result on this benchmark, highest first; ties keep ledger
 * order. This is the no-JS default order of every benchmark page.
 */
export function rankedScores(
	benchmarkId: string,
	data: BenchmarkLedger = benchmarkLedger,
): RankedScore[] {
	return data.models
		.flatMap((model, index) => {
			const score = model.scores[benchmarkId];
			return score ? [{ model, score, index }] : [];
		})
		.sort(
			(left, right) =>
				right.score.value - left.score.value ||
				(right.score.almost_resolved ?? 0) - (left.score.almost_resolved ?? 0) ||
				(right.score.average_pass_rate ?? 0) - (left.score.average_pass_rate ?? 0) ||
				left.index - right.index,
		)
		.map(({ model, score }) => ({ model, score }));
}

/** Footnotes in table order so the page can number them deterministically. */
export function collectNotes(rows: RankedScore[]): Array<{ key: string; score: BenchmarkScore }> {
	return rows
		.filter(({ score }) => score.note)
		.map(({ model, score }) => ({ key: model.id, score }));
}
