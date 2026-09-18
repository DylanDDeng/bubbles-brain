import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Ajv from 'ajv';
import { benchmarkIcons } from './benchmarkIcons';
import { describe, expect, it } from 'vitest';

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
			['Claude Fable 5.1', 56.3, 138.55],
			['Claude Opus 5', 52.0, 196.71],
			['Claude Fable 5', 47.0, 301.28],
			['GPT-5.6', 32.2, 179.64],
			['GLM-5.3', 30.2, 97.22],
			['Kimi K3', 25.9, 109.71],
			['Grok 4.6', 25.3, 243.43],
			['Gemini 3.7 Flash', 20.3, 34.14],
			['Gemini 3.8 Flash', 19.6, 38.75],
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
		expect(benchmarkDirectoryRoute(benchmark, 'zh-CN')).toBe('/#bc-benchmarks-coding');
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
			['general', ['aa-index', 'vals-index']],
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

	it('keeps the DeepSWE v1.1 snapshot separate from older benchmark checks', () => {
		const benchmark = benchmarkLedger.benchmarks.find((entry) => entry.id === 'deepswe');
		expect(benchmark).toMatchObject({
			checked_at: '2026-09-15',
			url: 'https://deepswe.datacurve.ai/',
			format: 'percent',
		});
		expect(benchmarkLedger.checked_at).toBe('2026-09-07');
		const rows = rankedScores('deepswe');
		expect(rows).toHaveLength(21);
		expect(rows[0]).toMatchObject({
			model: { id: 'gpt-6-astra-xhigh' },
			score: { value: 74.1, ci: 2.9, agent: 'mini-swe-agent' },
		});
		expect(rows.at(-1)).toMatchObject({
			model: { id: 'gemini-3-5-flash-high' },
			score: { value: 36.1 },
		});
		for (const { score } of rows) {
			expect(score.agent).toBe('mini-swe-agent');
			expect(score.value).toBeLessThanOrEqual(100);
			expect(score.ci).toBeGreaterThan(0);
		}
	});

	it('preserves the complete ProgramBench snapshot and its official tie-breaking order', () => {
		const expected = [
			['claude-opus-5-xhigh', 4.5, 37.0, 74.7],
			['gpt-5-6-sol-xhigh', 1.0, 15.5, 69.9],
			['gpt-5-5-xhigh', 0.5, 13.5, 69.5],
			['gpt-5-5-high', 0.5, 5.0, 66.5],
			['gemini-3-6-flash', 0.5, 4.0, 55.7],
			['gpt-5-6-sol', 0.5, 2.5, 57.8],
			['claude-opus-4-8-xhigh', 0.0, 16.5, 70.9],
			['glm-5-2', 0.0, 8.5, 64.6],
			['gemini-3-7-flash', 0.0, 5.5, 61.2],
			['claude-opus-4-7-xhigh', 0.0, 4.5, 55.1],
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
			checked_at: '2026-09-16',
			url: 'https://programbench.com/',
		});
		expect(benchmark.description.zh).toContain('9 个');
		expect(benchmark.related_reading?.href.zh).toContain('/highlights/');
	});

	it('preserves Finance Agent v2 metrics, model settings and provenance', () => {
		const expected = [
			['gemini-3-8-flash-high', 'google/gemini-3.8-flash', 61.435, 49.694],
			['muse-spark-1-2-xhigh', 'meta/muse_spark_1_2', 60.599, 50.881],
			['muse-spark-1-3-max-max', 'meta/muse_spark_1_3_max', 59.958, 49.514],
			['gemini-3-7-flash-high', 'google/gemini-3.7-flash', 59.042, 47.45],
			['muse-spark-1-3-xhigh', 'meta/muse_spark_1_3', 58.901, 48.737],
			['claude-fable-5-1-max', 'anthropic/claude-fable-5-1', 58.877, 47.773],
			['claude-opus-5-max', 'anthropic/claude-opus-5', 58.633, 47.708],
			['gemini-3-5-flash-high', 'google/gemini-3.5-flash', 57.861, 45.706],
			['glm-5-3-flash-max', 'zai/glm-5.3-flash', 57.85, 46.259],
			['muse-spark-1-1-xhigh', 'meta/muse_spark_1_1', 57.207, 44.919],
			['claude-fable-5-max', 'anthropic/claude-fable-5', 56.314, 45.694],
			['gemini-3-6-flash-high', 'google/gemini-3.6-flash', 56.296, 44.634],
			['glm-5-3-max', 'zai/glm-5.3', 55.84, 44.874],
			['gpt-5-6-luna-max', 'openai/gpt-5.6-luna', 55.044, 43.285],
			['gpt-5-6-terra-max', 'openai/gpt-5.6-terra', 54.436, 42.756],
			['kimi-k3', 'kimi/kimi-k3', 54.36, 41.69],
			['claude-opus-4-8-max', 'anthropic/claude-opus-4-8', 53.918, 43.517],
			['claude-sonnet-5-max', 'anthropic/claude-sonnet-5', 53.909, 42.084],
			['gpt-5-6-sol-max', 'openai/gpt-5.6-sol', 53.756, 41.362],
			['grok-4-6-high', 'grok/grok-4.6', 53.682, 42.901],
			['gpt-6-astra-max', 'openai/gpt-6-astra', 53.54, 40.252],
			['deepseek-v4-1-flash-high', 'deepseek/deepseek-v4.1-flash', 53.481, 41.052],
			['gpt-5-5-xhigh', 'openai/gpt-5.5', 51.76, 39.562],
			['claude-opus-4-7-high', 'anthropic/claude-opus-4-7', 51.509, 38.647],
			['claude-sonnet-4-6-max', 'anthropic/claude-sonnet-4-6', 51.035, 38.795],
			['qwen-3-8-max', 'alibaba/qwen3.8-max', 50.593, 38.229],
			['deepseek-v4-pro-0813-max', 'deepseek/deepseek-v4-pro-0813', 50.393, 38.507],
			['glm-5-2', 'zai/glm-5.2', 49.699, 38.006],
			['deepseek-v4-flash-0731-high', 'deepseek/deepseek-v4-flash-0731', 49.517, 36.75],
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
			['mercury-2-5-high', 'inception/mercury-2.5', 18.556, 9.112],
			['nemotron-3-5-lightning', 'fireworks/nemotron-lightning-3p5-30b-a3b', 18.5, 10.289],
			['laguna-xs-2', 'poolside/laguna-xs.2', 15.601, 6.794],
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
			checked_at: '2026-09-16',
			url: 'https://www.vals.ai/benchmarks/fabv2',
			score_label: { zh: '部分得分', en: 'Partial Credit' },
		});
		expect(benchmark.explainer.zh).toContain('隐藏测试集 450');
		expect(benchmark.description.zh).toContain('标准误');
	});

	it('keeps the complete Vals Index v2 snapshot in the general category', () => {
		const expected = [
			['anthropic/claude-fable-5-1', 68.825],
			['anthropic/claude-opus-5', 67.213],
			['openai/gpt-6-astra', 66.608],
			['anthropic/claude-fable-5', 66.036],
			['meta/muse_spark_1_3_max', 64.526],
			['openai/gpt-5.6-sol', 63.709],
			['google/gemini-3.8-flash', 62.252],
			['anthropic/claude-opus-4-8', 60.908],
			['meta/muse_spark_1_3', 60.31],
			['openai/gpt-5.6-luna', 59.881],
			['anthropic/claude-sonnet-5', 59.61],
			['openai/gpt-5.6-terra', 59.588],
			['google/gemini-3.7-flash', 59.307],
			['grok/grok-4.6', 59.167],
			['deepseek/deepseek-v4.1-flash', 57.86],
			['kimi/kimi-k3', 57.813],
			['openai/gpt-5.5', 57.411],
			['meta/muse_spark_1_2', 57.053],
			['zai/glm-5.3', 56.97],
			['anthropic/claude-opus-4-7', 56.114],
			['google/gemini-3.6-flash', 55.354],
			['meta/muse_spark_1_1', 54.754],
			['deepseek/deepseek-v4-flash-0731', 53.568],
			['zai/glm-5.2', 53.122],
			['google/gemini-3.5-flash', 53.079],
			['deepseek/deepseek-v4-pro-0813', 52.368],
			['alibaba/qwen3.8-max', 51.844],
			['grok/grok-4.5', 51.528],
			['anthropic/claude-sonnet-4-6', 50.593],
			['alibaba/qwen3.8-27b', 48.485],
			['zai/glm-5.3-flash', 47.216],
			['alibaba/qwen3.7-max', 44.769],
			['kimi/kimi-k2.6', 43.465],
			['deepseek/deepseek-v4-pro', 42.888],
			['minimax/MiniMax-M3', 42.719],
			['google/gemini-3.1-pro-preview', 41.903],
			['xiaomi/mimo-v2.5-pro', 40.974],
			['xiaomi/mimo-v2.5', 39.91],
			['openai/gpt-5.4-mini-2026-03-17', 39.632],
			['alibaba/qwen3.7-plus', 38.645],
			['google/gemini-3.5-flash-lite', 36.711],
			['thinkingmachines/inkling', 34.102],
			['openai/gpt-5.4-nano-2026-03-17', 32.997],
			['alibaba/qwen3.6-plus', 31.979],
			['thinkingmachines/inkling-small', 31.862],
			['google/gemini-3-flash-preview', 29.444],
			['nvidia/nemotron-3-ultra-550b-a55b', 27.395],
			['kimi/kimi-k2.5-thinking', 26.301],
			['minimax/MiniMax-M2.7', 24.556],
			['grok/grok-4.3', 24.294],
			['anthropic/claude-haiku-4-5-20251001-thinking', 22.898],
			['ant/ling-3.0-flash-2607', 21.699],
			['mistralai/mistral-medium-3.5', 17.947],
			['grok/grok-4.20-0309-reasoning', 17.552],
			['google/gemini-3.1-flash-lite-preview', 15.457],
			['inception/mercury-2.5', 12.952],
			['fireworks/nemotron-lightning-3p5-30b-a3b', 11.494],
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
			checked_at: '2026-09-16',
			url: 'https://www.vals.ai/benchmarks/vals_index',
			score_label: { zh: '综合指数', en: 'Index' },
		});
		expect(benchmark.related_reading?.href.zh).toBe('/benchmarks/finance-agent/');
	});

	it('returns each detail to its containing category in both locales', async () => {
		for (const benchmark of benchmarkLedger.benchmarks) {
			expect(benchmarkDirectoryRoute(benchmark, 'zh-CN')).toBe(
				`/#bc-benchmarks-${benchmark.category}`,
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
		expect(notes.map((note) => note.key)).toEqual(['claude-fable-5-1-max', 'claude-fable-5']);
	});
});
