import { describe, expect, it } from 'vitest';
import { commandSearchMatches } from '../scripts/commandSearch';
import {
	AI_NEWS_FEED_URL,
	beijingToday,
	clockTime,
	coverRatio,
	dayTitle,
	parseFeed,
	railLabel,
	newsSearchItems,
	updatedLabel,
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
