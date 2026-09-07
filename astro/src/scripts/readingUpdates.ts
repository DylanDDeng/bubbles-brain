import {
	initialReadingHistory,
	parseReadingHistory,
	unreadReadingUpdates,
	type ReadingUpdate,
} from '../lib/readingUpdates';

const STORAGE_KEY = 'bubble-reading-history-v1';
let fallback = initialReadingHistory();

function history() {
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return value ? parseReadingHistory(value) : fallback;
	} catch {
		return fallback;
	}
}

function save(value: ReturnType<typeof history>) {
	fallback = value;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	} catch {
		/* Optional local preferences. */
	}
}

export function markReadingUpdateSeen(key: string) {
	const value = history();
	value.read[key] = new Date().toISOString().slice(0, 10);
	save(value);
	refreshReadingIndicators();
}

export function refreshReadingIndicators() {
	const payload = document.querySelector('[data-brainpod-library]');
	if (!payload?.textContent) return;
	let updates: ReadingUpdate[];
	try {
		updates = JSON.parse(payload.textContent).updates ?? [];
	} catch {
		return;
	}
	const unread = unreadReadingUpdates(updates, history());
	for (const dot of document.querySelectorAll<HTMLElement>('[data-update-sections]')) {
		const sections = dot.dataset.updateSections?.split(' ') ?? [];
		dot.hidden = !unread.some((update) => sections.includes(update.item.section));
	}
}

function init() {
	save(history());
	if (document.querySelector('.legacy-article .article-content, .concept-detail')) {
		markReadingUpdateSeen(location.pathname.replace(/^\/en\//, '/'));
	}
	refreshReadingIndicators();
}

document.addEventListener('astro:page-load', init);
window.addEventListener('pageshow', refreshReadingIndicators);
window.addEventListener('storage', (event) => {
	if (event.key === STORAGE_KEY || event.key === null) refreshReadingIndicators();
});
document.addEventListener('click', (event) => {
	const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
	if (!link) return;
	const payload = document.querySelector('[data-brainpod-library]');
	if (!payload?.textContent) return;
	try {
		const updates: ReadingUpdate[] = JSON.parse(payload.textContent).updates ?? [];
		const update = updates.find((update) => update.item.external && update.item.href === link.href);
		if (update) markReadingUpdateSeen(update.item.key);
	} catch {
		/* Invalid optional metadata must not interrupt navigation. */
	}
});
init();
