import { describe, expect, it } from 'vitest';
import {
	AI_NEWS_FEED_URL,
	beijingToday,
	clockTime,
	dayTitle,
	parseFeed,
	railLabel,
	searchFeed,
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

describe('searchFeed', () => {
	const feed = parseFeed({
		updatedAt: '2026-10-08T02:51:00.000Z',
		days: [
			{ day: '2026-10-08', items: [item('a', { title: 'Claude Haiku 5.5 发布' })] },
			{ day: '2026-10-07', items: [item('b', { summary: 'Haiku 更便宜' }), item('c')] },
		],
	})!;

	it('matches every word across all days, newest first', () => {
		expect(searchFeed(feed, 'haiku').map((entry) => entry.id)).toEqual(['a', 'b']);
		expect(searchFeed(feed, 'haiku 便宜').map((entry) => entry.id)).toEqual(['b']);
		expect(searchFeed(feed, '   ')).toEqual([]);
	});
});
