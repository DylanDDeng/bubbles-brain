import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { benchmarkIcons } from './benchmarkIcons';

import {
	benchmarkLedger,
	benchmarkRoute,
	benchmarkDirectoryRoute,
	benchmarkParagraphs,
	collectNotes,
	formatScore,
	groupedBenchmarks,
	rankedScores,
} from './benchmarks';

describe('benchmark ledger', () => {
	it('preserves FrontierSWE v2 results, resource metrics, and trial-range semantics', () => {
		const rows = rankedScores('frontierswe');
		expect(
			rows.map(({ model, score }) => [
				model.name,
				Number(score.value.toFixed(1)),
				Number(score.average_cost_usd!.toFixed(2)),
			]),
		).toEqual([
			['GPT-6 Astra', 65.5, 1029.65],
			['Claude Opus 5.5', 62.3, 98.87],
			['Claude Sonnet 5.5', 61.9, 110.45],
			['Claude Fable 5.1', 56.3, 138.55],
			['Gemini 4 Argon', 55.0, 129.36],
			['Claude Opus 5', 52.0, 196.71],
			['Claude Fable 5', 47.0, 301.28],
			['GPT-5.6 Sol', 32.2, 179.64],
			['GLM-5.3', 30.2, 97.22],
			['Grok 4.7', 29.5, 318.77],
			['Kimi K3', 25.9, 109.71],
			['Grok 4.6', 25.3, 243.43],
			['Gemini 3.7 Flash', 20.3, 34.14],
			['Gemini 3.8 Flash', 19.6, 38.75],
			['GLM-5.3 Flash', 18.1, 11.03],
			['Qwen3.8-Max-0902', 17.8, 51.27],
			['Qwen3.8-Max', 15.8, 55.14],
			['DeepSeek V4 Flash Vision Exp', 14.8, 8.57],
			['Muse Spark 1.2', 12.0, 27.81],
			['Inkling', 4.1, 9.15],
		]);
		for (const { model, score } of rows) {
			expect(benchmarkIcons[model.creator]).toBeTruthy();
			expect(score.agent).toBe('Proximus');
			expect(score.ci).toBeUndefined();
			expect(score.worst_at_5).toBeGreaterThanOrEqual(0);
			expect(score.worst_at_5!).toBeLessThanOrEqual(score.value);
			expect(score.best_at_5!).toBeGreaterThanOrEqual(score.value);
			expect(score.best_at_5!).toBeLessThanOrEqual(100);
			expect(score.average_duration_seconds).toBeGreaterThan(0);
		}
		const benchmark = benchmarkLedger.benchmarks.find(({ id }) => id === 'frontierswe')!;
		expect(benchmark.category).toBe('coding');
		expect(benchmark.url).toBe('https://www.frontierswe.com/');
		expect(benchmark.score_label?.en).toBe('Mean@5');
		expect(benchmark.description.en).toContain('not a 95% confidence interval');
		expect(benchmarkDirectoryRoute(benchmark, 'zh-CN')).toBe('/benchmarks/#coding');
		expect(benchmarkDirectoryRoute(benchmark, 'en')).toBe('/en/benchmarks/#bc-benchmarks-coding');
		const fallback = rows.find(({ model }) => model.name === 'Claude Fable 5.1')!.score;
		expect(fallback.note?.en).toContain('Opus 5');
		expect(fallback.note_url).toBe('https://www.frontierswe.com/blog/v2');
	});

	it('matches the published schema', async () => {
		const schema = JSON.parse(
			await readFile(resolve(process.cwd(), '../schemas/benchmarks.schema.json'), 'utf8'),
		);
		const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
		expect(validate(benchmarkLedger), JSON.stringify(validate.errors, null, 2)).toBe(true);
		for (const category of [undefined, 'unknown', 'agent']) {
			const invalid = structuredClone(benchmarkLedger);
			Object.assign(invalid.benchmarks[0]!, { category });
			expect(validate(invalid)).toBe(false);
		}
	});

	it('groups every benchmark once by primary domain and omits empty groups', () => {
		const groups = groupedBenchmarks();
		expect(
			groups.map((group) => [group.id, group.benchmarks.map((benchmark) => benchmark.id)]),
		).toEqual([
			['general', ['aa-index', 'gdpval-aa', 'vals-index']],
			['coding', ['tbench-4', 'deepswe', 'programbench', 'frontierswe']],
			['finance', ['finance-agent']],
		]);
		const ids = groups.flatMap((group) => group.benchmarks.map((benchmark) => benchmark.id));
		expect(ids.length).toBe(new Set(ids).size);
		expect(ids.slice().sort()).toEqual(
			benchmarkLedger.benchmarks.map((benchmark) => benchmark.id).sort(),
		);
		expect(groupedBenchmarks([])).toEqual([]);
		expect(
			groupedBenchmarks(
				benchmarkLedger.benchmarks.filter((benchmark) => benchmark.category === 'coding'),
			).map((group) => group.id),
		).toEqual(['coding']);
	});

	it('keeps model and benchmark ids unique and every score attached to a known benchmark', () => {
		const benchmarkIds = benchmarkLedger.benchmarks.map((entry) => entry.id);
		const modelIds = benchmarkLedger.models.map((entry) => entry.id);
		expect(new Set(benchmarkIds).size).toBe(benchmarkIds.length);
		expect(new Set(modelIds).size).toBe(modelIds.length);
		for (const model of benchmarkLedger.models) {
			for (const key of Object.keys(model.scores)) expect(benchmarkIds).toContain(key);
		}
	});

	it('ranks a benchmark highest first, keeps ties in ledger order and drops unscored models', () => {
		const ranked = rankedScores('a', {
			schema_version: 1,
			checked_at: '2026-01-01',
			benchmarks: [
				{
					id: 'a',
					category: 'general',
					name: { zh: 'A', en: 'A' },
					source: 's',
					url: 'https://example.com',
					format: 'integer',
					measures: { zh: 'm', en: 'm' },
					explainer: { zh: 'e', en: 'e' },
					description: { zh: 'd', en: 'd' },
				},
			],
			models: [
				{ id: 'low', name: 'low', creator: 'x', scores: { a: { value: 1 } } },
				{ id: 'tie-first', name: 't1', creator: 'x', scores: { a: { value: 5 } } },
				{ id: 'tie-second', name: 't2', creator: 'x', scores: { a: { value: 5 } } },
				{ id: 'missing', name: 'm', creator: 'x', scores: { b: { value: 9 } } },
			],
		});
		expect(ranked.map(({ model }) => model.id)).toEqual(['tie-first', 'tie-second', 'low']);
	});

	it('builds locale-specific benchmark routes', () => {
		expect(benchmarkRoute('tbench-4', 'zh-CN')).toBe('/benchmarks/tbench-4/');
		expect(benchmarkRoute('tbench-4', 'en')).toBe('/en/benchmarks/tbench-4/');
	});

	it('preserves the full GDPval-AA v2.1 Elo scale, its anchor and explicit evaluation configurations', () => {
		const rows = rankedScores('gdpval-aa');
		expect(rows).toHaveLength(282);
		expect(rows[0]).toMatchObject({
			model: { name: 'Claude Opus 5.5 (Max, Default Fallback)' },
			score: { value: 1867, ci: 26, agent: 'Stirrup' },
		});
		expect(rows.at(-1)).toMatchObject({
			model: { name: 'K2 Horizon 0.9B' },
			score: { value: -406, ci: 22 },
		});
		expect(rows.filter(({ score }) => score.value < 0)).toHaveLength(28);
		const anchors = rows.filter(({ score }) => score.ci === undefined);
		expect(anchors.map(({ model, score }) => [model.name, score.value])).toEqual([
			['DeepSeek V4.1 Flash (Max)', 1600],
		]);
		expect(anchors[0]!.score.note?.en).toContain('anchor');
		for (const { model, score } of rows) {
			expect(score.source_model).toBe(model.name);
			expect(benchmarkIcons[model.creator]).toBeTruthy();
			if (score.ci !== undefined) expect(score.ci).toBeGreaterThan(0);
			expect(formatScore(score, 'integer')).not.toContain('%');
		}
		const benchmark = benchmarkLedger.benchmarks.find((entry) => entry.id === 'gdpval-aa')!;
		expect(benchmark).toMatchObject({
			category: 'general',
			checked_at: '2026-10-04',
			url: 'https://artificialanalysis.ai/evaluations/gdpval-aa',
			format: 'integer',
			score_label: { zh: 'Elo 评分', en: 'Elo rating' },
		});
	});

	it('allows signed integer Elo without allowing negative values on other benchmarks', async () => {
		const schema = JSON.parse(
			await readFile(resolve(process.cwd(), '../schemas/benchmarks.schema.json'), 'utf8'),
		);
		const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
		const sample = structuredClone(benchmarkLedger);
		sample.models = [{ id: 'sample', name: 'Sample', creator: 'OpenAI', scores: {} }];
		for (const value of [-174, 0, 1764]) {
			sample.models[0]!.scores = { 'gdpval-aa': { value } };
			expect(validate(sample)).toBe(true);
		}
		sample.models[0]!.scores = { 'gdpval-aa': { value: 1.5 } };
		expect(validate(sample)).toBe(false);
		for (const benchmark of benchmarkLedger.benchmarks.filter(({ id }) => id !== 'gdpval-aa')) {
			sample.models[0]!.scores = { [benchmark.id]: { value: -1 } };
			expect(validate(sample)).toBe(false);
		}
	});

	it('keeps the DeepSWE v1.1 snapshot separate from older benchmark checks', () => {
		const benchmark = benchmarkLedger.benchmarks.find((entry) => entry.id === 'deepswe');
		expect(benchmark).toMatchObject({
			checked_at: '2026-10-04',
			url: 'https://deepswe.datacurve.ai/',
			format: 'percent',
		});
		expect(benchmarkLedger.checked_at).toBe('2026-10-04');
		const rows = rankedScores('deepswe');
		const isSelfReported = (score: { note?: { en: string } }) =>
			score.note?.en.startsWith('Self-reported') ?? false;
		const official = rows.filter(({ score }) => !isSelfReported(score));
		expect(official).toHaveLength(21);
		expect(official[0]).toMatchObject({
			model: { id: 'gpt-6-astra-xhigh' },
			score: { value: 74.1, ci: 2.9, agent: 'mini-swe-agent' },
		});
		expect(official.at(-1)).toMatchObject({
			model: { id: 'gemini-3-5-flash-high' },
			score: { value: 36.1 },
		});
		for (const { score } of official) {
			expect(score.agent).toBe('mini-swe-agent');
			expect(score.value).toBeLessThanOrEqual(100);
			expect(score.ci).toBeGreaterThan(0);
		}
		// Vendor numbers the official board has not listed yet carry a footnote and no CI.
		const selfReported = rows.filter(({ score }) => isSelfReported(score));
		expect(selfReported.map(({ model, score }) => [model.id, score.value])).toEqual([
			['claude-opus-5-5-max', 74.2],
		]);
		for (const { score } of selfReported) {
			expect(score.ci).toBeUndefined();
			expect(score.note_url).toContain('anthropic.com');
		}
	});

	it('preserves the complete ProgramBench snapshot and its official tie-breaking order', () => {
		const expected = [
			['claude-opus-5-xhigh', 4.5, 37.0, 74.7],
			['muse-spark-1-3-max', 2.5, 25.0, 70.8],
			['muse-spark-1-3-xhigh', 1.0, 16.5, 68.6],
			['gpt-5-6-sol-xhigh', 1.0, 15.5, 69.9],
			['gpt-5-5-xhigh', 0.5, 13.5, 69.5],
			['gpt-5-5-high', 0.5, 5.0, 66.5],
			['gemini-3-6-flash', 0.5, 4.0, 55.7],
			['gpt-5-6-sol', 0.5, 2.5, 57.8],
			['claude-opus-4-8-xhigh', 0.0, 16.5, 70.9],
			['glm-5-2', 0.0, 8.5, 64.6],
			['gemini-3-7-flash', 0.0, 5.5, 61.2],
			['muse-spark-1-2-xhigh', 0.0, 4.5, 57.2],
			['claude-opus-4-7-xhigh', 0.0, 4.5, 55.1],
			['muse-spark-1-1-xhigh', 0.0, 4.0, 47.0],
			['gemini-3-5-flash', 0.0, 3.0, 53.6],
			['claude-opus-4-7', 0.0, 3.0, 50.9],
			['claude-opus-4-6', 0.0, 2.5, 52.1],
			['gpt-5-5', 0.0, 1.5, 56.6],
			['claude-sonnet-4-6', 0.0, 1.0, 47.5],
			['gpt-5-4', 0.0, 0.0, 37.7],
			['gemini-3-1-pro', 0.0, 0.0, 36.4],
			['gemini-3-flash', 0.0, 0.0, 31.8],
			['claude-haiku-4-5', 0.0, 0.0, 30.0],
			['gpt-5-4-mini', 0.0, 0.0, 16.4],
			['gpt-5-mini', 0.0, 0.0, 16.0],
		];
		const rows = rankedScores('programbench', {
			...benchmarkLedger,
			models: [...benchmarkLedger.models].reverse(),
		});
		expect(
			rows.map(({ model, score }) => [
				model.id,
				score.value,
				score.almost_resolved,
				score.average_pass_rate,
			]),
		).toEqual(expected);
		for (const { score } of rows) {
			expect(score.agent).toBe('mini-SWE-agent');
			expect(score.ci).toBeUndefined();
			expect(score.almost_resolved).toBeGreaterThanOrEqual(score.value);
		}
		const benchmark = benchmarkLedger.benchmarks.find((entry) => entry.id === 'programbench')!;
		expect(benchmark).toMatchObject({
			category: 'coding',
			checked_at: '2026-10-04',
			url: 'https://programbench.com/',
		});
		expect(benchmark.description.zh).toContain('9 个');
		expect(benchmark.related_reading?.href.zh).toContain('/highlights/');
	});

	it('preserves Finance Agent v2 metrics, model settings and provenance', () => {
		const expected = [
			['gemini-4-argon-high', 'google/gemini-4-argon', 65.401, 55.789],
			['gemini-3-8-flash-high', 'google/gemini-3.8-flash', 61.435, 49.694],
			['muse-spark-1-2-xhigh', 'meta/muse_spark_1_2', 60.599, 50.881],
			['muse-spark-1-3-max-max', 'meta/muse_spark_1_3_max', 59.958, 49.514],
			['gemini-3-7-flash-high', 'google/gemini-3.7-flash', 59.042, 47.45],
			['muse-spark-1-3-xhigh', 'meta/muse_spark_1_3', 58.901, 48.737],
			['claude-fable-5-1-max', 'anthropic/claude-fable-5-1', 58.877, 47.773],
			['claude-opus-5-max', 'anthropic/claude-opus-5', 58.633, 47.708],
			['claude-opus-5-5-max', 'anthropic/claude-opus-5-5', 58.587, 48.111],
			['claude-sonnet-5-5-max', 'anthropic/claude-sonnet-5-5', 58.103, 47.59],
			['gemini-3-5-flash-high', 'google/gemini-3.5-flash', 57.861, 45.706],
			['glm-5-3-flash-max', 'zai/glm-5.3-flash', 57.85, 46.259],
			['mimo-v2-6-pro-vals-index', 'xiaomi/mimo-v2.6-pro', 57.339, 45.837],
			['muse-spark-1-1-xhigh', 'meta/muse_spark_1_1', 57.207, 44.919],
			['claude-fable-5-max', 'anthropic/claude-fable-5', 56.314, 45.694],
			['gemini-3-6-flash-high', 'google/gemini-3.6-flash', 56.296, 44.634],
			['mimo-v2-6-flash-vals-index', 'xiaomi/mimo-v2.6-flash', 56.277, 44.427],
			['glm-5-3-max', 'zai/glm-5.3', 55.84, 44.874],
			['hy4-preview', 'tencent/hy4-preview', 55.063, 44.017],
			['gpt-5-6-luna-max', 'openai/gpt-5.6-luna', 55.044, 43.285],
			['ling-3-0-flash-fin-finance-agent', 'ant/ling-3.0-flash-af-rc3', 54.927, 43.361],
			['gpt-5-6-terra-max', 'openai/gpt-5.6-terra', 54.436, 42.756],
			['claude-opus-4-8-max', 'anthropic/claude-opus-4-8', 53.918, 43.517],
			['claude-sonnet-5-max', 'anthropic/claude-sonnet-5', 53.909, 42.084],
			['gpt-5-6-sol-max', 'openai/gpt-5.6-sol', 53.756, 41.362],
			['grok-4-6-high', 'grok/grok-4.6', 53.682, 42.901],
			['gpt-6-astra-max', 'openai/gpt-6-astra', 53.54, 40.252],
			['deepseek-v4-1-flash-high', 'deepseek/deepseek-v4.1-flash', 53.481, 41.052],
			['kimi-k3', 'kimi/kimi-k3', 53.114, 41.837],
			['grok-4-7-xhigh-tbench-4', 'grok/grok-4.7', 52.251, 42.137],
			['gpt-6-1-sol-max', 'openai/gpt-6.1-sol', 52.033, 39.906],
			['ember-1', 'fireworks/ember-1', 51.853, 39.26],
			['gpt-5-5-xhigh', 'openai/gpt-5.5', 51.76, 39.562],
			['claude-opus-4-7-high', 'anthropic/claude-opus-4-7', 51.509, 38.647],
			['claude-sonnet-4-6-max', 'anthropic/claude-sonnet-4-6', 51.035, 38.795],
			['step-5-preview', 'stepfun/step-5-preview', 50.671, 38.809],
			['qwen-3-8-max', 'alibaba/qwen3.8-max', 50.593, 38.229],
			['deepseek-v4-pro-0813-max', 'deepseek/deepseek-v4-pro-0813', 50.393, 38.507],
			['gpt-6-luna-max-vals-index', 'openai/gpt-6-luna', 49.873, 38.433],
			['glm-5-2', 'zai/glm-5.2', 49.699, 38.006],
			['deepseek-v4-flash-0731-high', 'deepseek/deepseek-v4-flash-0731', 49.517, 36.75],
			['gpt-6-sol-max-vals-index', 'openai/gpt-6-sol', 49.05, 35.981],
			['qwen-3-8-27b-xhigh', 'alibaba/qwen3.8-27b', 48.553, 36.837],
			['grok-4-5-high', 'grok/grok-4.5', 48.349, 36.743],
			['minimax-m3', 'minimax/MiniMax-M3', 48.269, 36.693],
			['qwen-3-7-max', 'alibaba/qwen3.7-max', 47.776, 34.633],
			['gemini-3-5-flash-lite-high', 'google/gemini-3.5-flash-lite', 47.442, 35.265],
			['inkling-0-99', 'thinkingmachines/inkling', 46.597, 33.428],
			['gpt-5-4-mini-xhigh', 'openai/gpt-5.4-mini-2026-03-17', 45.36, 32.369],
			['kimi-k2-6', 'kimi/kimi-k2.6', 44.899, 32.584],
			['glm-5-1', 'zai/glm-5.1', 44.792, 32.68],
			['deepseek-v4-pro-max', 'deepseek/deepseek-v4-pro', 44.083, 31.448],
			['gemini-3-1-pro-preview-02-26-high', 'google/gemini-3.1-pro-preview', 42.982, 30.879],
			['gemini-3-flash-12-25-high', 'google/gemini-3-flash-preview', 42.551, 30.204],
			['mimo-v2-5-pro', 'xiaomi/mimo-v2.5-pro', 41.502, 28.848],
			['inkling-small-0-99', 'thinkingmachines/inkling-small', 41.257, 29.151],
			['qwen-3-6-plus', 'alibaba/qwen3.6-plus', 40.846, 29.35],
			['qwen-3-7-plus', 'alibaba/qwen3.7-plus', 38.22, 25.816],
			['gpt-5-4-nano-high', 'openai/gpt-5.4-nano-2026-03-17', 38.217, 26.022],
			['grok-4-3-high', 'grok/grok-4.3', 37.728, 26.373],
			['nemotron-3-ultra', 'nvidia/nemotron-3-ultra-550b-a55b', 37.667, 24.802],
			['mimo-v2-5', 'xiaomi/mimo-v2.5', 36.728, 23.785],
			['kimi-k2-5', 'kimi/kimi-k2.5-thinking', 35.792, 23.799],
			['mistral-medium-3-5-high', 'mistralai/mistral-medium-3.5', 32.103, 21.632],
			['claude-haiku-4-5-thinking', 'anthropic/claude-haiku-4-5-20251001-thinking', 31.01, 19.83],
			['ling-3-0-flash', 'ant/ling-3.0-flash-2607', 30.314, 19.571],
			[
				'gemini-3-1-flash-lite-preview-high',
				'google/gemini-3.1-flash-lite-preview',
				29.988,
				19.303,
			],
			['grok-4-20-reasoning', 'grok/grok-4.20-0309-reasoning', 28.492, 17.492],
			['minimax-m2-7', 'minimax/MiniMax-M2.7', 27.887, 17.135],
			['laguna-m-1', 'poolside/laguna-m.1', 25.026, 14.419],
			['mercury-2-5-high', 'inception/mercury-2.5', 18.894, 9.369],
			['nemotron-3-5-lightning', 'fireworks/nemotron-lightning-3p5-30b-a3b', 18.5, 10.289],
			['laguna-xs-2', 'poolside/laguna-xs.2', 15.601, 6.794],
			['command-a', 'cohere/command-a-plus-05-2026', 9.044, 2.761],
		];
		const rows = rankedScores('finance-agent');
		expect(
			rows.map(({ model, score }) => [model.id, score.source_model, score.value, score.all_pass]),
		).toEqual(expected);
		for (const { score } of rows) {
			expect(score.all_pass).toBeLessThanOrEqual(score.value);
			expect(score.all_pass).toBeGreaterThanOrEqual(0);
			expect(score.value).toBeLessThanOrEqual(100);
			expect(score.ci).toBeUndefined();
			expect(score.almost_resolved).toBeUndefined();
		}
		const benchmark = benchmarkLedger.benchmarks.find((entry) => entry.id === 'finance-agent')!;
		expect(benchmark).toMatchObject({
			category: 'finance',
			checked_at: '2026-10-04',
			url: 'https://www.vals.ai/benchmarks/fabv2',
			score_label: { zh: '部分得分', en: 'Partial Credit' },
		});
		expect(benchmark.explainer.zh).toContain('隐藏测试集 450');
		expect(benchmark.description.zh).toContain('标准误');
	});

	it('keeps the complete Vals Index v2.1 snapshot in the general category', () => {
		const expected = [
			['google/gemini-4-argon', 68.896],
			['anthropic/claude-sonnet-5-5', 67.037],
			['anthropic/claude-opus-5-5', 66.972],
			['anthropic/claude-fable-5-1', 65.827],
			['anthropic/claude-opus-5', 63.674],
			['openai/gpt-6-astra', 63.125],
			['anthropic/claude-fable-5', 61.388],
			['openai/gpt-6.1-sol', 61.154],
			['meta/muse_spark_1_3_max', 58.162],
			['openai/gpt-5.6-sol', 58.005],
			['openai/gpt-6-sol', 57.536],
			['xiaomi/mimo-v2.6-pro', 55.199],
			['anthropic/claude-opus-4-8', 55.1],
			['grok/grok-4.7', 54.947],
			['google/gemini-3.8-flash', 54.825],
			['zai/glm-5.3', 53.514],
			['xiaomi/mimo-v2.6-flash', 53.231],
			['meta/muse_spark_1_3', 53.197],
			['openai/gpt-5.6-terra', 53.085],
			['grok/grok-4.6', 52.092],
			['anthropic/claude-sonnet-5', 51.775],
			['openai/gpt-5.6-luna', 51.687],
			['deepseek/deepseek-v4.1-flash', 51.32],
			['google/gemini-3.7-flash', 51.273],
			['openai/gpt-6-luna', 51.216],
			['fireworks/ember-1', 50.811],
			['kimi/kimi-k3', 50.297],
			['tencent/hy4-preview', 49.942],
			['stepfun/step-5-preview', 49.354],
			['meta/muse_spark_1_2', 49.287],
			['alibaba/qwen3.8-max', 48.27],
			['deepseek/deepseek-v4-flash-0731', 47.963],
			['deepseek/deepseek-v4-pro-0813', 47.628],
			['google/gemini-3.5-flash', 44.786],
			['grok/grok-4.5', 44.723],
			['deepseek/deepseek-v4-pro', 38.63],
			['minimax/MiniMax-M3', 36.535],
			['xiaomi/mimo-v2.5-pro', 33.842],
			['google/gemini-3.1-pro-preview', 33.442],
			['openai/gpt-5.4-mini-2026-03-17', 33.169],
			['thinkingmachines/inkling', 28.668],
			['thinkingmachines/inkling-small', 25.459],
			['inception/mercury-2.5', 8.855],
		];
		const rows = rankedScores('vals-index');
		expect(rows.map(({ score }) => [score.source_model, score.value])).toEqual(expected);
		for (const { score } of rows) {
			expect(score.value).toBeLessThanOrEqual(100);
			expect(score.ci).toBeUndefined();
			expect(score.all_pass).toBeUndefined();
			expect(score.almost_resolved).toBeUndefined();
		}
		const benchmark = benchmarkLedger.benchmarks.find((entry) => entry.id === 'vals-index')!;
		expect(benchmark).toMatchObject({
			category: 'general',
			checked_at: '2026-10-04',
			url: 'https://www.vals.ai/benchmarks/vals_index',
			score_label: { zh: '综合指数', en: 'Index' },
		});
		expect(benchmark.related_reading?.href.zh).toBe('/benchmarks/finance-agent/');
	});

	it('returns each detail to its containing category in both locales', async () => {
		for (const benchmark of benchmarkLedger.benchmarks) {
			expect(benchmarkDirectoryRoute(benchmark, 'zh-CN')).toBe(
				`/benchmarks/#${benchmark.category}`,
			);
			expect(benchmarkDirectoryRoute(benchmark, 'en')).toBe(
				`/en/benchmarks/#bc-benchmarks-${benchmark.category}`,
			);
		}
		const component = await readFile(
			new URL('../components/BenchmarkDetail.astro', import.meta.url),
			'utf8',
		);
		expect(component).toContain('href={benchmarkDirectoryRoute(benchmark, locale)}');
	});

	it('breaks explanations into short paragraphs without changing their text', () => {
		for (const benchmark of benchmarkLedger.benchmarks) {
			for (const locale of ['zh-CN', 'en'] as const) {
				const text = benchmark.explainer[locale === 'en' ? 'en' : 'zh'];
				const paragraphs = benchmarkParagraphs(text, locale);
				expect(paragraphs.length).toBeGreaterThan(1);
				expect(paragraphs.join('')).toBe(text);
			}
		}
		expect(benchmarkParagraphs('Version 4.0 works. A second sentence. A third.', 'en')).toEqual([
			'Version 4.0 works. A second sentence. ',
			'A third.',
		]);
		expect(benchmarkParagraphs('', 'zh-CN')).toEqual([]);
	});

	it('formats percent and integer columns', () => {
		expect(formatScore({ value: 57.9 }, 'percent')).toBe('57.9%');
		expect(formatScore({ value: 53 }, 'integer')).toBe('53');
	});

	it('numbers footnotes in table order', () => {
		const notes = collectNotes(rankedScores('tbench-4'));
		expect(notes.map((note) => note.key)).toEqual([
			'claude-opus-5-5-xhigh',
			'claude-fable-5-1-max',
			'claude-fable-5',
		]);
	});
});
