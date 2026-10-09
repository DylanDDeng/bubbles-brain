/**
 * bubble-ai-news, the work behind index.ts: read the last 30 days of the Feishu Base the Grok bot
 * fills, find each story's cover, and keep one JSON feed in KV for GET /v1/feed. A cover is the
 * image the bot attached in 封面 (copied once into R2, shrunk, and served from /v1/cover/<token>);
 * failing that, the source page's own share image.
 * The bot calls POST /v1/sync after each batch it writes; an hourly cron catches anything missed.
 * The Base stays the archive; KV only holds what the page shows.
 */
import {
	attachmentToken,
	buildFeed,
	FIELDS,
	findShareImage,
	isFileToken,
	storyKey,
	toItem,
	coverSize,
	type BaseRecord,
	type CoverSize,
	type Feed,
} from './feed';

/** The two KV calls this Worker makes (structurally a subset of Cloudflare's KVNamespace). */
export interface FeedStore {
	get(key: string): Promise<string | null>;
	get<T>(key: string, type: 'json'): Promise<T | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/** The R2 calls this Worker makes (a subset of R2Bucket). */
export interface CoverBucket {
	head(key: string): Promise<{ customMetadata?: Record<string, string> } | null>;
	get(key: string): Promise<{
		body: ReadableStream;
		arrayBuffer(): Promise<ArrayBuffer>;
		httpMetadata?: { contentType?: string };
		customMetadata?: Record<string, string>;
		httpEtag?: string;
	} | null>;
	put(
		key: string,
		value: ArrayBuffer | ReadableStream,
		options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> },
	): Promise<unknown>;
}

/** The Images binding call used to shrink covers (a subset of ImagesBinding). */
export interface ImageResizer {
	info(stream: ReadableStream): Promise<{ width?: number; height?: number }>;
	input(stream: ReadableStream): {
		transform(options: { width: number; fit: 'scale-down' }): {
			output(options: { format: 'image/webp'; quality: number }): Promise<{ image(): ReadableStream; contentType(): string }>;
		};
	};
}

export interface Env {
	NEWS: FeedStore;
	/** Attachment covers, copied from Feishu once. */
	COVERS?: CoverBucket;
	IMAGES?: ImageResizer;
	/** Public prefix of GET /v1/cover/<token>. */
	COVER_BASE_URL?: string;
	FEISHU_APP_ID: string;
	FEISHU_APP_SECRET: string;
	/** The Base's token, from its /base/<token> link. */
	FEISHU_BASE_TOKEN: string;
	FEISHU_TABLE_ID: string;
	FEISHU_API_ORIGIN?: string;
	/** Shared with the Grok bot: POST /v1/sync must carry it as a Bearer token. */
	SYNC_TOKEN?: string;
}

export interface Waiter {
	waitUntil(promise: Promise<unknown>): void;
}

export const FEED_KEY = 'feed:v1';
export const TOKEN_KEY = 'feishu:tenant-token';
export const SYNC_LOCK_KEY = 'sync:requested';
const WINDOW_DAYS = 30;
/**
 * Per run: share-image lookups and attachment copies. The cron has minutes; a bot-triggered run
 * must finish inside waitUntil's 30 seconds.
 */
export const RUN_LIMITS = {
	scheduled: { pages: 15, attachments: 40 },
	requested: { pages: 5, attachments: 4 },
} as const;
export type RunLimits = { pages: number; attachments: number };
const DEFAULT_COVER_BASE = 'https://news-api.bubblenews.today/v1/cover/';
/** Cards are at most ~380px wide; 800px covers a 2x screen. */
const COVER_WIDTH = 800;
const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
/** KV's shortest expiry: at most one bot-triggered sync a minute. */
const SYNC_LOCK_TTL = 60;
/** A row the bot just wrote can take a moment to show up in search. */
const SYNC_DELAY_MS = 3000;
const COVER_FOUND_TTL = 60 * 60 * 24 * 45;
const COVER_MISSING_TTL = 60 * 60 * 24 * 3;
const HTML_BYTES = 256 * 1024;

