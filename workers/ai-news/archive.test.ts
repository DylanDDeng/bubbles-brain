import { describe, expect, it } from 'vitest';
import { archiveKey, mergeMonth, updateArchive, type ArchiveBucket, type ArchiveMonth } from './archive';
import type { Feed, FeedDay, FeedItem } from './feed';
import worker from './index';
import type { Env } from './sync';

const story = (id: string, day: string, at = `${day}T02:00:00.000Z`): FeedItem => ({
	id,
	title: `标题 ${id}`,
	summary: '',
	url: `https://news.test/${id}`,
	at,
	day,
});
const day = (date: string, ...items: FeedItem[]): FeedDay => ({ day: date, items });
const feedOf = (...days: FeedDay[]): Feed => ({ updatedAt: '2026-10-20T00:00:00.000Z', days });

class MemoryArchive implements ArchiveBucket {
	files = new Map<string, string>();
	puts: string[] = [];
	async get(key: string) {
		const text = this.files.get(key);
		return text === undefined ? null : { text: async () => text };
	}
	async put(key: string, value: string) {
		this.puts.push(key);
		this.files.set(key, value);
	}
	async list({ prefix }: { prefix: string }) {
		return { objects: [...this.files.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({ key })), truncated: false };
	}
	month(month: string): ArchiveMonth {
		return JSON.parse(this.files.get(archiveKey(month))!);
	}
}

describe('mergeMonth', () => {
	it('keeps days older than the window and takes newer days from the feed', () => {
		const archived = [day('2026-09-22', story('old-edit', '2026-09-22')), day('2026-09-15', story('history', '2026-09-15'))];
		const feed = feedOf(day('2026-09-22', story('new-edit', '2026-09-22')));
		const merged = mergeMonth('2026-09', archived, feed, '2026-09-20');
		expect(merged.map((d) => [d.day, d.items.map((s) => s.id)])).toEqual([
			['2026-09-22', ['new-edit']],
			['2026-09-15', ['history']],
		]);
	});

	it('keeps the window’s first day whole: archived stories plus the feed’s, the feed winning', () => {
		const archived = [day('2026-09-20', story('early', '2026-09-20', '2026-09-19T17:00:00.000Z'), { ...story('same', '2026-09-20'), title: 'old title' })];
		const feed = feedOf(day('2026-09-20', { ...story('same', '2026-09-20'), title: 'new title' }));
		const [first] = mergeMonth('2026-09', archived, feed, '2026-09-20');
		expect(first.items.map((s) => [s.id, s.title])).toEqual([
			['same', 'new title'],
			['early', '标题 early'],
		]);
	});

	it('drops a recent day the Base no longer has', () => {
		const archived = [day('2026-10-05', story('deleted', '2026-10-05'))];
		expect(mergeMonth('2026-10', archived, feedOf(), '2026-09-20')).toEqual([]);
	});
});

describe('updateArchive', () => {
	it('writes each month the feed touches and lists only months with days before the window', async () => {
		const bucket = new MemoryArchive();
		bucket.files.set(
			archiveKey('2026-08'),
			JSON.stringify({ month: '2026-08', updatedAt: 'x', days: [day('2026-08-30', story('aug', '2026-08-30'))] }),
		);
		bucket.files.set(
			archiveKey('2026-09'),
			JSON.stringify({ month: '2026-09', updatedAt: 'x', days: [day('2026-09-18', story('sep18', '2026-09-18'))] }),
		);
		const feed = feedOf(day('2026-10-19', story('oct', '2026-10-19')), day('2026-09-25', story('sep25', '2026-09-25')));
		const months = await updateArchive(bucket, feed, '2026-09-20', new Date('2026-10-20T00:00:00Z'));

		expect(months).toEqual(['2026-09', '2026-08']);
		expect(bucket.month('2026-09').days.map((d) => d.day)).toEqual(['2026-09-25', '2026-09-18']);
		expect(bucket.month('2026-10').days.map((d) => d.day)).toEqual(['2026-10-19']);
	});

	it('rewrites nothing when the month already matches', async () => {
		const bucket = new MemoryArchive();
		const feed = feedOf(day('2026-10-19', story('oct', '2026-10-19')));
		await updateArchive(bucket, feed, '2026-09-20', new Date('2026-10-20T00:00:00Z'));
		bucket.puts = [];
		const months = await updateArchive(bucket, feed, '2026-09-20', new Date('2026-10-20T01:00:00Z'));
		expect(bucket.puts).toEqual([]);
		expect(months).toEqual([]);
	});
});

describe('GET /v1/archive/<month>', () => {
	const env = (archive: MemoryArchive) => ({ NEWS: { get: async () => null, put: async () => undefined }, ARCHIVE: archive }) as unknown as Env;

	it('serves a stored month and refuses anything else', async () => {
		const archive = new MemoryArchive();
		archive.files.set(archiveKey('2026-09'), JSON.stringify({ month: '2026-09', updatedAt: 'x', days: [] }));
		const ctx = { waitUntil() {} };
		const ok = await worker.fetch(new Request('https://news-api.test/v1/archive/2026-09'), env(archive), ctx);
		expect(ok.status).toBe(200);
		expect(ok.headers.get('access-control-allow-origin')).toBe('*');
		expect(await ok.json()).toMatchObject({ month: '2026-09' });
		for (const path of ['/v1/archive/2026-08', '/v1/archive/2026-9', '/v1/archive/2026-09.json', '/v1/archive/%2e%2e%2Ffeed']) {
			expect((await worker.fetch(new Request(`https://news-api.test${path}`), env(archive), ctx)).status).toBe(404);
		}
	});
});
