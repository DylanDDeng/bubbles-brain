import type { ReadingMagazineScene } from './readingMagazineScene';

/** One lazy renderer per visible magazine, with an ordinary static cover underneath. */
function mountMagazines() {
	const controller = new AbortController();
	const scenes = new Map<HTMLElement, ReadingMagazineScene>();
	const visible = new Set<HTMLElement>();
	const started = new Set<HTMLElement>();
	const hosts = Array.from(document.querySelectorAll<HTMLElement>('[data-reading-magazine]'));
	const active = (host: HTMLElement) => visible.has(host) && !host.closest('[inert]');
	function sync(host: HTMLElement) {
		scenes.get(host)?.setVisible(active(host));
		if (!active(host) || started.has(host)) return;
		started.add(host);
		host.dataset.magazineState = 'loading';
		void import('./readingMagazineScene')
			.then(({ createReadingMagazineScene }) => createReadingMagazineScene(host, controller.signal))
			.then((scene) => {
				if (!scene) return;
				if (controller.signal.aborted) {
					scene.dispose();
					return;
				}
				scenes.set(host, scene);
				scene.setVisible(active(host));
				host.dataset.magazineState = 'ready';
			})
			.catch(() => {
				if (!controller.signal.aborted) host.dataset.magazineState = 'fallback';
			});
	}
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const host = entry.target as HTMLElement;
				if (entry.isIntersecting) visible.add(host);
				else visible.delete(host);
				sync(host);
			}
		},
		{ threshold: 0.01 },
	);
	const access = new MutationObserver(() => hosts.forEach(sync));
	hosts.forEach((host) => {
		observer.observe(host);
		const world = host.closest('.brainpod-world');
		if (world) access.observe(world, { attributes: true, attributeFilter: ['inert'] });
	});
	return () => {
		controller.abort();
		observer.disconnect();
		access.disconnect();
		scenes.forEach((scene) => scene.dispose());
		scenes.clear();
	};
}

let cleanup: (() => void) | undefined;
function init() {
	cleanup?.();
	cleanup = mountMagazines();
}
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
	cleanup?.();
	cleanup = undefined;
});
init();