export async function handleRequest(request: Request, env: Env, ctx: Waiter): Promise<Response> {
	const url = new URL(request.url);
	if (url.pathname === '/v1/sync') return requestSync(request, env, ctx);
	if (url.pathname.startsWith('/v1/cover/')) return serveCover(request, env);
	return serveFeed(request, env);
}

/**
 * POST /v1/sync: the bot says "I just wrote a batch". Answers 202 at once and syncs a few seconds
 * later; further calls within a minute are folded into that one.
 */
export async function requestSync(request: Request, env: Env, ctx: Waiter, delayMs = SYNC_DELAY_MS): Promise<Response> {
	if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
	if (!env.SYNC_TOKEN) return json({ error: 'sync_disabled' }, 503);
	const presented = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
	if (!sameSecret(presented, env.SYNC_TOKEN)) return json({ error: 'unauthorized' }, 401);
	if (await env.NEWS.get(SYNC_LOCK_KEY)) return json({ status: 'already_queued' }, 202);
	await env.NEWS.put(SYNC_LOCK_KEY, new Date().toISOString(), { expirationTtl: SYNC_LOCK_TTL });
	ctx.waitUntil(
		new Promise((resolve) => setTimeout(resolve, delayMs)).then(() =>
			sync(env, new Date(), fetch, RUN_LIMITS.requested),
		),
	);
	return json({ status: 'queued' }, 202);
}

/** Compares without stopping at the first different character, so timing reveals nothing. */
function sameSecret(a: string, b: string): boolean {
	const left = new TextEncoder().encode(a);
	const right = new TextEncoder().encode(b);
	let diff = left.length ^ right.length;
	for (let i = 0; i < right.length; i += 1) diff |= (left[i] ?? 0) ^ right[i];
	return diff === 0;
}

/** GET /v1/cover/<file token>: an attachment cover from R2; the token never changes, so cache it for good. */
export async function serveCover(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'method_not_allowed' }, 405);
	const token = new URL(request.url).pathname.slice('/v1/cover/'.length);
	if (!isFileToken(token) || !env.COVERS) return json({ error: 'not_found' }, 404);
	const object = await env.COVERS.get(coverKey(token));
	if (!object) return json({ error: 'not_found' }, 404);
	return new Response(request.method === 'HEAD' ? null : object.body, {
		headers: {
			'content-type': object.httpMetadata?.contentType ?? 'application/octet-stream',
			'cache-control': 'public, max-age=31536000, immutable',
			'access-control-allow-origin': '*',
			'x-content-type-options': 'nosniff',
			...(object.httpEtag ? { etag: object.httpEtag } : {}),
		},
	});
}

/** GET /v1/feed: the stored feed, readable from any origin, cached for a minute. */
export async function serveFeed(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
	if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'method_not_allowed' }, 405);
	if (url.pathname !== '/v1/feed') return json({ error: 'not_found' }, 404);
	const feed = await env.NEWS.get(FEED_KEY);
	if (!feed) return json({ error: 'feed_not_ready' }, 503);
	return new Response(request.method === 'HEAD' ? null : feed, {
		headers: {
			...corsHeaders(),
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'public, max-age=60, stale-while-revalidate=300',
			'x-content-type-options': 'nosniff',
		},
	});
}

