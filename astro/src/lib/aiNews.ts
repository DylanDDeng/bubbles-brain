/**
 * AI 动态: the feed the bubble-ai-news Worker serves (workers/ai-news), and how the page names its
 * days and times. Everything is shown in Beijing time, the readers' clock.
 */
import type { KnowledgeSearchItem } from './searchIndex';

/** `npm run dev` may point at a local Worker (PUBLIC_AI_NEWS_FEED); a build always uses the real one. */
export const AI_NEWS_FEED_URL =
	(import.meta.env.DEV ? (import.meta.env.PUBLIC_AI_NEWS_FEED as string | undefined) : undefined) ??
	'https://news-api.bubblenews.today/v1/feed';

export interface NewsItem {
	id: string;
	title: string;
	summary: string;
	url: string;
	at: string;
	day: string;
	cover?: string;
	/** Width ÷ height of the cover, when the Worker knows its size. */
	coverRatio?: number;
}

/** Covers keep their own shape within these bounds: no taller than 4:5, no flatter than 2:1. */
export const COVER_RATIO = { min: 4 / 5, max: 2, fallback: 1.91 } as const;

/** The shape to reserve for a cover of this size, clamped so one image cannot swamp a column. */
export function coverRatio(width: unknown, height: unknown): number | undefined {
	const w = Number(width);
	const h = Number(height);
	if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return undefined;
	return Math.min(COVER_RATIO.max, Math.max(COVER_RATIO.min, w / h));
}

export interface NewsDay {
	day: string;
	items: NewsItem[];
}

export interface NewsFeed {
	updatedAt: string;
	days: NewsDay[];
	/** Months (YYYY-MM) whose older days live in the archive, not in `days`. */
	archiveMonths: string[];
}

const isMonth = (value: unknown): value is string =>
	typeof value === 'string' && /^\d{4}-\d{2}$/.test(value);

const TIME_ZONE = 'Asia/Shanghai';
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const isHttps = (value: unknown): value is string => {
	if (typeof value !== 'string') return false;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:';
	} catch {
		return false;
	}
};

const isDay = (value: unknown): value is string =>
	typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** The feed with anything malformed dropped: a bad item never breaks the page. */
export function parseFeed(raw: unknown): NewsFeed | null {
	if (!raw || typeof raw !== 'object') return null;
	const feed = raw as Record<string, unknown>;
	if (typeof feed.updatedAt !== 'string' || !Array.isArray(feed.days)) return null;
	const archiveMonths = Array.isArray(feed.archiveMonths) ? feed.archiveMonths.filter(isMonth) : [];
	return { updatedAt: feed.updatedAt, days: parseDays(feed.days), archiveMonths };
}

/** One archived month (GET /v1/archive/<YYYY-MM>) as days, or null if it is not one. */
export function parseArchive(raw: unknown, month: string): NewsDay[] | null {
	if (!raw || typeof raw !== 'object') return null;
	const file = raw as Record<string, unknown>;
	if (file.month !== month || !Array.isArray(file.days)) return null;
	return parseDays(file.days).filter((day) => monthOf(day.day) === month);
}

function parseDays(entries: unknown[]): NewsDay[] {
	const days: NewsDay[] = [];
	for (const entry of entries) {
		const day = entry as Record<string, unknown> | null;
		if (!day || !isDay(day.day) || !Array.isArray(day.items)) continue;
		const items: NewsItem[] = [];
		for (const value of day.items) {
			const item = value as Record<string, unknown> | null;
			if (!item || typeof item.title !== 'string' || !item.title.trim() || !isHttps(item.url))
				continue;
			if (typeof item.at !== 'string' || Number.isNaN(Date.parse(item.at))) continue;
			items.push({
				id: typeof item.id === 'string' ? item.id : item.url,
				title: item.title,
				summary: typeof item.summary === 'string' ? item.summary : '',
				url: item.url,
				at: item.at,
				day: day.day,
				...(isHttps(item.cover)
					? {
							cover: item.cover.replace(/^http:/, 'https:'),
							...(coverRatio(item.coverWidth, item.coverHeight)
								? { coverRatio: coverRatio(item.coverWidth, item.coverHeight) }
								: {}),
						}
					: {}),
			});
		}
		if (items.length) days.push({ day: day.day, items });
	}
	return days;
}

export function monthOf(day: string): string {
	return day.slice(0, 7);
}

/** Where the Worker serves an archived month, next to the feed. */
export function archiveUrl(feedUrl: string, month: string): string {
	return feedUrl.replace(/\/v1\/feed(?:\?.*)?$/, `/v1/archive/${month}`);
}

/** 10月, or 2025年12月 for a month of another year. */
export function monthLabel(month: string, now: Date): string {
	const [year, number] = month.split('-').map(Number);
	const thisYear = Number(beijingToday(now).slice(0, 4));
	return year === thisYear ? `${number}月` : `${year}年${number}月`;
}

export interface RailMonth {
	month: string;
	/** Known days, newest first: the feed's, plus the archive's once it is loaded. */
	days: NewsDay[];
	/** Older days of this month are in the archive. */
	archived: boolean;
	/** The archive for this month has been read. */
	loaded: boolean;
}

