import type { BrainPodItem } from './brainpod';
import type { ChangelogItem } from '../data/changelog';

export interface ReadingUpdate {
	item: BrainPodItem;
	recordedAt: string;
}

/** Source publication dates and cosmetic changes never create reading notifications. */
export function buildReadingUpdates(
	items: BrainPodItem[],
	changes: ChangelogItem[],
): ReadingUpdate[] {
	const seen = new Set<string>();
	return [...changes]
		.sort((a, b) => b.date.localeCompare(a.date))
		.flatMap((change) => {
			if (!/^\d{4}-\d{2}-\d{2}$/.test(change.date) || !Number.isFinite(Date.parse(change.date)))
				return [];
			const hrefs =
				change.readingUpdates ??
				(change.type === 'content' ? (change.links ?? []).map((link) => link.href) : []);
			return hrefs.flatMap((href) => {
				const item = items.find((item) => item.key === href || item.href === href);
				if (!item || seen.has(item.key)) return [];
				seen.add(item.key);
				return [{ item, recordedAt: change.date }];
			});
		});
}

export interface ReadingHistory {
	since: string;
	read: Record<string, string>;
}

export function initialReadingHistory(now = new Date()): ReadingHistory {
	return { since: new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10), read: {} };
}

export function unreadReadingUpdates(
	updates: ReadingUpdate[],
	history: ReadingHistory,
	now = new Date(),
): ReadingUpdate[] {
	const today = now.toISOString().slice(0, 10);
	return updates.filter(
		({ item, recordedAt }) =>
			recordedAt >= history.since &&
			recordedAt <= today &&
			(!history.read[item.key] || history.read[item.key] < recordedAt),
	);
}

export function parseReadingHistory(value: string | null, now = new Date()): ReadingHistory {
	try {
		const parsed = JSON.parse(value ?? 'null');
		if (
			!parsed ||
			typeof parsed.since !== 'string' ||
			!/^\d{4}-\d{2}-\d{2}$/.test(parsed.since) ||
			parsed.since > now.toISOString().slice(0, 10)
		)
			return initialReadingHistory(now);
		const read = Object.fromEntries(
			Object.entries(parsed.read ?? {}).filter(
				([key, date]) =>
					key.startsWith('/') &&
					typeof date === 'string' &&
					/^\d{4}-\d{2}-\d{2}$/.test(date) &&
					date <= now.toISOString().slice(0, 10),
			),
		);
		return { since: parsed.since, read: read as Record<string, string> };
	} catch {
		return initialReadingHistory(now);
	}
}
