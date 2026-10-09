import { describe, expect, it } from 'vitest';
import { commandSearchMatches } from '../scripts/commandSearch';
import {
	AI_NEWS_FEED_URL,
	timeGroups,
	seenLabel,
	archiveUrl,
	monthLabel,
	parseArchive,
	railMonths,
	beijingToday,
	clockTime,
	coverRatio,
	dayTitle,
	parseFeed,
	railLabel,
	newsSearchItems,
	updatedLabel,
	homeNews,
} from './aiNews';

const item = (id: string, extra: Record<string, unknown> = {}) => ({
	id,
	title: `标题 ${id}`,
	summary: `摘要 ${id}`,
	url: `https://news.test/${id}`,
	at: '2026-10-08T02:51:00.000Z',
	...extra,
});

describe('AI 动态 feed', () => {
	it('reads from the bubble-ai-news Worker by default', () => {
		expect(AI_NEWS_FEED_URL).toBe('https://news-api.bubblenews.today/v1/feed');
	});

	it('keeps well-formed items and drops the rest', () => {
		const feed = parseFeed({
			updatedAt: '2026-10-08T02:51:00.000Z',
			days: [
				{
					day: '2026-10-08',
					items: [
						item('a', { cover: 'http://img.test/a.png' }),
						item('b', { url: 'javascript:alert(1)' }),
						item('c', { title: '  ' }),
						item('d', { at: 'not a date' }),
						item('e', { cover: 'data:image/png;base64,AAAA' }),
					],
				},
				{ day: 'yesterday', items: [item('f')] },
				{ day: '2026-10-07', items: [item('g', { url: 'https://news.test/only-bad', title: 1 })] },
			],
		});
		expect(feed?.days.map((day) => day.day)).toEqual(['2026-10-08']);
		expect(feed?.days[0].items.map((entry) => entry.id)).toEqual(['a', 'e']);
		expect(feed?.days[0].items[0].cover).toBe('https://img.test/a.png');
		expect(feed?.days[0].items[1]).not.toHaveProperty('cover');
	});

	it('rejects something that is not a feed', () => {
		expect(parseFeed(null)).toBeNull();
		expect(parseFeed({ days: [] })).toBeNull();
		expect(parseFeed('{}')).toBeNull();
	});
});

describe('AI 动态 days and times (Beijing)', () => {
	const now = new Date('2026-10-08T03:00:00Z'); // 11:00 on 10月8日 in Beijing

	it('names days the way a reader in China counts them', () => {
		expect(beijingToday(new Date('2026-10-07T17:00:00Z'))).toBe('2026-10-08');
		expect(railLabel('2026-10-08', now)).toBe('今天');
		expect(railLabel('2026-10-07', now)).toBe('昨天');
		expect(railLabel('2026-10-06', now)).toBe('10月6日');
		expect(dayTitle('2026-10-08')).toBe('10月8日 周四');
		expect(dayTitle('2026-10-04')).toBe('10月4日 周日');
	});

	it('shows clock times and the last update in Beijing time', () => {
		expect(clockTime('2026-10-08T02:51:00.000Z')).toBe('10:51');
		expect(clockTime('2026-10-07T16:05:00.000Z')).toBe('00:05');
		expect(updatedLabel('2026-10-08T02:51:00.000Z', now)).toBe('更新于 10:51');
		expect(updatedLabel('2026-10-07T14:51:00.000Z', now)).toBe('更新于 10月7日 22:51');
	});
});

