import { describe, expect, it, vi } from 'vitest';
import worker from './index';
import * as entry from './index';
import {
	FEED_KEY,
	lookUpCover,
	requestSync,
	SYNC_LOCK_KEY,
	sync,
	TOKEN_KEY,
	type CoverBucket,
	type Env,
	type ImageResizer,
} from './sync';
import type { Feed } from './feed';

class MemoryKV {
	store = new Map<string, string>();
	puts: string[] = [];
	async get(key: string, type?: 'json') {
		const value = this.store.get(key) ?? null;
		return value !== null && type === 'json' ? JSON.parse(value) : value;
	}
	async put(key: string, value: string) {
		this.puts.push(key);
		this.store.set(key, value);
	}
}

function env(kv = new MemoryKV()): Env & { NEWS: MemoryKV } {
	return {
		NEWS: kv,
		FEISHU_APP_ID: 'cli_test',
		FEISHU_APP_SECRET: 'secret',
		FEISHU_BASE_TOKEN: 'base_token',
		FEISHU_TABLE_ID: 'tbl_test',
	} as Env & { NEWS: MemoryKV };
}

const rows = [
	{
		record_id: 'rec1',
		fields: {
			标题: 'Anthropic 发布 Claude Haiku 5.5',
			内容: '更便宜',
			链接: [{ type: 'url', text: 'https://www.anthropic.com/claude-haiku-5-5', link: 'https://www.anthropic.com/claude-haiku-5-5' }],
			推送时间: Date.parse('2026-10-07T14:55:00-04:00'),
		},
	},
	{ record_id: 'rec2', fields: { 标题: null, 内容: null, 链接: null, 推送时间: null } },
];

function fakeFeishu(calls: { url: string; body?: unknown }[]): typeof fetch {
	return (async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input);
		calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
		if (url.endsWith('/tenant_access_token/internal')) {
			return Response.json({ code: 0, tenant_access_token: 't-123', expire: 7200 });
		}
		if (url.includes('/records/search')) {
			return Response.json({ code: 0, data: { items: rows, has_more: false } });
		}
		return new Response('<html><head><meta property="og:image" content="/og.png"></head>', {
			headers: { 'content-type': 'text/html; charset=utf-8' },
		});
	}) as typeof fetch;
}

describe('sync', () => {
	it('reads the last 30 days from the Base and stores the feed with covers', async () => {
		const calls: { url: string; body?: unknown }[] = [];
		const e = env();
		const feed = await sync(e, new Date('2026-10-08T03:00:00Z'), fakeFeishu(calls));

		const search = calls.find((call) => call.url.includes('/records/search'));
		expect(search?.url).toContain('/apps/base_token/tables/tbl_test/records/search?page_size=500');
		expect(search?.body).toMatchObject({
			sort: [{ field_name: '推送时间', desc: true }],
			filter: { conditions: [{ field_name: '推送时间', operator: 'isGreater' }] },
		});
		expect(feed.days).toHaveLength(1);
		expect(feed.days[0].items[0]).toMatchObject({
			id: 'rec1',
			day: '2026-10-08',
			cover: 'https://www.anthropic.com/og.png',
		});
		expect(JSON.parse(e.NEWS.store.get(FEED_KEY)!)).toEqual(feed);
	});

	it('does not rewrite KV or refetch covers when nothing changed', async () => {
		const e = env();
		await sync(e, new Date('2026-10-08T03:00:00Z'), fakeFeishu([]));
		e.NEWS.puts = [];
		const calls: { url: string }[] = [];
		const again = await sync(e, new Date('2026-10-08T03:15:00Z'), fakeFeishu(calls));
		expect(e.NEWS.puts).toEqual([]);
		expect(again.updatedAt).toBe('2026-10-08T03:00:00.000Z');
		expect(calls.some((call) => call.url.includes('anthropic.com'))).toBe(false);
	});

	it('fails loudly when Feishu refuses the app', async () => {
		const refuse = (async () => Response.json({ code: 10014, msg: 'app secret invalid' })) as unknown as typeof fetch;
		await expect(sync(env(), new Date(), refuse)).rejects.toThrow(/feishu_token_failed/);
	});
});

describe('lookUpCover', () => {
	it('ignores pages that are not HTML', async () => {
		const pdf = (async () => new Response('%PDF', { headers: { 'content-type': 'application/pdf' } })) as unknown as typeof fetch;
		expect(await lookUpCover('https://a.test/x.pdf', pdf)).toBeNull();
	});
});

