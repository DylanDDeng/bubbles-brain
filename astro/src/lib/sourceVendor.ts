/**
 * Which company a 精选阅读 source belongs to, for the small logo beside its name.
 * Logos are the LobeHub set already under static/images/vendors/ (see THIRD_PARTY_NOTICES);
 * a source without one gets a lettered circle instead.
 */

/** Hosts that publish on a company's behalf. */
const HOST_VENDORS: [RegExp, string][] = [
	[/(^|\.)(anthropic\.com|claude\.com|claude\.dev|claude\.ai)$/, 'anthropic'],
	[/(^|\.)openai\.com$/, 'openai'],
	[/(^|\.)(google|blog\.google|deepmind\.google|deepmind\.com)$/, 'google'],
	[/(^|\.)(meta\.com|ai\.meta\.com)$/, 'meta'],
	[/(^|\.)deepseek\.com$/, 'deepseek'],
	[/(^|\.)(qwen\.ai|qwenlm\.github\.io)$/, 'qwen'],
	[/(^|\.)(moonshot\.ai|moonshot\.cn|kimi\.com)$/, 'moonshot'],
	[/(^|\.)(minimax\.io|minimaxi\.com)$/, 'minimax'],
	[/(^|\.)(z\.ai|zhipuai\.cn)$/, 'zai'],
	[/(^|\.)(xiaomi\.com|mi\.com)$/, 'xiaomi'],
];

/** Personal accounts whose posts speak for a company (the link alone cannot tell). */
const HANDLE_VENDORS: Record<string, string> = {
	'@trq212': 'anthropic',
};

/** A readable source for an article without a named one: the host, or the author's handle on X. */
export function sourceFromUrl(sourceUrl: unknown): string {
	if (typeof sourceUrl !== 'string') return '';
	try {
		const url = new URL(sourceUrl);
		const host = url.hostname.replace(/^www\./, '');
		const handle = url.pathname.split('/').filter(Boolean)[0];
		if ((host === 'x.com' || host === 'twitter.com') && handle) return `@${handle}`;
		return host;
	} catch {
		return '';
	}
}

export interface SourceMark {
	/** A vendor slug with a logo under /images/vendors/, or null for a lettered circle. */
	vendor: string | null;
	/** The letter shown when there is no logo. */
	initial: string;
}

export function sourceMark(source: string, sourceUrl?: unknown): SourceMark {
	let vendor: string | null = HANDLE_VENDORS[source.trim().toLowerCase()] ?? null;
	if (!vendor && typeof sourceUrl === 'string') {
		try {
			const host = new URL(sourceUrl).hostname.replace(/^www\./, '');
			vendor = HOST_VENDORS.find(([pattern]) => pattern.test(host))?.[1] ?? null;
		} catch {
			vendor = null;
		}
	}
	const initial = (source.replace(/^@/, '').trim()[0] ?? '·').toUpperCase();
	return { vendor, initial };
}
