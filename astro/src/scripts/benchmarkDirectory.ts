// Homepage subviews use the shared collection-room controller. Enhance only the
// standalone English directory here; without JavaScript every list stays readable.
let controller: AbortController | undefined;
function init() {
	controller?.abort();
	const directory = document.querySelector<HTMLElement>('[data-benchmark-standalone]');
	if (!directory) return;
	controller = new AbortController();
	const { signal } = controller;
	const views = [...directory.querySelectorAll<HTMLElement>('[data-benchmark-view]')];
	function paint(focus = false) {
		const id = location.hash.replace(/^#bc-/, '');
		const selected = views.find((view) => view.dataset.benchmarkView === id) || views[0];
		views.forEach((view) => {
			view.hidden = view !== selected;
		});
		if (focus)
			(
				selected?.querySelector<HTMLElement>('h2') || directory?.querySelector<HTMLElement>('a')
			)?.focus({ preventScroll: true });
	}
	directory.dataset.enhanced = 'true';
	directory.addEventListener(
		'click',
		(event) => {
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			const link = (event.target as Element).closest<HTMLAnchorElement>('[data-room-pick]');
			if (!link) return;
			event.preventDefault();
			history.pushState(history.state, '', link.getAttribute('href')!);
			paint(true);
		},
		{ signal },
	);
	window.addEventListener('hashchange', () => paint(true), { signal });
	window.addEventListener('popstate', () => paint(true), { signal });
	paint();
}
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => controller?.abort());
init();