describe('news in the site search', () => {
	const feed = parseFeed({
		updatedAt: '2026-10-08T02:51:00.000Z',
		days: [
			{ day: '2026-10-08', items: [item('a', { title: 'Claude Haiku 5.5 发布' })] },
			{ day: '2026-10-07', items: [item('b', { summary: 'Haiku 更便宜' }), item('c')] },
		],
	})!;

	it('turns every story into a search entry that opens the source', () => {
		const entries = newsSearchItems(feed);
		expect(entries.map((entry) => entry.key)).toEqual(['ai-news:a', 'ai-news:b', 'ai-news:c']);
		expect(entries[0]).toMatchObject({
			href: 'https://news.test/a',
			title: 'Claude Haiku 5.5 发布',
			section: 'ai-news',
			section_label: 'AI 动态',
			date: '2026-10-08T02:51:00.000Z',
			external: true,
		});
		expect(entries[1].search_text).toContain('haiku 更便宜');
	});

	it('is found by ⌘K alongside the knowledge base', () => {
		const site = {
			key: 'term:haiku',
			href: '/vibe-coding/terms/haiku/',
			title: 'Haiku 是什么',
			summary: '',
			section: 'vibe-coding-terms' as const,
			section_label: '术语',
			date: null,
			tags: [],
			external: false,
			search_text: 'haiku 是什么',
		};
		const found = commandSearchMatches([site, ...newsSearchItems(feed)], 'Haiku');
		expect(found.map((entry) => entry.key)).toEqual(['term:haiku', 'ai-news:a', 'ai-news:b']);
	});
});

describe('cover shape', () => {
	it('keeps a cover its own shape within 4:5 and 2:1', () => {
		expect(coverRatio(800, 600)).toBeCloseTo(4 / 3);
		expect(coverRatio(800, 2000)).toBe(0.8);
		expect(coverRatio(1600, 400)).toBe(2);
		expect(coverRatio(undefined, 600)).toBeUndefined();
		expect(coverRatio(0, 600)).toBeUndefined();
	});

	it('carries the ratio through the feed only when the size is real', () => {
		const feed = parseFeed({
			updatedAt: '2026-10-09T00:00:00.000Z',
			days: [
				{
					day: '2026-10-09',
					items: [
						item('sized', { cover: 'https://img.test/a.webp', coverWidth: 800, coverHeight: 1000 }),
						item('unsized', { cover: 'https://img.test/b.webp', coverWidth: 'wide' }),
						item('bare', { coverWidth: 800, coverHeight: 600 }),
					],
				},
			],
		})!;
		const [sized, unsized, bare] = feed.days[0].items;
		expect(sized.coverRatio).toBe(0.8);
		expect(unsized).not.toHaveProperty('coverRatio');
		expect(bare).not.toHaveProperty('coverRatio');
	});
});

describe('months in the rail', () => {
	const feed = parseFeed({
		updatedAt: '2026-10-20T00:00:00.000Z',
		archiveMonths: ['2026-09', 'nope', '2026-08'],
		days: [
			{ day: '2026-10-19', items: [item('oct19')] },
			{ day: '2026-09-25', items: [item('sep25-feed')] },
		],
	})!;

	it('reads the archived months from the feed and ignores junk', () => {
		expect(feed.archiveMonths).toEqual(['2026-09', '2026-08']);
		expect(parseFeed({ updatedAt: 'x', days: [] })!.archiveMonths).toEqual([]);
	});

	it('groups days by month, newest first, the feed winning over the archive', () => {
		const archives = new Map([
			[
				'2026-09',
				parseArchive(
					{
						month: '2026-09',
						days: [
							{ day: '2026-09-25', items: [item('sep25-old')] },
							{ day: '2026-09-18', items: [item('sep18')] },
						],
					},
					'2026-09',
				)!,
			],
		]);
		const months = railMonths(feed, archives);
		expect(months.map((m) => [m.month, m.days.map((d) => d.day), m.archived, m.loaded])).toEqual([
			['2026-10', ['2026-10-19'], false, false],
			['2026-09', ['2026-09-25', '2026-09-18'], true, true],
			['2026-08', [], true, false],
		]);
		expect(months[1].days[0].items[0].id).toBe('sep25-feed');
	});

	it('only accepts the month it asked for', () => {
		expect(parseArchive({ month: '2026-08', days: [] }, '2026-09')).toBeNull();
		expect(
			parseArchive(
				{ month: '2026-09', days: [{ day: '2026-08-31', items: [item('x')] }] },
				'2026-09',
			),
		).toEqual([]);
	});

	it('names months and finds their archive next to the feed', () => {
		const now = new Date('2026-10-20T00:00:00Z');
		expect(monthLabel('2026-09', now)).toBe('9月');
		expect(monthLabel('2025-12', now)).toBe('2025年12月');
		expect(archiveUrl('https://news-api.bubblenews.today/v1/feed', '2026-09')).toBe(
			'https://news-api.bubblenews.today/v1/archive/2026-09',
		);
	});
});

