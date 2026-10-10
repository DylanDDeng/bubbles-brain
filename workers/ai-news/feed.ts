/**
 * AI 动态: turns rows of the Feishu Base that the Grok bot fills every hour into the small feed the
 * /ai-news/ page reads. Pure functions only; the Worker in index.ts does the fetching and storing.
 */

export interface FeedItem {
	id: string;
	title: string;
	summary: string;
	url: string;
	/** Push time, ISO 8601 in UTC. */
	at: string;
	/** Calendar day in Beijing time, YYYY-MM-DD. */
	day: string;
	/** Absolute https URL of the story's cover, when it has one. */
	cover?: string;
	/** The cover's pixel size, when known (attachment covers), so the page can reserve its shape. */
	coverWidth?: number;
	coverHeight?: number;
	/** Ticked 「热门」 by the hot bot: reported by several outlets in the last two days. */
	hot?: true;
	/** The outlets the hot bot found covering it (「多源报道」), for hot stories only. */
	sources?: FeedSource[];
}

export interface FeedSource {
	name: string;
	url: string;
}

export interface CoverSize {
	width: number;
	height: number;
}

/** A pixel size worth keeping: two positive whole numbers. */
export function coverSize(width: unknown, height: unknown): CoverSize | null {
	const w = Number(width);
	const h = Number(height);
	return Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0 ? { width: w, height: h } : null;
}

export interface FeedDay {
	day: string;
	items: FeedItem[];
}

export interface Feed {
	updatedAt: string;
	days: FeedDay[];
	/** Months (YYYY-MM, newest first) with archived days older than `days`: GET /v1/archive/<month>. */
	archiveMonths?: string[];
}

/** The Base's column names, as the bot writes them. */
export const FIELDS = {
	title: '标题',
	summary: '内容',
	url: '链接',
	at: '推送时间',
	/** An attachment the bot adds when the source has no usable share image. */
	cover: '封面',
	/** A checkbox the hot bot ticks for stories several outlets reported. */
	hot: '热门',
	/** The hot bot's list of those outlets, one 「名称: 链接」 per line. */
	sources: '多源报道',
} as const;

const IMAGE_NAME = /\.(jpe?g|png|webp|gif|avif)$/i;
const FILE_TOKEN = /^[A-Za-z0-9_-]{8,128}$/;

/** The file token of the first image in an attachment cell, or null. */
export function attachmentToken(value: unknown): string | null {
	if (!Array.isArray(value)) return null;
	for (const entry of value) {
		if (!entry || typeof entry !== 'object') continue;
		const file = entry as Record<string, unknown>;
		const token = file.file_token;
		if (typeof token !== 'string' || !FILE_TOKEN.test(token)) continue;
		const name = typeof file.name === 'string' ? file.name : '';
		const type = typeof file.type === 'string' ? file.type : '';
		if (type.startsWith('image/') || IMAGE_NAME.test(name) || (!name && !type)) return token;
	}
	return null;
}

export function isFileToken(value: string): boolean {
	return FILE_TOKEN.test(value);
}

export const SUMMARY_LIMIT = 160;
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Plain text from any Feishu cell shape: a string, rich-text segments, or a link object. */
export function cellText(value: unknown): string {
	if (value == null) return '';
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	if (Array.isArray(value)) return value.map(cellText).join('');
	if (typeof value === 'object') {
		const cell = value as Record<string, unknown>;
		if (typeof cell.text === 'string') return cell.text;
		if (typeof cell.link === 'string') return cell.link;
	}
	return '';
}

/** The first http(s) URL in a cell: a link object, a segment's link, a Markdown link or bare text. */
export function cellUrl(value: unknown): string | null {
	const candidates: string[] = [];
	const visit = (cell: unknown) => {
		if (cell == null) return;
		if (Array.isArray(cell)) return cell.forEach(visit);
		if (typeof cell === 'object') {
			const record = cell as Record<string, unknown>;
			if (typeof record.link === 'string') candidates.push(record.link);
			if (typeof record.text === 'string') candidates.push(record.text);
			return;
		}
		if (typeof cell === 'string') candidates.push(cell);
	};
	visit(value);
	for (const text of candidates) {
		const markdown = text.match(/\]\((https?:\/\/[^\s)]+)\)/);
		const bare = text.match(/https?:\/\/[^\s)\]]+/);
		const url = safeHttpUrl(markdown?.[1] ?? bare?.[0] ?? '');
		if (url) return url;
	}
	return null;
}

export function safeHttpUrl(raw: string, base?: string): string | null {
	try {
		const url = new URL(raw.trim(), base);
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
	} catch {
		return null;
	}
}

/** A millisecond timestamp (what Feishu returns for date fields) or a date string, as epoch ms. */
export function cellTime(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	const text = cellText(value).trim();
	if (!text) return null;
	if (/^\d{12,}$/.test(text)) return Number(text);
	const parsed = Date.parse(text);
	return Number.isNaN(parsed) ? null : parsed;
}

export function beijingDay(epochMs: number): string {
	return new Date(epochMs + BEIJING_OFFSET_MS).toISOString().slice(0, 10);
}

