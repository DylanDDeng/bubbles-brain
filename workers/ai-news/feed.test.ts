import { describe, expect, it } from 'vitest';
import {
	attachmentToken,
	beijingDay,
	buildFeed,
	cellText,
	cellTime,
	cellUrl,
	findShareImage,
	parseSources,
	shortSummary,
	storyKey,
	toItem,
	type BaseRecord,
} from './feed';

const record = (id: string, fields: Record<string, unknown>): BaseRecord => ({ record_id: id, fields });

describe('cell readers', () => {
	it('reads text from strings, rich-text segments and link objects', () => {
		expect(cellText('plain')).toBe('plain');
		expect(cellText([{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }])).toBe('ab');
		expect(cellText({ link: 'https://x.test', text: 'X' })).toBe('X');
		expect(cellText(null)).toBe('');
	});

	it('finds the link in a Markdown link, a segment or bare text', () => {
		expect(cellUrl('[https://a.test/p](https://a.test/p)')).toBe('https://a.test/p');
		expect(cellUrl([{ type: 'url', text: 'Read', link: 'https://b.test/q' }])).toBe('https://b.test/q');
		expect(cellUrl('see https://c.test/r now')).toBe('https://c.test/r');
		expect(cellUrl('javascript:alert(1)')).toBeNull();
		expect(cellUrl('')).toBeNull();
	});

	it('reads Feishu millisecond timestamps and date strings', () => {
		expect(cellTime(1791431460000)).toBe(1791431460000);
		expect(cellTime('2026-10-07T22:51:00.000-04:00')).toBe(Date.parse('2026-10-07T22:51:00.000-04:00'));
		expect(cellTime('')).toBeNull();
	});

	it('puts a late-evening New York push on the next Beijing day', () => {
		expect(beijingDay(Date.parse('2026-10-07T22:51:00-04:00'))).toBe('2026-10-08');
		expect(beijingDay(Date.parse('2026-10-07T11:05:00-04:00'))).toBe('2026-10-07');
	});

	it('shortens long summaries on a character boundary', () => {
		expect(shortSummary('一  二\n三')).toBe('一 二 三');
		expect(shortSummary('字'.repeat(200), 10)).toBe(`${'字'.repeat(10)}…`);
	});
});

describe('toItem', () => {
	it('skips rows without a title, a link or a time', () => {
		expect(toItem(record('r1', {}))).toBeNull();
		expect(toItem(record('r2', { 标题: 'T', 推送时间: 1 }))).toBeNull();
		expect(toItem(record('r3', { 标题: 'T', 链接: 'https://a.test' }))).toBeNull();
	});

	it('reads the cell shapes records/search actually returns', () => {
		// Captured from the live Base on 2026-10-08: text as segments, the link as a url object.
		const item = toItem(
			record('rec_live', {
				内容: [{ text: 'USA Today Co. 起诉 OpenAI。', type: 'text' }],
				推送时间: 1791484380000,
				标题: [{ text: 'USA Today 起诉 OpenAI，索赔超过 2.5 亿美元', type: 'text' }],
				链接: {
					link: 'https://www.theverge.com/ai-artificial-intelligence/1008198/usa-today-openai-copyright-lawsuit',
					text: 'https://www.theverge.com/ai-artificial-intelligence/1008198/usa-today-openai-copyright-lawsuit',
					type: 'url',
				},
			}),
		);
		expect(item).toMatchObject({
			title: 'USA Today 起诉 OpenAI，索赔超过 2.5 亿美元',
			summary: 'USA Today Co. 起诉 OpenAI。',
			url: 'https://www.theverge.com/ai-artificial-intelligence/1008198/usa-today-openai-copyright-lawsuit',
			at: new Date(1791484380000).toISOString(),
		});
	});

	it('keeps only the public fields', () => {
		const item = toItem(
			record('r4', {
				标题: ' Haiku 5.5 ',
				内容: '摘要',
				链接: 'https://www.anthropic.com/claude-haiku-5-5',
				推送时间: Date.parse('2026-10-07T14:55:00-04:00'),
				适合原因: 'internal note',
				中文推: 'tweet',
			}),
		);
		expect(item).toEqual({
			id: 'r4',
			title: 'Haiku 5.5',
			summary: '摘要',
			url: 'https://www.anthropic.com/claude-haiku-5-5',
			at: '2026-10-07T18:55:00.000Z',
			day: '2026-10-08',
		});
	});
});

describe('buildFeed', () => {
	const at = (iso: string) => Date.parse(iso);

	it('groups by Beijing day, newest first, and keeps one item per story', () => {
		const feed = buildFeed(
			[
				record('old', { 标题: 'A', 链接: 'https://www.a.test/s?utm_source=x', 推送时间: at('2026-10-06T10:00:00Z') }),
				record('new', { 标题: 'A again', 链接: 'https://a.test/s/', 推送时间: at('2026-10-07T10:00:00Z') }),
				record('b', { 标题: 'B', 链接: 'https://b.test/', 推送时间: at('2026-10-07T20:00:00Z') }),
				record('empty', {}),
			],
			new Map([[storyKey('https://b.test/'), 'https://b.test/og.png']]),
			new Date('2026-10-08T00:00:00Z'),
		);
		expect(feed.updatedAt).toBe('2026-10-08T00:00:00.000Z');
		expect(feed.days.map((day) => [day.day, day.items.map((item) => item.id)])).toEqual([
			['2026-10-08', ['b']],
			['2026-10-07', ['new']],
		]);
		expect(feed.days[0].items[0].cover).toBe('https://b.test/og.png');
		expect(feed.days[1].items[0]).not.toHaveProperty('cover');
	});

	it('treats twitter.com and x.com links as the same story', () => {
		expect(storyKey('https://twitter.com/paulg/status/1')).toBe(storyKey('https://x.com/paulg/status/1#m'));
	});
});

