import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

import {
	benchmarkLedger,
	benchmarkRoute,
	benchmarkParagraphs,
	collectNotes,
	formatScore,
	rankedScores,
} from './benchmarks';

describe('benchmark ledger', () => {
	it('matches the published schema', async () => {
		const schema = JSON.parse(
			await readFile(resolve(process.cwd(), '../schemas/benchmarks.schema.json'), 'utf8'),
		);
		const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
		expect(validate(benchmarkLedger), JSON.stringify(validate.errors, null, 2)).toBe(true);
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

	it('returns Chinese details to the homepage tab and keeps the English directory fallback', async () => {
		const component = await readFile(
			new URL('../components/BenchmarkDetail.astro', import.meta.url),
			'utf8',
		);
		expect(component).toContain("href={isEnglish ? '/en/benchmarks/' : '/#bc-benchmarks'}");
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