/** Collapse whitespace and cut to the limit at a character boundary, with an ellipsis. */
export function shortSummary(text: string, limit = SUMMARY_LIMIT): string {
	const flat = text.replace(/\s+/g, ' ').trim();
	const chars = Array.from(flat);
	return chars.length <= limit ? flat : `${chars.slice(0, limit).join('').trimEnd()}…`;
}

/** The same story is often pushed twice; links differing only in tracking bits are one story. */
export function storyKey(url: string): string {
	const parsed = new URL(url);
	parsed.hash = '';
	for (const key of [...parsed.searchParams.keys()]) {
		if (/^(utm_|ref$|from$|source$|s$|t$)/i.test(key)) parsed.searchParams.delete(key);
	}
	const host = parsed.hostname.replace(/^www\./, '').replace(/^twitter\.com$/, 'x.com');
	return `${host}${parsed.pathname.replace(/\/+$/, '')}${parsed.search}`.toLowerCase();
}

/** Text with each link segment written as its URL, so 「名称: 链接」 lines survive rich text. */
function cellLinkText(value: unknown): string {
	if (Array.isArray(value)) return value.map(cellLinkText).join('');
	if (value && typeof value === 'object') {
		const cell = value as Record<string, unknown>;
		if (typeof cell.link === 'string') return cell.link;
	}
	return cellText(value);
}

export const SOURCE_LIMIT = 12;

/** 「TechCrunch: https://…」 lines as outlets, each link once; lines without a link are skipped. */
export function parseSources(value: unknown): FeedSource[] {
	const sources: FeedSource[] = [];
	const seen = new Set<string>();
	for (const line of cellLinkText(value).split(/\r?\n/)) {
		const match = line.match(/^\s*(.+?)\s*[:：]\s*(https?:\/\/\S+)\s*$/);
		const url = match ? safeHttpUrl(match[2]) : null;
		if (!match || !url || seen.has(url)) continue;
		seen.add(url);
		sources.push({ name: Array.from(match[1]).slice(0, 40).join(''), url });
		if (sources.length === SOURCE_LIMIT) break;
	}
	return sources;
}

/** A ticked checkbox, as Feishu returns it (true), or the text a formula might give. */
function cellChecked(value: unknown): boolean {
	return value === true || cellText(value).trim().toLowerCase() === 'true';
}

export interface BaseRecord {
	record_id: string;
	fields: Record<string, unknown>;
}

/** One record as a feed item, or null when it is missing a title, a link or a time. */
export function toItem(record: BaseRecord): FeedItem | null {
	const title = cellText(record.fields[FIELDS.title]).replace(/\s+/g, ' ').trim();
	const url = cellUrl(record.fields[FIELDS.url]);
	const time = cellTime(record.fields[FIELDS.at]);
	if (!title || !url || time === null) return null;
	return {
		id: record.record_id,
		title,
		summary: shortSummary(cellText(record.fields[FIELDS.summary])),
		url,
		at: new Date(time).toISOString(),
		day: beijingDay(time),
		...(cellChecked(record.fields[FIELDS.hot])
			? { hot: true as const, sources: parseSources(record.fields[FIELDS.sources]) }
			: {}),
	};
}

/**
 * Records → feed: drop empty rows, keep the newest push of each story, newest first, grouped by
 * Beijing day. Covers already known for a story are carried over by the caller via `covers`.
 */
export function buildFeed(
	records: BaseRecord[],
	covers: ReadonlyMap<string, string | null>,
	now: Date,
	coverSizes: ReadonlyMap<string, CoverSize> = new Map(),
): Feed {
	const newest = new Map<string, FeedItem>();
	for (const record of records) {
		const item = toItem(record);
		if (!item) continue;
		const key = storyKey(item.url);
		const seen = newest.get(key);
		if (!seen || item.at > seen.at) newest.set(key, item);
	}
	const items = [...newest.values()].sort((a, b) => (a.at === b.at ? a.id.localeCompare(b.id) : a.at < b.at ? 1 : -1));
	const days: FeedDay[] = [];
	for (const item of items) {
		const cover = covers.get(storyKey(item.url));
		const size = cover ? coverSizes.get(cover) : undefined;
		const withCover = cover
			? { ...item, cover, ...(size ? { coverWidth: size.width, coverHeight: size.height } : {}) }
			: item;
		const last = days.at(-1);
		if (last?.day === item.day) last.items.push(withCover);
		else days.push({ day: item.day, items: [withCover] });
	}
	return { updatedAt: now.toISOString(), days };
}

/** The share image a page declares (og:image, then twitter:image), resolved against the page URL. */
export function findShareImage(html: string, pageUrl: string): string | null {
	const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
	const wanted = ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'];
	const found = new Map<string, string>();
	for (const tag of metas) {
		const key = attr(tag, 'property') ?? attr(tag, 'name');
		const content = attr(tag, 'content');
		if (key && content && !found.has(key.toLowerCase())) found.set(key.toLowerCase(), content);
	}
	for (const key of wanted) {
		const raw = found.get(key);
		if (!raw) continue;
		const url = safeHttpUrl(decodeEntities(raw), pageUrl);
		if (url) return url.replace(/^http:/, 'https:');
	}
	return null;
}

function attr(tag: string, name: string): string | null {
	const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
	return match ? (match[2] ?? match[3] ?? match[4] ?? null) : null;
}

function decodeEntities(text: string): string {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&#x27;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}