describe('findShareImage', () => {
	it('prefers og:image and resolves it against the page', () => {
		const html = `<head><meta name="twitter:image" content="https://cdn.test/t.png">
			<meta content="/img/og.png?a=1&amp;b=2" property="og:image"></head>`;
		expect(findShareImage(html, 'https://site.test/post')).toBe('https://site.test/img/og.png?a=1&b=2');
	});

	it('falls back to twitter:image and upgrades http', () => {
		expect(findShareImage(`<meta name='twitter:image' content='http://cdn.test/t.png'>`, 'https://s.test')).toBe(
			'https://cdn.test/t.png',
		);
	});

	it('returns null without an image or with an unsafe one', () => {
		expect(findShareImage('<meta property="og:title" content="x">', 'https://s.test')).toBeNull();
		expect(findShareImage('<meta property="og:image" content="javascript:x">', 'https://s.test')).toBeNull();
	});
});

describe('attachmentToken', () => {
	it('takes the first image from a 封面 attachment cell', () => {
		// Shape captured from the live Base on 2026-10-09.
		expect(
			attachmentToken([
				{ file_token: 'Doc1abcdefghij', name: 'notes.pdf', size: 1 },
				{ file_token: 'Sz2vbiPxkoiaqIx3MEocXA62nbe', name: 'recvvp2wgwMnn4.jpg', size: 38814 },
			]),
		).toBe('Sz2vbiPxkoiaqIx3MEocXA62nbe');
		expect(attachmentToken([{ file_token: 'Abc12345xyz', type: 'image/png' }])).toBe('Abc12345xyz');
	});

	it('ignores empty cells and tokens that could escape a URL path', () => {
		expect(attachmentToken(null)).toBeNull();
		expect(attachmentToken([])).toBeNull();
		expect(attachmentToken('Sz2vbiPxkoiaqIx3')).toBeNull();
		expect(attachmentToken([{ file_token: '../../etc/passwd', name: 'a.jpg' }])).toBeNull();
	});
});

describe('cover sizes', () => {
	it('adds a known size to the item whose cover it belongs to', () => {
		const feed = buildFeed(
			[record('a', { 标题: 'A', 链接: 'https://a.test/x', 推送时间: Date.parse('2026-10-08T10:00:00Z') })],
			new Map([[storyKey('https://a.test/x'), 'https://cdn.test/a.webp']]),
			new Date('2026-10-09T00:00:00Z'),
			new Map([['https://cdn.test/a.webp', { width: 800, height: 600 }]]),
		);
		expect(feed.days[0].items[0]).toMatchObject({ cover: 'https://cdn.test/a.webp', coverWidth: 800, coverHeight: 600 });
	});
});

describe('hot stories', () => {
	const base = { 标题: 'T', 链接: 'https://a.test/p', 推送时间: Date.UTC(2026, 9, 10, 1, 20) };

	it('marks a ticked row hot and keeps its outlets', () => {
		const item = toItem(
			record('h1', {
				...base,
				热门: true,
				多源报道: 'TechCrunch: https://techcrunch.test/a\n华尔街日报(中文)：https://cn.wsj.test/b\nno link here',
			}),
		);
		expect(item).toMatchObject({
			hot: true,
			sources: [
				{ name: 'TechCrunch', url: 'https://techcrunch.test/a' },
				{ name: '华尔街日报(中文)', url: 'https://cn.wsj.test/b' },
			],
		});
	});

	it('leaves unticked rows alone, whatever their outlets', () => {
		const item = toItem(record('h2', { ...base, 热门: false, 多源报道: 'A: https://a.test/x' }));
		expect(item).not.toHaveProperty('hot');
		expect(item).not.toHaveProperty('sources');
	});

	it('reads outlets from rich text, once per link, at most twelve', () => {
		const rich = [
			{ type: 'text', text: 'Bloomberg: ' },
			{ type: 'url', text: 'bloomberg', link: 'https://bloomberg.test/c' },
			{ type: 'text', text: '\nBloomberg again: https://bloomberg.test/c\nBad: javascript:alert(1)' },
		];
		expect(parseSources(rich)).toEqual([
			{ name: 'Bloomberg', url: 'https://bloomberg.test/c', icon: '/v1/icon/site/bloomberg.test' },
		]);
		const many = Array.from({ length: 20 }, (_, n) => `S${n}: https://s.test/${n}`).join('\n');
		expect(parseSources(many)).toHaveLength(12);
	});
});
