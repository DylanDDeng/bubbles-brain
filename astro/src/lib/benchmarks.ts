import ledger from '../../../data/benchmarks.json';

export type BenchmarkLocale = 'zh-CN' | 'en';

interface Bilingual {
	zh: string;
	en: string;
}

export interface BenchmarkDefinition {
	id: string;
	name: Bilingual;
	source: string;
	url: string;
	format: 'integer' | 'percent';
	measures: Bilingual;
	explainer: Bilingual;
	description: Bilingual;
}

export interface BenchmarkScore {
	value: number;
	ci?: number;
	agent?: string;
	note?: Bilingual;
	note_url?: string;
}

export interface BenchmarkModel {
	id: string;
	name: string;
	creator: string;
	scores: Record<string, BenchmarkScore>;
}

export interface BenchmarkLedger {
	schema_version: 1;
	checked_at: string;
	benchmarks: BenchmarkDefinition[];
	models: BenchmarkModel[];
}

export const benchmarkLedger = ledger as BenchmarkLedger;

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
		.sort((left, right) => right.score.value - left.score.value || left.index - right.index)
		.map(({ model, score }) => ({ model, score }));
}

/** Footnotes in table order so the page can number them deterministically. */
export function collectNotes(rows: RankedScore[]): Array<{ key: string; score: BenchmarkScore }> {
	return rows
		.filter(({ score }) => score.note)
		.map(({ model, score }) => ({ key: model.id, score }));
}
