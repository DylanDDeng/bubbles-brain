/**
 * bubble-ai-news, the work behind index.ts: read the last 30 days of the Feishu Base the Grok bot
 * fills, look up each new story's share image, and keep one JSON feed in KV for GET /v1/feed.
 * The Base stays the archive; KV only holds what the page shows.
 */
import { buildFeed, FIELDS, findShareImage, storyKey, toItem, type BaseRecord, type Feed } from './feed';

/** The two KV calls this Worker makes (structurally a subset of Cloudflare's KVNamespace). */
export interface FeedStore {
	get(key: string): Promise<string | null>;
	get<T>(key: string, type: 'json'): Promise<T | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
	NEWS: FeedStore;
	FEISHU_APP_ID: string;
	FEISHU_APP_SECRET: string;
	/** The Base's token, from its /base/<token> link. */
	FEISHU_BASE_TOKEN: string;
	FEISHU_TABLE_ID: string;
	FEISHU_API_ORIGIN?: string;
}

export const FEED_KEY = 'feed:v1';
const WINDOW_DAYS = 30;
const COVER_LOOKUPS_PER_RUN = 15;
const COVER_FOUND_TTL = 60 * 60 * 24 * 45;
const COVER_MISSING_TTL = 60 * 60 * 24 * 3;
const HTML_BYTES = 256 * 1024;

/** GET /v1/feed: the stored feed, readable from any origin, cached for five minutes. */
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
			'cache-control': 'public, max-age=300, stale-while-revalidate=600',
			'x-content-type-options': 'nosniff',
		},
	});
}

export async function sync(env: Env, now = new Date(), fetcher: typeof fetch = fetch): Promise<Feed> {
	const token = await tenantToken(env, fetcher);
	const since = now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
	const records = await searchRecords(env, token, since, fetcher);

	const keys = [...new Set(records.map(recordStoryKey).filter((key): key is string => key !== null))];
	const covers = new Map<string, string | null>();
	await Promise.all(
		keys.map(async (key) => {
			const cached = await env.NEWS.get<{ cover: string | null }>(`cover:${key}`, 'json');
			if (cached) covers.set(key, cached.cover);
		}),
	);
	const missing = records
		.map((record) => ({ key: recordStoryKey(record), url: cellLink(record) }))
		.filter((entry): entry is { key: string; url: string } => !!entry.key && !!entry.url && !covers.has(entry.key))
		.filter((entry, index, all) => all.findIndex((other) => other.key === entry.key) === index)
		.slice(0, COVER_LOOKUPS_PER_RUN);
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

	const feed = buildFeed(records, covers, now);
	const previous = await env.NEWS.get<Feed>(FEED_KEY, 'json');
	if (previous && JSON.stringify(previous.days) === JSON.stringify(feed.days)) return previous;
	await env.NEWS.put(FEED_KEY, JSON.stringify(feed));
	return feed;
}

function recordStoryKey(record: BaseRecord): string | null {
	const url = cellLink(record);
	return url ? storyKey(url) : null;
}

/** The item's own link, so a cover is stored under exactly the key the feed looks it up by. */
function cellLink(record: BaseRecord): string | null {
	return toItem(record)?.url ?? null;
}

async function tenantToken(env: Env, fetcher: typeof fetch): Promise<string> {
	const response = await fetcher(`${apiOrigin(env)}/open-apis/auth/v3/tenant_access_token/internal`, {
		method: 'POST',
		headers: { 'content-type': 'application/json; charset=utf-8' },
		body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
	});
	const body = (await response.json()) as { code?: number; msg?: string; tenant_access_token?: string };
	if (!response.ok || body.code !== 0 || !body.tenant_access_token) {
		throw new Error(`feishu_token_failed: ${response.status} ${body.code ?? ''} ${body.msg ?? ''}`.trim());
	}
	return body.tenant_access_token;
}

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
