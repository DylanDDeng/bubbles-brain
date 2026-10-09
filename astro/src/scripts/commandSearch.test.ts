import { describe, expect, it } from 'vitest';

import type { KnowledgeSearchItem } from '../lib/searchIndex';
import {
	commandSearchMatches,
	commandSearchWithNews,
	normalizeCommandQuery,
} from './commandSearch';

const items: KnowledgeSearchItem[] = [
	{
		key: '/highlights/cursor-icons/',
		href: '/highlights/cursor-icons/',
		title: 'Cursor 图标是怎样做出来的',
		summary: '一套图标设计系统的完整复盘',
		section: 'highlights',
		section_label: '精选阅读',
		date: '2026-08-19',
		tags: ['Cursor', '设计系统'],
		external: false,
		search_text: 'cursor 图标是怎样做出来的 一套图标设计系统的完整复盘 精选阅读 设计系统',
	},
	{
		key: '/codex-tutorials/beginner/',
		href: '/codex-tutorials/beginner/',
		title: 'Codex App 新手入门',
		summary: '从界面到第一次任务',
		section: 'codex-tutorials',
		section_label: 'Codex 教程',
		date: '2026-05-04',
		tags: ['Codex'],
		external: false,
		search_text: 'codex app 新手入门 从界面到第一次任务 codex 教程',
	},
];

describe('command search ranking', () => {
	it('normalizes full-width and surrounding characters', () => {
		expect(normalizeCommandQuery('  Ｃｏｄｅｘ  ')).toBe('codex');
	});

	it('prioritizes title matches and keeps recent items for an empty query', () => {
		expect(commandSearchMatches(items, 'Codex').map((item) => item.href)).toEqual([
			'/codex-tutorials/beginner/',
		]);
		expect(commandSearchMatches(items, '')).toEqual(items);
	});

	it('matches section labels and tags through the shared search text', () => {
		expect(commandSearchMatches(items, '精选阅读')[0]?.title).toContain('Cursor');
		expect(commandSearchMatches(items, '设计系统')[0]?.title).toContain('Cursor');
	});
});

describe('commandSearchWithNews', () => {
	const entry = (key: string, title: string, section = 'highlights') =>
		({
			key,
			href: `/${key}/`,
			title,
			summary: '',
			section,
			section_label: section,
			date: null,
			tags: [],
			external: section === 'ai-news',
			search_text: title.toLowerCase(),
		}) as KnowledgeSearchItem;
	const site = [
		entry('s1', 'OpenAI 官方播客'),
		entry('s2', 'OpenAI Codex 教程'),
		entry('s3', 'Claude'),
	];
	const news = Array.from({ length: 10 }, (_, i) => entry(`n${i}`, `OpenAI 新闻 ${i}`, 'ai-news'));

	it('keeps the knowledge base first and gives news at most three rows', () => {
		const many = [
			...site,
			...Array.from({ length: 8 }, (_, i) => entry(`k${i}`, `OpenAI 文章 ${i}`)),
		];
		expect(commandSearchWithNews(many, news, 'openai').map((item) => item.key)).toEqual([
			's1',
			's2',
			'k0',
			'k1',
			'n0',
			'n1',
			'n2',
		]);
	});

	it('lets news fill rows the knowledge base leaves empty', () => {
		expect(commandSearchWithNews(site, news, 'openai').map((item) => item.key)).toEqual([
			's1',
			's2',
			'n0',
			'n1',
			'n2',
			'n3',
			'n4',
		]);
	});

	it('leaves the recent list to the knowledge base', () => {
		expect(commandSearchWithNews(site, news, '').map((item) => item.key)).toEqual([
			's1',
			's2',
			's3',
		]);
	});
});
