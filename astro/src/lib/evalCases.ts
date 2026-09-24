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
	/**
	 * Runnable HTML under /eval-demos/ (default), a static screenshot under
	 * /images/eval-cases/works/, or a rendered MP4 under /media/eval-cases/.
	 */
	kind?: 'html' | 'image' | 'video';
	file: string;
	/** When the run was made. The year a case is filed under comes from its model, not from this. */
	date: string;
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

export function isVideoCase(item: EvalCase): boolean {
	return item.kind === 'video';
}

export function isHtmlCase(item: EvalCase): boolean {
	return !item.kind || item.kind === 'html';
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

/** The year a case is filed under: its model's release year, whenever the run itself happened. */
export function caseYear(item: EvalCase, ledgerData: EvalLedger = evalLedger): number {
	const model = ledgerData.models.find((entry) => entry.id === item.model);
	if (!model) throw new Error(`Unknown eval model: ${item.model}`);
	return Number(model.released.slice(0, 4));
}

export function evalYears(cases = evalLedger.cases, ledgerData: EvalLedger = evalLedger): number[] {
	return [...new Set(cases.map((item) => caseYear(item, ledgerData)))].sort((a, b) => b - a);
}

export function modelCount(cases: EvalCase[]): number {
	return new Set(cases.map((item) => item.model)).size;
}

export interface EvalTaskCard {
	task: EvalTask;
	/** Every model's run on this task, newest first, regardless of release year. */
	cases: EvalCase[];
	/** Release years of the models that took the task (for the year filter only). */
	years: number[];
}

/** One card per task, newest run first. Years are a filter, never a grouping. */
export function evalTaskCards(ledgerData: EvalLedger = evalLedger): EvalTaskCard[] {
	return ledgerData.tasks
		.map((task) => {
			const cases = ledgerData.cases.filter((item) => item.task === task.id).sort(byNewest);
			return { task, cases, years: evalYears(cases, ledgerData) };
		})
		.filter((card) => card.cases.length > 0)
		.sort(
			(a, b) => b.cases[0].date.localeCompare(a.cases[0].date) || b.cases.length - a.cases.length,
		);
}

/**
 * Vendor logos (LobeHub icon set, MIT) under static/images/vendors/. A vendor without a logo
 * falls back to its initial.
 */
const VENDOR_LOGOS: Record<string, string> = {
	Anthropic: 'anthropic',
	OpenAI: 'openai',
	Google: 'google',
	DeepSeek: 'deepseek',
	'Z.ai': 'zai',
	Qwen: 'qwen',
	'Moonshot AI': 'moonshot',
	MiniMax: 'minimax',
	Xiaomi: 'xiaomi',
	Meta: 'meta',
};

export interface VendorMark {
	/** Logo URL, or null when only the initial can be shown. */
	logo: string | null;
	initial: string;
}

export function vendorMark(vendor: string): VendorMark {
	const slug = VENDOR_LOGOS[vendor];
	return {
		logo: slug ? `/images/vendors/${slug}.svg` : null,
		initial: vendor.slice(0, 1).toUpperCase(),
	};
}

/** Distinct vendors on a card, in the order their newest run appears. */
export function cardVendors(cases: EvalCase[]): string[] {
	return [...new Set(cases.map((item) => evalModel(item.model).vendor))];
}

/** "09-23" for this year, "2025-12-14" otherwise — compact like Linear's dates. */
export function shortDate(date: string, now = new Date()): string {
	return date.startsWith(String(now.getFullYear())) ? date.slice(5) : date;
}

export function formatBytes(bytes: number): string {
	return bytes >= 1024 * 1024
		? `${(bytes / 1024 / 1024).toFixed(1)} MB`
		: `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
