import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { benchmarkLedger } from './benchmarks';
import {
	casesForTask,
	evalLedger,
	evalTaskRoute,
	evalThumb,
	evalYearGroups,
	evalYears,
	isImageCase,
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

	it('derives the evaluation year from the run date', () => {
		for (const item of cases) {
			expect(item.date, item.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(item.year, item.id).toBe(Number(item.date.slice(0, 4)));
		}
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

describe('eval year groups', () => {
	it('lists years newest first and keeps single-model tasks', () => {
		const groups = evalYearGroups();
		expect(groups.map((group) => group.year)).toEqual(evalYears());
		expect(groups.reduce((sum, group) => sum + group.caseCount, 0)).toBe(cases.length);
		const singles = groups
			.flatMap((group) => group.cards)
			.filter((card) => card.cases.length === 1);
		expect(singles.length).toBeGreaterThan(0);
	});

	it('splits a task tested in two years into one card per year', () => {
		const fixture: EvalLedger = {
			...evalLedger,
			tasks: [{ ...tasks[0], id: 't' }],
			cases: [
				{ ...cases[0], id: 'a', task: 't', date: '2025-12-01', year: 2025 },
				{ ...cases[0], id: 'b', task: 't', date: '2026-02-01', year: 2026 },
				{ ...cases[0], id: 'c', task: 't', date: '2026-01-01', year: 2026 },
			],
		};
		const groups = evalYearGroups(fixture);
		expect(
			groups.map((group) => [group.year, group.cards[0].cases.map((item) => item.id)]),
		).toEqual([
			[2026, ['b', 'c']],
			[2025, ['a']],
		]);
		expect(groups[0].cards[0].otherYears).toEqual([{ year: 2025, count: 1 }]);
		expect(groups[1].cards[0].otherYears).toEqual([{ year: 2026, count: 2 }]);
	});
});
