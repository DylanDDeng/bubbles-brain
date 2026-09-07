import { navigate } from 'astro:transitions/client';

/** Keep ordinary pages inside the physical screen until its camera reaches full size. */
export function mountPortalPreview(
	content: HTMLElement,
	signal: AbortSignal,
	actions: { isWindowed(): boolean; isFullscreen(): boolean; scrollBy(delta: number): void },
) {
	let frame: HTMLIFrameElement | undefined;
	let surface: HTMLElement | undefined;
	let frameEvents: AbortController | undefined;
	let href = '';
	let ready = false;
	let promoting = false;
	let timeout = 0;
	const isEnglish = document.documentElement.lang === 'en';
	const original = Array.from(content.children) as HTMLElement[];

	function close() {
		clearTimeout(timeout);
		frameEvents?.abort();
		frame?.remove();
		surface?.remove();
		frame = undefined;
		surface = undefined;
		ready = false;
		promoting = false;
		content.classList.remove('portal-preview-open');
		original.forEach((element) => (element.inert = false));
	}
	function promote() {
		if (!frame || !ready || promoting || !actions.isFullscreen() || signal.aborted) return;
		promoting = true;
		href = frame.contentWindow?.location.href || href;
		const readingOffset = frame.contentWindow?.scrollY || 0;
		void navigate(href)
			.then(() => {
				if (readingOffset > 0) window.scrollTo({ top: readingOffset, behavior: 'instant' });
			})
			.catch(() => {
				promoting = false;
				// The real URL remains usable if the client router cannot complete its swap.
				window.location.assign(href);
			});
	}
	function bindFrame() {
		const doc = frame?.contentDocument;
		const win = frame?.contentWindow;
		if (!doc || !win || win.location.href === 'about:blank') return;
		frameEvents?.abort();
		frameEvents = new AbortController();
		const options = { capture: true, signal: frameEvents.signal };
		function pageReady() {
			if (!frame || !surface) return;
			// Keep a single visible scroll surface while the page lives inside the LCD.
			doc!.documentElement.style.overflow = 'hidden';
			doc!.documentElement.style.scrollbarGutter = 'stable';
			href = win!.location.href;
			frame.title = doc!.title;
			ready = true;
			clearTimeout(timeout);
			surface.dataset.ready = 'true';
			surface.removeAttribute('aria-busy');
			promote();
		}
		doc.addEventListener('astro:page-load', pageReady, options);
		doc.addEventListener(
			'click',
			(event) => {
				const link = (event.target as Element | null)?.closest?.('a');
				if (
					!link ||
					event.button ||
					event.metaKey ||
					event.ctrlKey ||
					event.shiftKey ||
					event.altKey ||
					link.target === '_blank' ||
					link.hasAttribute('download')
				)
					return;
				const url = new URL(link.href, href);
				if (url.origin !== location.origin) {
					event.preventDefault();
					event.stopImmediatePropagation();
					window.open(url.href, '_blank', 'noopener,noreferrer');
				} else if (url.pathname === location.pathname) {
					event.preventDefault();
					event.stopImmediatePropagation();
					close();
					content.querySelector<HTMLElement>('[data-room-return]')?.focus({ preventScroll: true });
				} else if (
					['/', '/en/', '/preview/brainpod/'].includes(url.pathname) ||
					/^\/(?:en\/)?(?:auth|login)(?:\/|$)/.test(url.pathname)
				) {
					event.preventDefault();
					event.stopImmediatePropagation();
					void navigate(url.href);
				}
			},
			options,
		);
		// Events in a child document do not bubble to the entrance's scroll surface.
		doc.addEventListener(
			'wheel',
			(event) => {
				if (!actions.isWindowed() || event.ctrlKey) return;
				event.preventDefault();
				const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
				actions.scrollBy(event.deltaY * unit);
			},
			{ ...options, passive: false },
		);
		let touchY = 0;
		doc.addEventListener(
			'touchstart',
			(event) => {
				touchY = event.touches[0]?.clientY ?? 0;
			},
			{ ...options, passive: true },
		);
		doc.addEventListener(
			'touchmove',
			(event) => {
				if (!actions.isWindowed() || event.touches.length !== 1) return;
				const y = event.touches[0].clientY;
				event.preventDefault();
				actions.scrollBy(touchY - y);
				touchY = y;
			},
			{ ...options, passive: false },
		);
		doc.addEventListener(
			'keydown',
			(event) => {
				const target = event.target as Element | null;
				if (event.key === 'Escape' && !doc.querySelector('dialog[open], [role="dialog"]')) {
					event.preventDefault();
					close();
					content.querySelector<HTMLElement>('[data-room-return]')?.focus({ preventScroll: true });
					return;
				}
				if (
					!actions.isWindowed() ||
					event.metaKey ||
					event.ctrlKey ||
					event.altKey ||
					target?.closest?.('input, textarea, select, [contenteditable], button, a')
				)
					return;
				const delta = {
					ArrowDown: 40,
					ArrowUp: -40,
					PageDown: innerHeight * 0.8,
					PageUp: -innerHeight * 0.8,
					End: innerHeight * 3,
					Home: -innerHeight * 3,
					' ': innerHeight * 0.8,
				}[event.key];
				if (delta === undefined) return;
				event.preventDefault();
				actions.scrollBy(event.shiftKey && event.key === ' ' ? -delta : delta);
			},
			options,
		);
		pageReady();
	}
	function open(url: URL) {
		close();
		href = url.href;
		surface = document.createElement('div');
		surface.className = 'portal-page-preview';
		surface.setAttribute('aria-busy', 'true');
		const status = document.createElement('div');
		status.className = 'portal-preview-status';
		status.setAttribute('role', 'status');
		status.textContent = isEnglish ? 'Loading…' : '正在打开…';
		const back = document.createElement('button');
		back.className = 'portal-preview-back';
		back.textContent = isEnglish ? 'Back' : '返回目录';
		back.addEventListener('click', close, { signal });
		frame = document.createElement('iframe');
		frame.className = 'portal-page-frame';
		frame.title = isEnglish ? 'Reading preview' : '阅读内容';
		frame.addEventListener('load', bindFrame, { signal });
		surface.append(status, back, frame);
		original.forEach((element) => (element.inert = true));
		content.classList.add('portal-preview-open');
		content.append(surface);
		frame.src = href;
		timeout = window.setTimeout(() => {
			if (ready || !surface) return;
			surface.dataset.failed = 'true';
			status.textContent = isEnglish ? 'Unable to load this page.' : '暂时未能打开这篇内容';
		}, 15000);
	}
	content.addEventListener(
		'click',
		(event) => {
			if (
				!actions.isWindowed() ||
				event.defaultPrevented ||
				event.button ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			)
				return;
			const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
			if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
			const url = new URL(link.href, location.href);
			if (
				url.origin !== location.origin ||
				url.pathname === location.pathname ||
				!url.pathname.endsWith('/') ||
				/^\/(?:en\/)?(?:auth|login)(?:\/|$)/.test(url.pathname) ||
				url.pathname === '/en/'
			)
				return;
			event.preventDefault();
			event.stopImmediatePropagation();
			open(url);
		},
		{ capture: true, signal },
	);
	signal.addEventListener('abort', close, { once: true });
	return { sync: promote, close };
}