describe('the day as a timeline', () => {
	const now = new Date('2026-10-09T12:40:00Z'); // 20:40 in Beijing

	it('groups a day by push time (one bot batch each), newest first', () => {
		const stories = ['15:08', '15:08', '14:45', '14:45', '14:12'].map((t, i) =>
			item(String(i), { at: `2026-10-09T${t}:00.000Z` }),
		);
		const day = parseFeed({ updatedAt: 'x', days: [{ day: '2026-10-09', items: stories }] })!
			.days[0];
		expect(timeGroups(day.items).map((g) => [g.time, g.items.map((s) => s.id)])).toEqual([
			['23:08', ['0', '1']],
			['22:45', ['2', '3']],
			['22:12', ['4']],
		]);
	});

	it('names the last visit by day', () => {
		expect(seenLabel('2026-10-09T10:30:00.000Z', now)).toBe('今天 18:30');
		expect(seenLabel('2026-10-08T10:30:00.000Z', now)).toBe('昨天 18:30');
		expect(seenLabel('2026-10-06T10:30:00.000Z', now)).toBe('10月6日 18:30');
	});
});

describe('the home page’s newest stories', () => {
	// 20:29 and 19:23 Beijing on 10月9日, then 18:48 the day before.
	const feed = parseFeed({
		updatedAt: '2026-10-09T12:40:00.000Z',
		days: [
			{
				day: '2026-10-09',
				items: [
					item('a', { at: '2026-10-09T12:29:00.000Z' }),
					item('b', { at: '2026-10-09T11:23:00.000Z' }),
					item('c', { at: '2026-10-09T11:23:00.000Z' }),
				],
			},
			{ day: '2026-10-08', items: [item('d', { at: '2026-10-08T10:48:00.000Z' })] },
		],
	})!;
	const now = new Date('2026-10-09T13:00:00.000Z');

	it('lists the newest first, writing a batch’s time once and older days by name', () => {
		const home = homeNews(feed, null, now);
		expect(home.rows.map((row) => [row.item.id, row.time])).toEqual([
			['a', '20:29'],
			['b', '19:23'],
			['c', ''],
			['d', '昨天'],
		]);
		expect(home.updated).toBe('20:29 更新');
		expect(home.today).toBe(3);
		expect(home.rows.some((row) => row.seenBefore)).toBe(false);
	});

	it('stops at the limit', () => {
		expect(homeNews(feed, null, now, 2).rows.map((row) => row.item.id)).toEqual(['a', 'b']);
	});

	it('draws the 上次看到这里 line under what came since the last visit, and only between rows', () => {
		const line = (lastSeen: string) =>
			homeNews(feed, lastSeen, now)
				.rows.filter((row) => row.seenBefore)
				.map((row) => row.item.id);
		expect(line('2026-10-09T12:00:00.000Z')).toEqual(['b']);
		expect(line('2026-10-09T12:30:00.000Z')).toEqual([]);
		expect(line('2026-10-01T00:00:00.000Z')).toEqual([]);
		expect(line('not a date')).toEqual([]);
	});

	it('names the day of the newest push when nothing came today', () => {
		const home = homeNews(feed, null, new Date('2026-10-10T05:00:00.000Z'));
		expect(home.updated).toBe('昨天 20:29 更新');
		expect(home.today).toBe(0);
	});
});
