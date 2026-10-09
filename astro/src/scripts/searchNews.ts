/**
 * /search/: adds the AI 动态 stories to the result list once the feed arrives, in the same markup
 * as the built rows, then asks knowledge-search.js to filter again. They stay hidden until there
 * is a query or the AI 动态 filter is chosen, so the full listing is not swamped by news.
 */
import { loadNewsFeed, monthDay, NEWS_FRESH_FOR, newsSearchItems } from '../lib/aiNews';

function row(item: ReturnType<typeof newsSearchItems>[number]): HTMLLIElement {
	const li = document.createElement('li');
	li.dataset.knowledgeSearchItem = '';
	li.dataset.section = item.section;
	li.dataset.search = item.search_text;
	li.dataset.live = '';
	li.hidden = true;
	const link = document.createElement('a');
	link.className = 'knowledge-result';
	link.href = item.href;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	const meta = document.createElement('span');
	meta.className = 'knowledge-result__meta';
	meta.textContent = item.date
		? `${item.section_label} · ${monthDay(item.date.slice(0, 10))}`
		: item.section_label;
	const title = document.createElement('span');
	title.className = 'knowledge-result__title';
	title.textContent = `${item.title} ↗`;
	link.append(meta, title);
	li.append(link);
	return li;
}

function addNews(root: HTMLElement) {
	if (root.dataset.newsReady) return;
	root.dataset.newsReady = 'true';
	const list = root.querySelector<HTMLElement>('[data-knowledge-results]');
	const url = root.dataset.newsUrl;
	if (!list || !url) return;
	void loadNewsFeed(url, NEWS_FRESH_FOR).then((feed) => {
		if (!feed) return;
		list.append(...newsSearchItems(feed).map(row));
		root.dispatchEvent(new CustomEvent('knowledge-search:refresh'));
	});
}

document.addEventListener('astro:page-load', () => {
	const root = document.querySelector<HTMLElement>('[data-knowledge-search]');
	if (root) addNews(root);
});