export async function sync(
	env: Env,
	now = new Date(),
	fetcher: typeof fetch = fetch,
	limits: RunLimits = RUN_LIMITS.scheduled,
): Promise<Feed> {
	const since = now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
	let token = await tenantToken(env, fetcher);
	let records: BaseRecord[];
	try {
		records = await searchRecords(env, token, since, fetcher);
	} catch (error) {
		// A cached token Feishu has already retired: fetch a fresh one and try once more.
		if (!(error instanceof StaleTokenError)) throw error;
		token = await tenantToken(env, fetcher, true);
		records = await searchRecords(env, token, since, fetcher);
	}

	const previous = await env.NEWS.get<Feed>(FEED_KEY, 'json');
	const keys = [...new Set(records.map(recordStoryKey).filter((key): key is string => key !== null))];
	const covers = new Map<string, string | null>();
	const attached = await attachmentCovers(env, records, previous, token, fetcher, limits.attachments);
	await Promise.all(
		keys.map(async (key) => {
			const cached = await env.NEWS.get<{ cover: string | null }>(`cover:${key}`, 'json');
			if (cached) covers.set(key, cached.cover);
		}),
	);
	const missing = records
		.map((record) => ({ key: recordStoryKey(record), url: cellLink(record) }))
		.filter(
			(entry): entry is { key: string; url: string } =>
				!!entry.key && !!entry.url && !covers.has(entry.key) && !attached.has(entry.key),
		)
		.filter((entry, index, all) => all.findIndex((other) => other.key === entry.key) === index)
		.slice(0, limits.pages);
	for (let i = 0; i < missing.length; i += 5) {
		await Promise.all(
			missing.slice(i, i + 5).map(async ({ key, url }) => {
				const cover = await lookUpCover(url, fetcher);
				covers.set(key, cover);
				await env.NEWS.put(`cover:${key}`, JSON.stringify({ cover }), {
					expirationTtl: cover ? COVER_FOUND_TTL : COVER_MISSING_TTL,
				});
			}),
		);
	}

	// The bot's own attachment wins over whatever the source page offers.
	const sizes = new Map<string, CoverSize>();
	for (const [key, cover] of attached) {
		covers.set(key, cover.url);
		if (cover.size) sizes.set(cover.url, cover.size);
	}
	const feed = buildFeed(records, covers, now, sizes);
	if (previous && JSON.stringify(previous.days) === JSON.stringify(feed.days)) return previous;
	await env.NEWS.put(FEED_KEY, JSON.stringify(feed));
	return feed;
}

function coverKey(token: string): string {
	return `covers/${token}`;
}

/**
 * Story key → public cover URL (and pixel size) for every story whose newest row carries an
 * attachment that is in R2. Attachments already in the last feed with a size are known; others are
 * checked in R2, and up to `limit` are copied from Feishu or measured this run (the rest later).
 */
async function attachmentCovers(
	env: Env,
	records: BaseRecord[],
	previous: Feed | null,
	tenant: string,
	fetcher: typeof fetch,
	limit: number,
): Promise<Map<string, { url: string; size: CoverSize | null }>> {
	const result = new Map<string, { url: string; size: CoverSize | null }>();
	const covers = env.COVERS;
	if (!covers) return result;
	const base = env.COVER_BASE_URL || DEFAULT_COVER_BASE;
	// Covers in the last feed are in R2 already; their size is known when the feed carried one.
	const known = new Map<string, CoverSize | null>();
	for (const item of (previous?.days ?? []).flatMap((day) => day.items)) {
		if (item.cover?.startsWith(base)) {
			known.set(item.cover.slice(base.length), coverSize(item.coverWidth, item.coverHeight));
		}
	}
	const seen = new Set<string>();
	let work = 0;
	// Records come newest first, so a story's first row is the one the feed keeps.
	for (const record of records) {
		const key = recordStoryKey(record);
		if (!key || seen.has(key)) continue;
		seen.add(key);
		const file = attachmentToken(record.fields[FIELDS.cover]);
		if (!file) continue;
		const url = `${base}${file}`;
		if (known.has(file)) {
			const size = known.get(file) ?? null;
			// Stored before sizes were kept: measure a few per run, without asking R2 about the rest.
			if (size || work >= limit) {
				result.set(key, { url, size });
			} else {
				work += 1;
				result.set(key, { url, size: await measureStored(env, file) });
			}
			continue;
		}
		const head = await covers.head(coverKey(file));
		const storedSize = coverSize(head?.customMetadata?.width, head?.customMetadata?.height);
		if (head && storedSize) {
			result.set(key, { url, size: storedSize });
			continue;
		}
		if (work >= limit) {
			if (head) result.set(key, { url, size: null });
			continue;
		}
		work += 1;
		// Either never copied, or copied before sizes were recorded: (re)measure and store it.
		const size = head ? await measureStored(env, file) : await copyAttachment(env, file, tenant, fetcher);
		if (head || size !== false) result.set(key, { url, size: size || null });
	}
	return result;
}

