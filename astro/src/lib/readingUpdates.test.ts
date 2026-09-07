import { describe, expect, it } from 'vitest';
import {
	buildReadingUpdates,
	initialReadingHistory,
	parseReadingHistory,
	unreadReadingUpdates,
} from './readingUpdates';
import type { BrainPodItem } from './brainpod';
import type { ChangelogItem } from '../data/changelog';

const item = (key: string): BrainPodItem => ({
	key,
	href: key,
	title: key,
	summary: '',
	section: 'highlights',
	section_label: '精选阅读',
	date: '2020-01-01',
	external: false,
});
const a = item('/a/'),
	b = item('/b/');
const change = (
	date: string,
	type: ChangelogItem['type'],
	hrefs: string[],
	readingUpdates?: string[],
): ChangelogItem => ({
	date,
	type,
	title: '',
	tag: '',
	summary: '',
	links: hrefs.map((href) => ({ href, label: href })),
	readingUpdates,
});
const now = new Date('2026-09-07T12:00:00Z');

describe('reading updates', () => {
	it('uses recorded content dates, excludes cosmetic edits, and deduplicates only published content', () => {
		const updates = buildReadingUpdates(
			[a, b],
			[
				change('2026-09-01', 'content', ['/a/']),
				change('2026-09-06', 'polish', ['/a/']),
				change('2026-09-04', 'content', ['/b/', '/a/', '/missing/', '/a/']),
				change('2026-09-05', 'feature', ['/b/'], ['/b/']),
			],
		);
		expect(updates.map((u) => [u.item.key, u.recordedAt])).toEqual([
			['/b/', '2026-09-05'],
			['/a/', '2026-09-04'],
		]);
		expect(updates[0].item.date).toBe('2020-01-01');
		expect(buildReadingUpdates([a], [])).toEqual([]);
	});
	it('shows the first seven days, keeps unread items across visits, and hides read or future updates', () => {
		const history = initialReadingHistory(now);
		const updates = [
			{ item: a, recordedAt: '2026-09-06' },
			{ item: b, recordedAt: '2026-08-20' },
			{ item: item('/future/'), recordedAt: '2026-09-08' },
		];
		expect(unreadReadingUpdates(updates, history, now).map((u) => u.item.key)).toEqual(['/a/']);
		expect(unreadReadingUpdates([updates[0]], history, new Date('2026-10-01')).length).toBe(1);
		history.read[a.key] = '2026-09-07';
		expect(unreadReadingUpdates(updates, history, now)).toEqual([]);
		expect(
			unreadReadingUpdates([{ item: a, recordedAt: '2026-09-09' }], history, new Date('2026-09-10'))
				.length,
		).toBe(1);
	});
	it('recovers from missing or corrupt storage without marking everything read', () => {
		for (const value of [null, '{invalid', '[]', '{"since":"2099-01-01"}']) {
			expect(parseReadingHistory(value, now)).toEqual(initialReadingHistory(now));
		}
		expect(
			parseReadingHistory(
				JSON.stringify({ since: '2026-09-01', read: { '/a/': '2026-09-06', '/b/': 123 } }),
				now,
			),
		).toEqual({ since: '2026-09-01', read: { '/a/': '2026-09-06' } });
	});
});
