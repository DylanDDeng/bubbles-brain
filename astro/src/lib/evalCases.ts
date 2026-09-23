import ledger from '../../../data/eval-cases/cases.json';

interface Bilingual {
	zh: string;
	en?: string;
}

export interface EvalCategory {
	id: string;
	name: Bilingual;
}

export interface EvalModel {
	id: string;
	name: string;
	vendor: string;
	released: string;
}

export interface EvalTask {
	id: string;
	title: Bilingual;
	category: string;
	difficulty: 'easy' | 'medium' | 'hard';
	prompt: Bilingual;
	reference_video?: string;
	legacy_id?: string;
}

export interface EvalCase {
	id: string;
	task: string;
	model: string;
	/** Runnable HTML under /eval-demos/ (default) or a static screenshot under /images/eval-cases/works/. */
	kind?: 'html' | 'image';
	file: string;
	date: string;
	year: number;
	page_title: string | null;
	stack: string[];
	bytes: number;
}

export interface EvalLedger {
	schema_version: 1;
	updated_at: string;
	categories: EvalCategory[];
	models: EvalModel[];
	tasks: EvalTask[];
	cases: EvalCase[];
	excluded_files: Array<{ file: string; reason: string }>;
}

export const evalLedger = ledger as EvalLedger;

export const difficultyLabel: Record<EvalTask['difficulty'], string> = {
	easy: '简单',
	medium: '中等',
	hard: '困难',
};

export const EVAL_CASES_ROUTE = '/benchmarks/cases/';

export function evalTaskRoute(taskId: string): string {
	return `${EVAL_CASES_ROUTE}${taskId}/`;
}

export function isImageCase(item: EvalCase): boolean {
	return item.kind === 'image';
}

export function evalThumb(caseId: string): string {
	return `/images/eval-cases/${caseId}.webp`;
}

const modelsById = new Map(evalLedger.models.map((model) => [model.id, model]));
const categoriesById = new Map(evalLedger.categories.map((category) => [category.id, category]));

export function evalModel(id: string): EvalModel {
	const model = modelsById.get(id);
	if (!model) throw new Error(`Unknown eval model: ${id}`);
	return model;
}

export function evalCategory(id: string): EvalCategory {
	const category = categoriesById.get(id);
	if (!category) throw new Error(`Unknown eval category: ${id}`);
	return category;
}

/** Newest run first; ties fall back to model name so the order is stable across builds. */
export function byNewest(a: EvalCase, b: EvalCase): number {
	return (
		b.date.localeCompare(a.date) || evalModel(a.model).name.localeCompare(evalModel(b.model).name)
	);
}

export function casesForTask(taskId: string, cases = evalLedger.cases): EvalCase[] {
	return cases.filter((item) => item.task === taskId).sort(byNewest);
}

export function evalYears(cases = evalLedger.cases): number[] {
	return [...new Set(cases.map((item) => item.year))].sort((a, b) => b - a);
}

export interface EvalTaskYearCard {
	task: EvalTask;
	year: number;
	cases: EvalCase[];
	/** Runs of the same task in other years, so a card can point at them. */
	otherYears: Array<{ year: number; count: number }>;
}

export interface EvalYearGroup {
	year: number;
	cards: EvalTaskYearCard[];
	caseCount: number;
}

/**
 * The gallery is sliced by evaluation year. A task tested in two years shows up in both,
 * each card carrying only that year's runs.
 */
export function evalYearGroups(ledgerData: EvalLedger = evalLedger): EvalYearGroup[] {
	return evalYears(ledgerData.cases).map((year) => {
		const yearCases = ledgerData.cases.filter((item) => item.year === year);
		const cards = ledgerData.tasks
			.map((task) => {
				const cases = yearCases.filter((item) => item.task === task.id).sort(byNewest);
				const otherYears = evalYears(ledgerData.cases.filter((item) => item.task === task.id))
					.filter((other) => other !== year)
					.map((other) => ({
						year: other,
						count: ledgerData.cases.filter((item) => item.task === task.id && item.year === other)
							.length,
					}));
				return { task, year, cases, otherYears };
			})
			.filter((card) => card.cases.length > 0)
			.sort(
				(a, b) => b.cases[0].date.localeCompare(a.cases[0].date) || b.cases.length - a.cases.length,
			);
		return { year, cards, caseCount: yearCases.length };
	});
}

export function formatBytes(bytes: number): string {
	return bytes >= 1024 * 1024
		? `${(bytes / 1024 / 1024).toFixed(1)} MB`
		: `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