/** Pixel size of an image, or null when the Images binding is missing or cannot tell. */
async function measure(env: Env, bytes: ArrayBuffer): Promise<CoverSize | null> {
	if (!env.IMAGES) return null;
	try {
		const info = await env.IMAGES.info(new Response(bytes).body!);
		return coverSize(info.width, info.height);
	} catch {
		return null;
	}
}

/** A cover copied before sizes were kept: measure it and write it back with its size. */
async function measureStored(env: Env, file: string): Promise<CoverSize | null> {
	const object = await env.COVERS!.get(coverKey(file));
	if (!object) return null;
	const bytes = await object.arrayBuffer();
	const size = await measure(env, bytes);
	if (size) {
		await env.COVERS!.put(coverKey(file), bytes, {
			httpMetadata: { contentType: object.httpMetadata?.contentType },
			customMetadata: { width: String(size.width), height: String(size.height) },
		});
	}
	return size;
}

/**
 * Downloads one attachment, shrinks it to a WebP when the Images binding allows, and stores it with
 * its pixel size. Returns the size (null when unknown), or false when nothing was stored.
 */
async function copyAttachment(
	env: Env,
	file: string,
	tenant: string,
	fetcher: typeof fetch,
): Promise<CoverSize | null | false> {
	try {
		const response = await fetcher(`${apiOrigin(env)}/open-apis/drive/v1/medias/${file}/download`, {
			headers: { authorization: `Bearer ${tenant}` },
		});
		const type = response.headers.get('content-type') ?? '';
		if (!response.ok || !type.startsWith('image/')) return false;
		const bytes = await response.arrayBuffer();
		if (!bytes.byteLength || bytes.byteLength > ATTACHMENT_MAX_BYTES) return false;
		let body: ArrayBuffer = bytes;
		let contentType = type.split(';')[0];
		if (env.IMAGES && !/gif/.test(contentType)) {
			try {
				const shrunk = await env.IMAGES.input(new Response(bytes).body!)
					.transform({ width: COVER_WIDTH, fit: 'scale-down' })
					.output({ format: 'image/webp', quality: 82 });
				// R2 needs a known length, so read the result out rather than streaming it in.
				body = await new Response(shrunk.image()).arrayBuffer();
				contentType = shrunk.contentType();
			} catch {
				// Out of free transformations or an odd file: keep the original rather than nothing.
			}
		}
		const size = await measure(env, body);
		await env.COVERS!.put(coverKey(file), body, {
			httpMetadata: { contentType },
			...(size ? { customMetadata: { width: String(size.width), height: String(size.height) } } : {}),
		});
		return size;
	} catch {
		return false;
	}
}

function recordStoryKey(record: BaseRecord): string | null {
	const url = cellLink(record);
	return url ? storyKey(url) : null;
}

/** The item's own link, so a cover is stored under exactly the key the feed looks it up by. */
function cellLink(record: BaseRecord): string | null {
	return toItem(record)?.url ?? null;
}

/**
 * A tenant token lasts two hours; reuse it from KV until five minutes before it expires instead
 * of spending an API call on a new one every run.
 */
async function tenantToken(env: Env, fetcher: typeof fetch, fresh = false): Promise<string> {
	if (!fresh) {
		const cached = await env.NEWS.get(TOKEN_KEY);
		if (cached) return cached;
	}
	const response = await fetcher(`${apiOrigin(env)}/open-apis/auth/v3/tenant_access_token/internal`, {
		method: 'POST',
		headers: { 'content-type': 'application/json; charset=utf-8' },
		body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
	});
	const body = (await response.json()) as {
		code?: number;
		msg?: string;
		tenant_access_token?: string;
		expire?: number;
	};
	if (!response.ok || body.code !== 0 || !body.tenant_access_token) {
		throw new Error(`feishu_token_failed: ${response.status} ${body.code ?? ''} ${body.msg ?? ''}`.trim());
	}
	const ttl = (body.expire ?? 0) - 300;
	if (ttl >= 60) await env.NEWS.put(TOKEN_KEY, body.tenant_access_token, { expirationTtl: ttl });
	return body.tenant_access_token;
}