describe('GET /v1/feed', () => {
	it('serves the stored feed to any origin, cached for a minute', async () => {
		const e = env();
		const feed: Feed = { updatedAt: '2026-10-08T03:00:00.000Z', days: [] };
		e.NEWS.store.set(FEED_KEY, JSON.stringify(feed));
		const response = await worker.fetch(new Request('https://news-api.test/v1/feed'), e);
		expect(response.status).toBe(200);
		expect(response.headers.get('access-control-allow-origin')).toBe('*');
		expect(response.headers.get('cache-control')).toContain('max-age=60');
		expect(await response.json()).toEqual(feed);
	});

	it('answers 503 before the first sync and 404 elsewhere', async () => {
		const e = env();
		expect((await worker.fetch(new Request('https://news-api.test/v1/feed'), e)).status).toBe(503);
		expect((await worker.fetch(new Request('https://news-api.test/'), e)).status).toBe(404);
		expect((await worker.fetch(new Request('https://news-api.test/v1/feed', { method: 'POST' }), e)).status).toBe(405);
	});
});

describe('entry module', () => {
	it('exports nothing but the handlers (workerd refuses other exports)', () => {
		expect(Object.keys(entry)).toEqual(['default']);
		expect(Object.keys(worker).sort()).toEqual(['fetch', 'scheduled']);
	});
});

describe('tenant token', () => {
	it('is reused from KV instead of fetched every run', async () => {
		const e = env();
		await sync(e, new Date('2026-10-08T03:00:00Z'), fakeFeishu([]));
		expect(e.NEWS.store.get(TOKEN_KEY)).toBe('t-123');
		const calls: { url: string }[] = [];
		await sync(e, new Date('2026-10-08T04:00:00Z'), fakeFeishu(calls));
		expect(calls.some((call) => call.url.endsWith('/tenant_access_token/internal'))).toBe(false);
	});

	it('is replaced once when Feishu says the cached one has expired', async () => {
		const e = env();
		e.NEWS.store.set(TOKEN_KEY, 't-old');
		const calls: { url: string; auth?: string }[] = [];
		const feishu = fakeFeishu([]);
		const stale = (async (input: RequestInfo | URL, init?: RequestInit) => {
			const auth = new Headers(init?.headers).get('authorization') ?? undefined;
			calls.push({ url: String(input), auth });
			if (String(input).includes('/records/search') && auth === 'Bearer t-old') {
				return Response.json({ code: 99991663, msg: 'tenant access token invalid' }, { status: 400 });
			}
			return feishu(input, init);
		}) as typeof fetch;
		const feed = await sync(e, new Date('2026-10-08T03:00:00Z'), stale);
		expect(feed.days).toHaveLength(1);
		expect(calls.filter((call) => call.url.includes('/records/search')).map((call) => call.auth)).toEqual([
			'Bearer t-old',
			'Bearer t-123',
		]);
		expect(e.NEWS.store.get(TOKEN_KEY)).toBe('t-123');
	});
});

describe('POST /v1/sync', () => {
	const post = (token?: string) =>
		new Request('https://news-api.test/v1/sync', {
			method: 'POST',
			headers: token ? { authorization: `Bearer ${token}` } : {},
		});
	const withToken = () => ({ ...env(), SYNC_TOKEN: 'bot-secret' }) as Env & { NEWS: MemoryKV };

	it('refuses callers without the shared token', async () => {
		const waits: Promise<unknown>[] = [];
		const ctx = { waitUntil: (p: Promise<unknown>) => waits.push(p) };
		const e = withToken();
		expect((await worker.fetch(post(), e, ctx)).status).toBe(401);
		expect((await worker.fetch(post('bot-secreT'), e, ctx)).status).toBe(401);
		expect((await worker.fetch(post('bot-secret-and-more'), e, ctx)).status).toBe(401);
		expect((await worker.fetch(new Request('https://news-api.test/v1/sync'), e, ctx)).status).toBe(405);
		expect((await worker.fetch(post('anything'), env(), ctx)).status).toBe(503);
		expect(waits).toHaveLength(0);
	});

	it('answers at once, syncs in the background, and folds repeat calls within a minute', async () => {
		vi.stubGlobal('fetch', fakeFeishu([]));
		const waits: Promise<unknown>[] = [];
		const ctx = { waitUntil: (p: Promise<unknown>) => waits.push(p) };
		const e = withToken();

		const first = await requestSync(post('bot-secret'), e, ctx, 0);
		expect(first.status).toBe(202);
		expect(await first.json()).toEqual({ status: 'queued' });
		expect(e.NEWS.store.has(SYNC_LOCK_KEY)).toBe(true);

		const second = await requestSync(post('bot-secret'), e, ctx, 0);
		expect(await second.json()).toEqual({ status: 'already_queued' });

		expect(waits).toHaveLength(1);
		await Promise.all(waits);
		expect(JSON.parse(e.NEWS.store.get(FEED_KEY)!).days[0].items[0].id).toBe('rec1');
		vi.unstubAllGlobals();
	});
});

