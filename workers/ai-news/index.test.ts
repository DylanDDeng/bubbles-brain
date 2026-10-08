import { describe, expect, it } from 'vitest';
import worker from './index';
import * as entry from './index';
import { FEED_KEY, lookUpCover, sync, type Env } from './sync';
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
	it('serves the stored feed to any origin, cached for five minutes', async () => {
		const e = env();
		const feed: Feed = { updatedAt: '2026-10-08T03:00:00.000Z', days: [] };
		e.NEWS.store.set(FEED_KEY, JSON.stringify(feed));
		const response = await worker.fetch(new Request('https://news-api.test/v1/feed'), e);
		expect(response.status).toBe(200);
		expect(response.headers.get('access-control-allow-origin')).toBe('*');
		expect(response.headers.get('cache-control')).toContain('max-age=300');
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
