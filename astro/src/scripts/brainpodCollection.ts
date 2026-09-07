import { navigate } from 'astro:transitions/client';
import { brainPodParent, brainPodSections } from '../lib/brainpodSections';

interface CollectionActions {
	select(id: string): void;
	returnToDevice(): void;
	revealCollection(): void;
}

/** Browse section → collection → article, keeping the iPod's collection selection in sync. */
export function mountBrainPodCollection(
	root: HTMLElement,
	signal: AbortSignal,
	actions: CollectionActions,
) {
	const room = root.querySelector<HTMLElement>('[data-collection-room]');
	if (!room) return;
	const panels = Array.from(
		room.querySelectorAll<HTMLElement>('[data-room-panel], [data-room-group]'),
	);
	const index = Array.from(room.querySelectorAll<HTMLAnchorElement>('[data-room-index]'));
	const subviews = Array.from(room.querySelectorAll<HTMLElement>('[data-room-subview]'));
	const views = [...subviews, ...panels];
	const panelId = (panel: HTMLElement) =>
		panel.dataset.roomSubview || panel.dataset.roomGroup || panel.dataset.roomPanel;
	const findView = (id: string) => views.find((panel) => panelId(panel) === id);
	const outerPanel = (panel: HTMLElement) =>
		panel.closest<HTMLElement>('[data-room-panel], [data-room-group]')!;
	let lastCollection = root.dataset.brainpodCollection;
	let view = (brainPodParent(lastCollection || '')?.id as string) || 'tutorials';
	let hashFrame = 0;
	let changingView = false;
	room.classList.add('bc-enhanced');
	function paint() {
		const selectedView = findView(view) || panels[0];
		const selected = selectedView && outerPanel(selectedView);
		if (!selected) return;
		panels.forEach((panel) => {
			panel.hidden = panel !== selected;
		});
		subviews.forEach((panel) => {
			panel.hidden = panel !== selectedView;
		});
		const heading = selectedView.querySelector<HTMLElement>('.bc-panel-heading h2');
		if (heading?.id) selected.setAttribute('aria-labelledby', heading.id);
		const collection = panelId(selected)!;
		const section =
			brainPodSections.find((section) => section.id === collection) || brainPodParent(collection);
		index.forEach((link) => {
			if (link.dataset.roomSection === section?.id) link.setAttribute('aria-current', 'true');
			else link.removeAttribute('aria-current');
		});
		room!.dataset.roomView = view;
	}
	function selectView(id: string) {
		const selected = findView(id);
		if (!selected) return;
		view = id;
		const outerId = panelId(outerPanel(selected))!;
		const section = brainPodSections.find((section) => section.id === outerId);
		const collection = section ? section.children[0] : outerId;
		if (root.dataset.brainpodCollection !== collection) actions.select(collection);
		lastCollection = root.dataset.brainpodCollection;
		paint();
	}
	function syncHash(initial = false) {
		const id = location.hash.replace(/^#bc-/, '');
		if (!findView(id)) return;
		selectView(id);
		if (!changingView && (initial || root.querySelector<HTMLElement>('.brainpod-world')?.inert)) {
			cancelAnimationFrame(hashFrame);
			hashFrame = requestAnimationFrame(() => {
				if (!signal.aborted) actions.revealCollection();
			});
		}
	}
	const selection = new MutationObserver(() => {
		if (root.dataset.brainpodCollection === lastCollection) return;
		lastCollection = root.dataset.brainpodCollection;
		if (lastCollection) view = lastCollection;
		paint();
	});
	selection.observe(root, { attributes: true, attributeFilter: ['data-brainpod-collection'] });
	paint();
	syncHash(true);
	window.addEventListener('hashchange', () => syncHash(), { signal });
	// Restore the room after Astro has applied an older entry's scroll position.
	window.addEventListener('popstate', () => syncHash(true), { signal });
	room.addEventListener(
		'click',
		(event) => {
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			const target = event.target as Element;
			if (target.closest('[data-room-return]')) {
				event.preventDefault();
				if (location.hash.startsWith('#bc-') || location.hash === '#knowledge-world')
					history.replaceState(history.state, '', location.pathname + location.search);
				actions.returnToDevice();
				return;
			}
			const pick = target.closest<HTMLAnchorElement>('[data-room-section], [data-room-pick]');
			const id = pick?.dataset.roomSection || pick?.dataset.roomPick;
			if (!pick || !id || !findView(id)) return;
			event.preventDefault();
			const scroll = { left: window.scrollX, top: window.scrollY, behavior: 'instant' as const };
			selectView(id);
			changingView = true;
			// Astro owns history; compensate its native fragment jump so the directory changes in place.
			void navigate(pick.getAttribute('href')!, { history: 'push' }).then(() => {
				if (signal.aborted) return;
				window.scrollTo(scroll);
				changingView = false;
				if (!pick.hasAttribute('data-room-index')) {
					findView(view)
						?.querySelector<HTMLElement>('.bc-panel-heading h2')
						?.focus({ preventScroll: true });
				}
			});
		},
		{ signal },
	);
	signal.addEventListener(
		'abort',
		() => {
			selection.disconnect();
			cancelAnimationFrame(hashFrame);
		},
		{ once: true },
	);
}
