import { describe, expect, it } from 'vitest';
import { feedIcons, findIconLinks, iconPath, parentHost, parseIconPath } from './icons';
import { serveIcon, FEED_KEY, type Env } from './sync';
import type { Feed } from './feed';

describe('icon paths', () => {
	it('gives an X post its account and anything else its site', () => {
		expect(iconPath('https://x.com/Arena/status/2108309011531735304')).toBe('/v1/icon/x/arena');
		expect(iconPath('https://twitter.com/i/web/status/1')).toBe('/v1/icon/site/twitter.com');
		expect(iconPath('https://www.techcrunch.com/2026/10/09/a/')).toBe('/v1/icon/site/techcrunch.com');
		expect(iconPath('https://newsletter.semianalysis.com/p/x')).toBe('/v1/icon/site/newsletter.semianalysis.com');
		expect(iconPath('not a url')).toBeNull();
		expect(iconPath('https://localhost/x')).toBeNull();
	});

	it('reads back only well-formed icon paths', () => {
		expect(parseIconPath('/v1/icon/site/techcrunch.com')).toEqual({ kind: 'site', host: 'techcrunch.com' });
		expect(parseIconPath('/v1/icon/x/arena')).toEqual({ kind: 'x', handle: 'arena' });
		for (const bad of ['/v1/icon/site/..', '/v1/icon/site/a', '/v1/icon/x/way_too_long_handle_here', '/v1/icon/site/x.com/evil']) {
			expect(parseIconPath(bad)).toBeNull();
		}
	});

	it('walks up from a subdomain, but not into a public suffix', () => {
		expect(parentHost('cn.wsj.com')).toBe('wsj.com');
		expect(parentHost('wsj.com')).toBeNull();
		expect(parentHost('bbc.co.uk')).toBeNull();
	});

	it('prefers the large icons a page declares, then /favicon.ico', () => {
		const html = `<link rel="icon" href="/fav-16.png" sizes="16x16"><link rel="icon" href="/fav-96.png" sizes="96x96">
			<link rel="apple-touch-icon" href="https://cdn.test/touch.png"><link rel="stylesheet" href="/a.css">`;
		expect(findIconLinks(html, 'https://site.test/')).toEqual([
			'https://cdn.test/touch.png',
			'https://site.test/fav-96.png',
			'https://site.test/fav-16.png',
			'https://site.test/favicon.ico',
		]);
	});
});

describe('GET /v1/icon/…', () => {
	const feed: Feed = {
		updatedAt: 'x',
		days: [
			{
				day: '2026-10-10',
				items: [
					{
						id: 'r',
						title: 'T',
						summary: '',
						url: 'https://a.test',
						at: 'x',
						day: '2026-10-10',
						hot: true,
						sources: [{ name: 'Site', url: 'https://site.test/p', icon: '/v1/icon/site/site.test' }],
					},
				],
			},
		],
	};
	const setup = () => {
		const kv = new Map<string, string>([[FEED_KEY, JSON.stringify(feed)]]);
		const r2 = new Map<string, { body: ArrayBuffer; type?: string }>();
		const waits: Promise<unknown>[] = [];
		const env = {
			NEWS: {
				get: async (key: string, type?: string) => {
					const value = kv.get(key) ?? null;
					return type === 'json' && value ? JSON.parse(value) : value;
				},
				put: async (key: string, value: string) => void kv.set(key, value),
			},
			COVERS: {
				head: async () => null,
				get: async (key: string) => {
					const hit = r2.get(key);
					return hit ? { body: new Response(hit.body).body!, arrayBuffer: async () => hit.body, httpMetadata: { contentType: hit.type } } : null;
				},
				put: async (key: string, body: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) =>
					void r2.set(key, { body, type: options?.httpMetadata?.contentType }),
			},
		} as unknown as Env;
		const ctx = { waitUntil: (promise: Promise<unknown>) => void waits.push(promise) };
		return { env, ctx, kv, r2, waits };
	};
	const png = new Uint8Array([137, 80, 78, 71]).buffer;

	it('fetches a listed icon once, keeps it, and serves it from R2 after that', async () => {
		const { env, ctx, r2, waits } = setup();
		const asked: string[] = [];
		const fetcher = (async (url: string) => {
			asked.push(url);
			if (url === 'https://site.test/') return new Response('<link rel="icon" href="/i.png">', { headers: { 'content-type': 'text/html' } });
			if (url === 'https://site.test/i.png') return new Response(png, { headers: { 'content-type': 'image/png' } });
			return new Response('', { status: 404 });
		}) as typeof fetch;
		const first = await serveIcon(new Request('https://news-api.test/v1/icon/site/site.test'), env, ctx, fetcher);
		await Promise.all(waits);
		expect(first.status).toBe(200);
		expect(first.headers.get('content-type')).toBe('image/png');
		expect(r2.has('icons/site/site.test')).toBe(true);
		const again = await serveIcon(new Request('https://news-api.test/v1/icon/site/site.test'), env, ctx, (async () => {
			throw new Error('should not fetch');
		}) as typeof fetch);
		expect(again.status).toBe(200);
		expect(asked).toEqual(['https://site.test/', 'https://site.test/i.png']);
	});

	it('refuses icons the feed does not list, and remembers a site without one', async () => {
		const { env, ctx, kv } = setup();
		const never = (async () => {
			throw new Error('should not fetch');
		}) as typeof fetch;
		expect((await serveIcon(new Request('https://news-api.test/v1/icon/site/other.test'), env, ctx, never)).status).toBe(404);
		const html = (async () => new Response('<html>', { headers: { 'content-type': 'text/html' } })) as typeof fetch;
		const miss = await serveIcon(new Request('https://news-api.test/v1/icon/site/site.test'), env, ctx, html);
		expect(miss.status).toBe(404);
		expect(kv.has('icon-miss:icons/site/site.test')).toBe(true);
		expect((await serveIcon(new Request('https://news-api.test/v1/icon/site/site.test'), env, ctx, never)).status).toBe(404);
	});

	it('lists the icons of hot stories', () => {
		expect([...feedIcons(feed)]).toEqual(['/v1/icon/site/site.test']);
	});
});