/** Feishu's answers for an expired or unknown tenant token. */
const STALE_TOKEN_CODES = new Set([99991661, 99991663, 99991668]);

class StaleTokenError extends Error {}

async function searchRecords(env: Env, token: string, since: number, fetcher: typeof fetch): Promise<BaseRecord[]> {
	const records: BaseRecord[] = [];
	let pageToken: string | undefined;
	for (let page = 0; page < 20; page += 1) {
		const query = new URLSearchParams({ page_size: '500' });
		if (pageToken) query.set('page_token', pageToken);
		const path = `/open-apis/bitable/v1/apps/${encodeURIComponent(env.FEISHU_BASE_TOKEN)}/tables/${encodeURIComponent(env.FEISHU_TABLE_ID)}/records/search`;
		const response = await fetcher(`${apiOrigin(env)}${path}?${query}`, {
			method: 'POST',
			headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json; charset=utf-8' },
			body: JSON.stringify({
				field_names: Object.values(FIELDS),
				sort: [{ field_name: FIELDS.at, desc: true }],
				filter: {
					conjunction: 'and',
					conditions: [{ field_name: FIELDS.at, operator: 'isGreater', value: ['ExactDate', String(since)] }],
				},
			}),
		});
		const body = (await response.json()) as {
			code?: number;
			msg?: string;
			data?: { items?: BaseRecord[] | null; has_more?: boolean; page_token?: string };
		};
		if (body.code !== undefined && STALE_TOKEN_CODES.has(body.code)) throw new StaleTokenError(String(body.code));
		if (!response.ok || body.code !== 0) {
			throw new Error(`feishu_search_failed: ${response.status} ${body.code ?? ''} ${body.msg ?? ''}`.trim());
		}
		records.push(...(body.data?.items ?? []));
		if (!body.data?.has_more || !body.data.page_token) break;
		pageToken = body.data.page_token;
	}
	return records;
}

/** Reads the head of the page and returns its share image, or null on any failure. */
export async function lookUpCover(pageUrl: string, fetcher: typeof fetch = fetch): Promise<string | null> {
	try {
		const response = await fetcher(pageUrl, {
			headers: {
				accept: 'text/html,application/xhtml+xml',
				'user-agent': 'Mozilla/5.0 (compatible; BubbleBrainNews/1.0; +https://bubblenews.today/ai-news/)',
			},
			redirect: 'follow',
			signal: AbortSignal.timeout(6000),
		});
		const type = response.headers.get('content-type') ?? '';
		if (!response.ok || !response.body || !type.includes('html')) return null;
		const html = await readHead(response.body, HTML_BYTES);
		return findShareImage(html, response.url || pageUrl);
	} catch {
		return null;
	}
}

async function readHead(body: ReadableStream<Uint8Array>, limit: number): Promise<string> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let html = '';
	let bytes = 0;
	while (bytes < limit) {
		const { done, value } = await reader.read();
		if (done) break;
		bytes += value.byteLength;
		html += decoder.decode(value, { stream: true });
		if (/<\/head>/i.test(html)) break;
	}
	await reader.cancel().catch(() => undefined);
	return html;
}

function apiOrigin(env: Env): string {
	return (env.FEISHU_API_ORIGIN || 'https://open.feishu.cn').replace(/\/+$/, '');
}

function corsHeaders(): Record<string, string> {
	return {
		'access-control-allow-origin': '*',
		'access-control-allow-methods': 'GET, HEAD, OPTIONS',
		'access-control-max-age': '86400',
	};
}

function json(body: unknown, status: number): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders(), 'content-type': 'application/json; charset=utf-8' },
	});
}
