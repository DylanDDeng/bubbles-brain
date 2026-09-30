import { describe, expect, it } from 'vitest';
import { sourceFromUrl, sourceMark } from './sourceVendor';

describe('sourceFromUrl', () => {
	it('names X posts by their author and everything else by host', () => {
		expect(sourceFromUrl('https://x.com/AndrewYNg/status/1')).toBe('@AndrewYNg');
		expect(sourceFromUrl('https://twitter.com/karpathy/status/1')).toBe('@karpathy');
		expect(sourceFromUrl('https://www.vercel.com/blog/x')).toBe('vercel.com');
		expect(sourceFromUrl(undefined)).toBe('');
		expect(sourceFromUrl('nope')).toBe('');
	});
});

describe('sourceMark', () => {
	it('finds the company from the host that published the piece', () => {
		expect(sourceMark('claude.dev · Lance Martin', 'https://claude.dev/blog/x/').vendor).toBe(
			'anthropic',
		);
		expect(sourceMark('', 'https://www.anthropic.com/institute/x').vendor).toBe('anthropic');
		expect(sourceMark('', 'https://platform.claude.com/docs/x').vendor).toBe('anthropic');
		expect(sourceMark('OpenAI Developers', 'https://developers.openai.com/blog/x').vendor).toBe(
			'openai',
		);
	});

	it('knows the personal accounts that speak for a company', () => {
		expect(sourceMark('@trq212', 'https://x.com/trq212/status/1').vendor).toBe('anthropic');
	});

	it('falls back to a letter when there is no logo', () => {
		expect(sourceMark('Awaiting Input', 'https://awaitinginput.substack.com/p/x')).toEqual({
			vendor: null,
			initial: 'A',
		});
		expect(sourceMark('vercel.com', 'https://vercel.com/blog/x')).toEqual({
			vendor: null,
			initial: 'V',
		});
		expect(sourceMark('', 'not a url')).toEqual({ vendor: null, initial: '·' });
	});
});
