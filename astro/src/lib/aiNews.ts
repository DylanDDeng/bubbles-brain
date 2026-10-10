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
	/** Several outlets reported it (the hot bot's 「热门」), with who they were. */
	hot?: { sources: NewsSource[] };
}

export interface NewsSource {
	name: string;
	url: string;
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

function parseSources(raw: unknown): NewsSource[] {
	if (!Array.isArray(raw)) return [];
	return raw.flatMap((entry) => {
		const source = entry as Record<string, unknown> | null;
		return source && typeof source.name === 'string' && source.name.trim() && isHttps(source.url)
			? [{ name: source.name.trim(), url: source.url }]
			: [];
	});
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
				...(item.hot === true ? { hot: { sources: parseSources(item.sources) } } : {}),
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

export interface TimeGroup {
	/** 23:08, Beijing time. */
	time: string;
	items: NewsItem[];
}

/** A day's stories by push time (to the minute), keeping their order (newest first): one bot batch each. */
export function timeGroups(items: NewsItem[]): TimeGroup[] {
	const groups: TimeGroup[] = [];
	for (const item of items) {
		const time = clockTime(item.at);
		const last = groups.at(-1);
		if (last?.time === time) last.items.push(item);
		else groups.push({ time, items: [item] });
	}
	return groups;
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

/** A story's push in a narrow column: 20:29 today, 昨天, else 10/7. */
export function shortWhen(item: NewsItem, now: Date): string {
	const today = beijingToday(now);
	if (item.day === today) return clockTime(item.at);
	if (item.day === shiftDay(today, -1)) return '昨天';
	const [, month, date] = item.day.split('-').map(Number);
	return `${month}/${date}`;
}

export interface HomeNewsRow {
	item: NewsItem;
	/** 20:29 today, 昨天 or 10/7 before; empty when the row above has the same (one bot batch). */
	time: string;
	/** The reader had seen up to here: the rows above came after their last visit to /ai-news/. */
	seenBefore: boolean;
}

export interface HomeNews {
	/** Up to `hot` of 热门, most reported first (see hotNews). */
	hot: NewsItem[];
	/** The newest stories, without those already in `hot`. */
	rows: HomeNewsRow[];
	/** 20:29 更新, or 昨天 20:29 更新 when nothing came today: the newest push. */
	updated: string;
	/** How many stories were pushed today, Beijing time. */
	today: number;
}

/**
 * The newest few stories for the home page's search box, with the 「上次看到这里」 line placed as
 * on /ai-news/. `lastSeen` is when the reader last left /ai-news/, if ever.
 */
export function homeNews(
	feed: NewsFeed,
	lastSeen: string | null,
	now: Date,
	limit = 5,
	hotLimit = 0,
): HomeNews {
	const hot = hotNews(feed, now, hotLimit);
	const taken = new Set(hot.map((item) => item.id));
	const items = feed.days
		.flatMap((day) => day.items)
		.filter((item) => !taken.has(item.id))
		.slice(0, limit - hot.length);
	const today = beijingToday(now);
	const seen = lastSeen ? Date.parse(lastSeen) : Number.NaN;
	const fresh = (item: NewsItem) => Number.isNaN(seen) || Date.parse(item.at) > seen;
	const when = (item: NewsItem) => shortWhen(item, now);
	const rows = items.map((item, index) => {
		const above = items[index - 1];
		return {
			item,
			time: above && when(above) === when(item) ? '' : when(item),
			seenBefore: Boolean(above) && !Number.isNaN(seen) && fresh(above) && !fresh(item),
		};
	});
	// The newest push overall, which may be a hot story listed above the rest.
	const newest = feed.days[0]?.items[0];
	const updated = !newest
		? ''
		: newest.day === today
			? `${clockTime(newest.at)} 更新`
			: `${railLabel(newest.day, now)} ${clockTime(newest.at)} 更新`;
	return {
		hot,
		rows,
		updated,
		today: feed.days.find((day) => day.day === today)?.items.length ?? 0,
	};
}

/** Stories pushed after `since`, newest first (the feed's own order). */
export function newerThan(feed: NewsFeed, since: string): NewsItem[] {
	const from = Date.parse(since);
	if (Number.isNaN(from)) return [];
	return feed.days.flatMap((day) => day.items).filter((item) => Date.parse(item.at) > from);
}

/** +3, or +99 at most: the count of unread stories beside 「AI 动态」. */
export function unreadBadge(count: number): string {
	return `+${Math.min(count, 99)}`;
}

/** The page title with the unread count in front, (3) 教程 · Bubble's Brain; none at zero. */
export function titleWithCount(title: string, count: number): string {
	const plain = title.replace(/^\(\d+\+?\) /, '');
	return count > 0 ? `(${Math.min(count, 99)}) ${plain}` : plain;
}

/** When this browser first came to the site: the start for counting updates before any visit to /ai-news/. */
export const NEWS_SINCE_KEY = 'ai-news:since';
/** The newest story the arrival notice has already announced, so one batch is announced once. */
export const NEWS_TOLD_KEY = 'ai-news:told';

/** How far back 热门 looks. */
export const HOT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * 热门: stories the hot bot ticked in the last 24 hours, most outlets first, then newest. The bot
 * decides what is hot; the page only orders and trims. Empty when the bot has marked nothing lately.
 */
export function hotNews(feed: NewsFeed, now: Date, limit: number): NewsItem[] {
	const from = now.getTime() - HOT_WINDOW_MS;
	return feed.days
		.flatMap((day) => day.items)
		.filter((item) => item.hot && Date.parse(item.at) >= from)
		.map((item, index) => ({ item, index, outlets: item.hot!.sources.length }))
		.sort((a, b) => b.outlets - a.outlets || a.index - b.index)
		.slice(0, limit)
		.map(({ item }) => item);
}

/** TechCrunch、Bloomberg 等 8 个来源 — or just the names when there are one or two; short: 8 个来源. */
export function sourcesLabel(sources: NewsSource[], short = false): string {
	const count = sources.length;
	if (!count) return '';
	if (short) return `${count} 个来源`;
	const names = sources.slice(0, 2).map((source) => source.name);
	return count <= 2 ? names.join('、') : `${names.join('、')} 等 ${count} 个来源`;
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

/** How long a fetched feed counts as current: the Worker caches it for as long. */
export const NEWS_FRESH_FOR = 60_000;

const feedRequests = new Map<string, { at: number; request: Promise<NewsFeed | null> }>();

/**
 * The feed; null when it cannot be read (search then skips news). One request serves every caller
 * on the page; with `maxAge` a copy older than that is fetched again, past the browser's cache, so
 * a tab left open (or kept across in-site navigation) catches up with what the bot has pushed.
 */
export function loadNewsFeed(url: string, maxAge = Infinity): Promise<NewsFeed | null> {
	const cached = feedRequests.get(url);
	if (cached && Date.now() - cached.at < maxAge) return cached.request;
	const request = fetch(url, {
		headers: { accept: 'application/json' },
		...(cached ? { cache: 'no-cache' as const } : {}),
	})
		.then((response) => (response.ok ? response.json() : null))
		.then((raw: unknown) => (raw ? parseFeed(raw) : null))
		.catch(() => null);
	feedRequests.set(url, { at: Date.now(), request });
	// A failed read may succeed on the next try; until then callers keep what they last showed.
	void request.then((feed) => {
		if (!feed && feedRequests.get(url)?.request === request) feedRequests.delete(url);
	});
	return request;
}
