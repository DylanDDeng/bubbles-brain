/**
 * AI 动态 archive: every story the feed has ever shown, one JSON file per Beijing month in R2
 * (archive/YYYY-MM.json). The feed only covers the last 30 days; once a day falls out of it, the
 * archive keeps its last version, so the Base can be pruned without losing anything on the site.
 */
import { storyKey, type Feed, type FeedDay, type FeedItem } from './feed';

export interface ArchiveMonth {
	month: string;
	updatedAt: string;
	days: FeedDay[];
}

/** The R2 calls the archive makes (a subset of R2Bucket). */
export interface ArchiveBucket {
	get(key: string): Promise<{ text(): Promise<string> } | null>;
	put(key: string, value: string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
	list(options: {
		prefix: string;
		cursor?: string;
	}): Promise<{ objects: { key: string }[]; truncated: boolean; cursor?: string }>;
}

export const MONTH = /^\d{4}-\d{2}$/;

export function monthOf(day: string): string {
	return day.slice(0, 7);
}

export function archiveKey(month: string): string {
	return `archive/${month}.json`;
}

const newestFirst = (a: FeedItem, b: FeedItem) => (a.at === b.at ? a.id.localeCompare(b.id) : a.at < b.at ? 1 : -1);

/**
 * A month's days after this sync. Days before the window are history and stay as archived. Days
 * after the window's first day come from the feed, which is the truth for them (edits and
 * deletions in the Base carry over). The first day is only partly in the window, so its archived
 * stories are kept alongside the feed's, the feed winning for the same story.
 */
export function mergeMonth(month: string, archived: FeedDay[], feed: Feed, windowStart: string): FeedDay[] {
	const days = new Map<string, FeedDay>();
	for (const day of archived) {
		if (monthOf(day.day) === month && day.day <= windowStart) days.set(day.day, day);
	}
	for (const day of feed.days) {
		if (monthOf(day.day) !== month || day.day < windowStart) continue;
		const old = days.get(day.day);
		if (day.day === windowStart && old) {
			const live = new Set(day.items.map((item) => storyKey(item.url)));
			const kept = old.items.filter((item) => !live.has(storyKey(item.url)));
			days.set(day.day, { day: day.day, items: [...day.items, ...kept].sort(newestFirst) });
		} else {
			days.set(day.day, day);
		}
	}
	return [...days.values()].filter((day) => day.items.length).sort((a, b) => (a.day < b.day ? 1 : -1));
}

/**
 * Folds the feed into the monthly files and returns the months that hold days older than the
 * feed's window, newest first: the ones the page lists under the days.
 */
export async function updateArchive(
	bucket: ArchiveBucket,
	feed: Feed,
	windowStart: string,
	now: Date,
): Promise<string[]> {
	const touched = new Set([...feed.days.map((day) => monthOf(day.day)), monthOf(windowStart)]);
	const merged = new Map<string, FeedDay[]>();
	for (const month of touched) {
		const object = await bucket.get(archiveKey(month));
		const archived = object ? ((JSON.parse(await object.text()) as ArchiveMonth).days ?? []) : [];
		const days = mergeMonth(month, archived, feed, windowStart);
		merged.set(month, days);
		if (!days.length || JSON.stringify(days) === JSON.stringify(archived)) continue;
		const file: ArchiveMonth = { month, updatedAt: now.toISOString(), days };
		await bucket.put(archiveKey(month), JSON.stringify(file), {
			httpMetadata: { contentType: 'application/json; charset=utf-8' },
		});
	}

	const months = new Set<string>();
	let cursor: string | undefined;
	do {
		const page = await bucket.list({ prefix: 'archive/', cursor });
		for (const { key } of page.objects) {
			const month = key.slice('archive/'.length, -'.json'.length);
			if (MONTH.test(month)) months.add(month);
		}
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);

	const windowMonth = monthOf(windowStart);
	return [...months]
		.filter((month) =>
			month < windowMonth ? true : month === windowMonth && (merged.get(month) ?? []).some((day) => day.day < windowStart),
		)
		.sort()
		.reverse();
}