class MemoryR2 implements CoverBucket {
	objects = new Map<string, { bytes: Uint8Array; contentType?: string }>();
	heads = 0;
	async head(key: string) {
		this.heads += 1;
		return this.objects.has(key) ? {} : null;
	}
	async get(key: string) {
		const object = this.objects.get(key);
		if (!object) return null;
		return { body: new Response(object.bytes).body!, httpMetadata: { contentType: object.contentType }, httpEtag: '"e1"' };
	}
	async put(key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string } }) {
		const bytes = new Uint8Array(await new Response(value).arrayBuffer());
		this.objects.set(key, { bytes, contentType: options?.httpMetadata?.contentType });
	}
}

/** Pretends to shrink: prefixes the bytes so the test can tell the resized copy was stored. */
const fakeImages: ImageResizer = {
	input(stream) {
		return {
			transform: () => ({
				output: async () => {
					const original = new Uint8Array(await new Response(stream).arrayBuffer());
					const shrunk = new Uint8Array([9, ...original]);
					return { image: () => new Response(shrunk).body!, contentType: () => 'image/webp' };
				},
			}),
		};
	},
};

describe('attachment covers', () => {
	const attachedRows = [
		{
			record_id: 'recA',
			fields: {
				标题: 'WSJ 独家新闻',
				内容: '有附件封面',
				链接: { link: 'https://www.wsj.com/tech/story', text: 'https://www.wsj.com/tech/story', type: 'url' },
				推送时间: Date.parse('2026-10-08T14:00:00Z'),
				封面: [{ file_token: 'FileTokenAAAA1', name: 'recA.jpg', size: 3 }],
			},
		},
	];

	function feishuWithMedia(calls: string[]): typeof fetch {
		return (async (input: RequestInfo | URL) => {
			const url = String(input);
			calls.push(url);
			if (url.endsWith('/tenant_access_token/internal')) return Response.json({ code: 0, tenant_access_token: 't-1', expire: 7200 });
			if (url.includes('/records/search')) return Response.json({ code: 0, data: { items: attachedRows, has_more: false } });
			if (url.includes('/medias/FileTokenAAAA1/download')) return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } });
			throw new Error(`unexpected fetch ${url}`);
		}) as typeof fetch;
	}

	it('copies the attachment once, shrunk, and prefers it over the page share image', async () => {
		const covers = new MemoryR2();
		const e = { ...env(), COVERS: covers, IMAGES: fakeImages } as Env & { NEWS: MemoryKV };
		const calls: string[] = [];
		const feed = await sync(e, new Date('2026-10-09T00:00:00Z'), feishuWithMedia(calls));

		expect(feed.days[0].items[0].cover).toBe('https://news-api.bubblenews.today/v1/cover/FileTokenAAAA1');
		expect([...covers.objects.get('covers/FileTokenAAAA1')!.bytes]).toEqual([9, 1, 2, 3]);
		expect(covers.objects.get('covers/FileTokenAAAA1')!.contentType).toBe('image/webp');
		// No share-image lookup for a story that already has its own cover.
		expect(calls.some((url) => url.includes('wsj.com'))).toBe(false);

		const again: string[] = [];
		covers.heads = 0;
		await sync(e, new Date('2026-10-09T01:00:00Z'), feishuWithMedia(again));
		expect(again.some((url) => url.includes('/medias/'))).toBe(false);
		expect(covers.heads).toBe(0);
	});

	it('keeps the original when resizing fails', async () => {
		const covers = new MemoryR2();
		const broken: ImageResizer = {
			input: () => ({ transform: () => ({ output: async () => Promise.reject(new Error('quota')) }) }),
		};
		const e = { ...env(), COVERS: covers, IMAGES: broken } as Env & { NEWS: MemoryKV };
		await sync(e, new Date('2026-10-09T00:00:00Z'), feishuWithMedia([]));
		expect(covers.objects.get('covers/FileTokenAAAA1')).toEqual({ bytes: new Uint8Array([1, 2, 3]), contentType: 'image/jpeg' });
	});

	it('serves stored covers for a year and refuses odd paths', async () => {
		const covers = new MemoryR2();
		covers.objects.set('covers/FileTokenAAAA1', { bytes: new Uint8Array([7]), contentType: 'image/webp' });
		const e = { ...env(), COVERS: covers } as Env & { NEWS: MemoryKV };
		const ok = await worker.fetch(new Request('https://news-api.test/v1/cover/FileTokenAAAA1'), e, { waitUntil() {} });
		expect(ok.status).toBe(200);
		expect(ok.headers.get('content-type')).toBe('image/webp');
		expect(ok.headers.get('cache-control')).toContain('immutable');
		expect([...new Uint8Array(await ok.arrayBuffer())]).toEqual([7]);
		for (const path of ['/v1/cover/Missing12345', '/v1/cover/..%2Fsecret', '/v1/cover/']) {
			expect((await worker.fetch(new Request(`https://news-api.test${path}`), e, { waitUntil() {} })).status).toBe(404);
		}
	});
});
