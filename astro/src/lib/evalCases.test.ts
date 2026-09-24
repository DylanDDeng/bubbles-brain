import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { benchmarkLedger } from './benchmarks';
import {
	casesForTask,
	evalLedger,
	evalTaskRoute,
	evalThumb,
	evalTaskCards,
	evalModel,
	isImageCase,
	shortDate,
	vendorMark,
	caseYear,
	type EvalLedger,
} from './evalCases';

const staticRoot = resolve(__dirname, '../../../static');
const { cases, tasks, models, categories } = evalLedger;

describe('eval case ledger', () => {
	it('uses unique ids and only references known tasks, models and categories', () => {
		for (const list of [cases, tasks, models, categories]) {
			const ids = list.map((item) => item.id);
			expect(new Set(ids).size).toBe(ids.length);
		}
		const taskIds = new Set(tasks.map((task) => task.id));
		const modelIds = new Set(models.map((model) => model.id));
		const categoryIds = new Set(categories.map((category) => category.id));
		for (const item of cases) {
			expect(taskIds.has(item.task), item.id).toBe(true);
			expect(modelIds.has(item.model), item.id).toBe(true);
		}
		for (const task of tasks) {
			expect(categoryIds.has(task.category), task.id).toBe(true);
			expect(casesForTask(task.id).length, task.id).toBeGreaterThan(0);
			expect(task.prompt.zh.trim(), task.id).not.toBe('');
		}
	});

	it('dates every run and every model release', () => {
		for (const item of cases) expect(item.date, item.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		for (const model of models) expect(model.released, model.id).toMatch(/^\d{4}-\d{2}$/);
	});

	it('files a case under its model release year, not the run date', () => {
		const glm47 = { ...cases[0], model: 'glm-4.7', date: '2026-05-01' };
		expect(evalModel('glm-4.7').released.startsWith('2025')).toBe(true);
		expect(caseYear(glm47)).toBe(2025);
	});

	it('accounts for every published demo file exactly once', () => {
		const onDisk = readdirSync(resolve(staticRoot, 'eval-demos'))
			.filter((name) => name.endsWith('.html'))
			.map((name) => `/eval-demos/${name}`)
			.sort();
		const listed = [
			...cases.filter((item) => !isImageCase(item)).map((item) => item.file),
			...evalLedger.excluded_files.map((x) => x.file),
		];
		expect(new Set(listed).size).toBe(listed.length);
		expect(listed.sort()).toEqual(onDisk);
	});

	it('keeps screenshot works out of the executable demo directory', () => {
		for (const item of cases.filter(isImageCase)) {
			expect(item.file, item.id).toMatch(/^\/images\/eval-cases\/works\/[^/]+\.(webp|png|jpe?g)$/);
			expect(existsSync(resolve(staticRoot, `.${item.file}`)), item.id).toBe(true);
		}
	});

	it('ships a thumbnail for every case and a file for every reference video', () => {
		for (const item of cases) {
			expect(existsSync(resolve(staticRoot, `.${evalThumb(item.id)}`)), item.id).toBe(true);
		}
		for (const task of tasks.filter((t) => t.reference_video)) {
			expect(existsSync(resolve(staticRoot, `.${task.reference_video}`)), task.id).toBe(true);
		}
	});

	it('does not shadow a benchmark detail route', () => {
		expect(benchmarkLedger.benchmarks.map((b) => b.id)).not.toContain('cases');
		expect(evalTaskRoute('voxel-snowman')).toBe('/benchmarks/cases/voxel-snowman/');
	});
});

describe('eval task cards', () => {
	it('lists every task once, flat, newest run first', () => {
		const cards = evalTaskCards();
		expect(cards.map((card) => card.task.id).sort()).toEqual(tasks.map((task) => task.id).sort());
		expect(cards.reduce((sum, card) => sum + card.cases.length, 0)).toBe(cases.length);
		const newest = cards.map((card) => card.cases[0].date);
		expect(newest).toEqual([...newest].sort().reverse());
		expect(cards.some((card) => card.cases.length === 1)).toBe(true);
	});

	it('keeps models from different release years on the same card', () => {
		// glm-4.7 is a 2025 model; glm-5 and kimi-k2.5 are 2026 models.
		const fixture: EvalLedger = {
			...evalLedger,
			tasks: [{ ...tasks[0], id: 't' }],
			cases: [
				{ ...cases[0], id: 'a', task: 't', model: 'glm-4.7', date: '2026-03-01' },
				{ ...cases[0], id: 'b', task: 't', model: 'glm-5', date: '2026-02-15' },
				{ ...cases[0], id: 'c', task: 't', model: 'kimi-k2.5', date: '2026-01-28' },
			],
		};
		const [card] = evalTaskCards(fixture);
		expect(card.cases.map((item) => item.id)).toEqual(['a', 'b', 'c']);
		expect(card.years).toEqual([2026, 2025]);
	});
});

describe('eval presentation helpers', () => {
	it('ships a logo for every vendor in the ledger', () => {
		const vendors = [...new Set(models.map((model) => model.vendor))];
		for (const vendor of vendors) {
			const { logo } = vendorMark(vendor);
			expect(logo, vendor).not.toBeNull();
			expect(existsSync(resolve(staticRoot, `.${logo}`)), vendor).toBe(true);
		}
		expect(vendorMark('Someone New')).toEqual({ logo: null, initial: 'S' });
	});

	it('drops the year from dates in the current year only', () => {
		const now = new Date('2026-09-23T00:00:00Z');
		expect(shortDate('2026-08-14', now)).toBe('08-14');
		expect(shortDate('2025-12-14', now)).toBe('2025-12-14');
	});
});