/**
 * The rail's months, newest first. A day the feed has comes from the feed (it is fresher); the
 * archive adds the days that have aged out of it.
 */
export function railMonths(feed: NewsFeed, archives: ReadonlyMap<string, NewsDay[]>): RailMonth[] {
	const months = new Set([...feed.days.map((day) => monthOf(day.day)), ...feed.archiveMonths]);
	return [...months]
		.sort()
		.reverse()
		.map((month) => {
			const days = new Map(
				feed.days.filter((day) => monthOf(day.day) === month).map((day) => [day.day, day]),
			);
			for (const day of archives.get(month) ?? []) if (!days.has(day.day)) days.set(day.day, day);
			return {
				month,
				days: [...days.values()].sort((a, b) => (a.day < b.day ? 1 : -1)),
				archived: feed.archiveMonths.includes(month),
				loaded: archives.has(month),
			};
		});
}

/** Today's date in Beijing, YYYY-MM-DD. */
export function beijingToday(now: Date): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(now);
}

function shiftDay(day: string, offset: number): string {
	const date = new Date(`${day}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + offset);
	return date.toISOString().slice(0, 10);
}

/** 10月8日 */
export function monthDay(day: string): string {
	const [, month, date] = day.split('-').map(Number);
	return `${month}月${date}日`;
}

/** 10月8日 周四 */
export function dayTitle(day: string): string {
	const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
	return `${monthDay(day)} ${WEEKDAYS[weekday]}`;
}

/** The rail's word for a day: 今天, 昨天, else 10月6日. */
export function railLabel(day: string, now: Date): string {
	const today = beijingToday(now);
	if (day === today) return '今天';
	if (day === shiftDay(today, -1)) return '昨天';
	return monthDay(day);
}

/** 22:51 in Beijing. */
export function clockTime(iso: string): string {
	return new Intl.DateTimeFormat('zh-CN', {
		timeZone: TIME_ZONE,
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).format(new Date(iso));
}

/** The hour of the day in Beijing, 0–23. */
export function beijingHour(iso: string): number {
	return Number(clockTime(iso).slice(0, 2));
}

export interface HourGroup {
	hour: number;
	items: NewsItem[];
}

/** A day's stories by Beijing hour, keeping their order (newest first). */
export function hourGroups(items: NewsItem[]): HourGroup[] {
	const groups: HourGroup[] = [];
	for (const item of items) {
		const hour = beijingHour(item.at);
		const last = groups.at(-1);
		if (last?.hour === hour) last.items.push(item);
		else groups.push({ hour, items: [item] });
	}
	return groups;
}

/** 刚刚, 25 分钟前, 3 小时前; empty for anything a day old or more. */
export function relativeTime(iso: string, now: Date): string {
	const minutes = Math.floor((now.getTime() - Date.parse(iso)) / 60000);
	if (minutes < 10) return '刚刚';
	if (minutes < 60) return `${minutes} 分钟前`;
	if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} 小时前`;
	return '';
}

/** When the reader last came: 今天 18:30, 昨天 18:30, else 10月7日 18:30. */
export function seenLabel(iso: string, now: Date): string {
	const day = beijingToday(new Date(iso));
	const today = beijingToday(now);
	const when = day === today ? '今天' : day === shiftDay(today, -1) ? '昨天' : monthDay(day);
	return `${when} ${clockTime(iso)}`;
}

/** Where the page remembers, in this browser only, when the reader last looked. */
export const LAST_SEEN_KEY = 'ai-news:last-seen';

/** 更新于 22:51 today, 更新于 10月7日 22:51 on another day. */
export function updatedLabel(iso: string, now: Date): string {
	const day = beijingToday(new Date(iso));
	const time = clockTime(iso);
	return day === beijingToday(now) ? `更新于 ${time}` : `更新于 ${monthDay(day)} ${time}`;
}

export const NEWS_SECTION_LABEL = 'AI 动态';

/**
 * The feed as site-search entries (⌘K and /search/), newest first. A result opens the source
 * article, as a card on /ai-news/ does.
 */
export function newsSearchItems(feed: NewsFeed): KnowledgeSearchItem[] {
	return feed.days.flatMap((day) =>
		day.items.map((item) => ({
			key: `ai-news:${item.id}`,
			href: item.url,
			title: item.title,
			summary: item.summary,
			section: 'ai-news' as const,
			section_label: NEWS_SECTION_LABEL,
			date: item.at,
			tags: [],
			external: true,
			search_text: `${item.title} ${item.summary} ${NEWS_SECTION_LABEL}`
				.normalize('NFKC')
				.toLocaleLowerCase(),
		})),
	);
}

const feedRequests = new Map<string, Promise<NewsFeed | null>>();

/** The feed, fetched once per page view; null when it cannot be read (search then skips news). */
export function loadNewsFeed(url: string): Promise<NewsFeed | null> {
	let request = feedRequests.get(url);
	if (!request) {
		request = fetch(url, { headers: { accept: 'application/json' } })
			.then((response) => (response.ok ? response.json() : null))
			.then((raw: unknown) => (raw ? parseFeed(raw) : null))
			.catch(() => null);
		feedRequests.set(url, request);
		// A failed read may succeed on the next search.
		void request.then((feed) => {
			if (!feed) feedRequests.delete(url);
		});
	}
	return request;
}
