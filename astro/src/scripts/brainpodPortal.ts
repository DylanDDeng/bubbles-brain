import {
	brainPodPortalFrame,
	brainPodPortalPageMode,
	brainPodPortalProgress,
	brainPodPortalWorldState,
	portalEase,
} from '../lib/brainpodPortal';
import type { BrainPodScene } from './brainpodScene';
import { mountPortalPreview } from './brainpodPortalPreview';

/** Pin only the entrance. The real homepage returns to normal document flow at the seam. */
export function mountBrainPodPortal(
	root: HTMLElement,
	getScene: () => BrainPodScene | undefined,
	signal: AbortSignal,
) {
	if (!root.hasAttribute('data-brainpod-portal')) return;
	const track = root.querySelector<HTMLElement>('.brainpod-entrance-track')!;
	const pin = root.querySelector<HTMLElement>('.brainpod-entrance-pin')!;
	const poster = root.querySelector<HTMLElement>('.curiosity-poster')!;
	const stage = root.querySelector<HTMLElement>('#brainpod-stage')!;
	const world = root.querySelector<HTMLElement>('.brainpod-world')!;
	const content = root.querySelector<HTMLElement>('.brainpod-world-content')!;
	const enter = root.querySelector<HTMLAnchorElement>('.portal-enter')!;
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	const unlockHint = document.createElement('span');
	unlockHint.className = 'portal-unlock-hint';
	unlockHint.setAttribute('role', 'status');
	unlockHint.setAttribute('aria-live', 'polite');
	poster.append(unlockHint);
	let locked = false;
	let lockedScrollY = 0;
	let touchY = 0;
	function requestUnlock() {
		if (!locked) return false;
		if (!unlockHint.textContent) unlockHint.textContent = '请先按 ENTER 或拨动顶部 Lock 开关解锁';
		enter.style.visibility = 'hidden';
		return true;
	}
	function isSeparateControl(target: EventTarget | null) {
		return (
			target instanceof Element &&
			!!target.closest('dialog, [role="dialog"], input, textarea, select, [contenteditable="true"]')
		);
	}
	let raf = 0;
	let enabled = false;
	let needsMeasure = true;
	let start = 0;
	let end = 0;
	let viewport = { width: 0, height: 0 };
	let previous = { scale: 1, x: 0, y: 0 };
	let stagePose = { rotate: 0, x: 0, y: 0 };
	let lastProgress = -1;
	let worldHeight = 0;
	let initialized = false;
	let pendingFocus: HTMLElement | undefined;
	const preview = mountPortalPreview(content, signal, {
		isWindowed: () => brainPodPortalPageMode(lastProgress, enabled, locked) === 'windowed',
		isFullscreen: () => brainPodPortalPageMode(lastProgress, enabled, locked) === 'fullscreen',
		scrollBy(delta) {
			window.scrollBy({ top: delta, behavior: 'instant' });
			schedule();
		},
	});
	function restorePosterFocus() {
		if (pendingFocus && !poster.inert) {
			pendingFocus.focus({ preventScroll: true });
			pendingFocus = undefined;
		}
	}

	function setActive(active: boolean) {
		if (root.hasAttribute('data-portal-active') === active) return;
		if (active) {
			const style = getComputedStyle(stage);
			const [x, y] = style.translate.split(' ').map(parseFloat);
			stagePose = { rotate: parseFloat(style.rotate) || 0, x: x || 0, y: y || 0 };
		}
		root.toggleAttribute('data-portal-active', active);
		root.dispatchEvent(new Event('brainpod:portal-state'));
	}
	function clear() {
		setActive(false);
		root.classList.remove('portal-ready');
		delete root.dataset.portalProgress;
		poster.style.removeProperty('transform');
		poster.style.removeProperty('visibility');
		poster.inert = false;
		restorePosterFocus();
		world.inert = locked;
		if (locked) world.setAttribute('aria-hidden', 'true');
		else world.removeAttribute('aria-hidden');
		world.style.cssText = '';
		content.style.removeProperty('transform');
		content.style.removeProperty('--portal-page-height');
		getScene()?.setEntranceProgress(0);
		previous = { scale: 1, x: 0, y: 0 };
		lastProgress = -1;
		preview.sync();
	}
	function measure() {
		viewport = { width: root.clientWidth, height: window.innerHeight };
		const height = poster.offsetHeight;
		const top = track.getBoundingClientRect().top + window.scrollY;
		const readable = Math.max(0, height - viewport.height);
		const distance = viewport.height * (viewport.width <= 720 ? 1.65 : 2.1);
		start = top + readable;
		end = start + distance;
		worldHeight = world.offsetHeight;
		root.style.setProperty('--portal-track-height', `${height + distance}px`);
		root.style.setProperty('--portal-pin-top', `${-readable}px`);
		root.style.setProperty('--portal-world-overlap', `${-Math.min(height, viewport.height)}px`);
		needsMeasure = false;
	}
	function paint() {
		raf = 0;
		if (!enabled || signal.aborted || document.hidden) return;
		const measuring = needsMeasure;
		if (measuring) measure();
		const progress = brainPodPortalProgress(window.scrollY, start, end);
		if (!measuring && progress === lastProgress) return;
		lastProgress = progress;
		root.dataset.portalProgress = progress.toFixed(4);
		setActive(progress > 0);
		// Keep ambient CSS motion and model orientation on one deterministic scroll timeline.
		const facing = portalEase(0, 0.28, progress);
		root.style.setProperty('--portal-stage-rotate', `${stagePose.rotate * (1 - facing)}deg`);
		root.style.setProperty(
			'--portal-stage-translate',
			`${stagePose.x * (1 - facing)}px ${stagePose.y * (1 - facing)}px`,
		);
		getScene()?.setEntranceProgress(facing);
		root.style.setProperty('--portal-decor-opacity', String(1 - portalEase(0.03, 0.4, progress)));
		root.style.setProperty('--portal-lcd-opacity', String(1 - portalEase(0.29, 0.47, progress)));
		const entered = progress >= 1;
		const worldState = brainPodPortalWorldState(progress, locked);
		// Keep the physical controls usable until the LCD starts revealing the destination.
		poster.inert = progress >= 0.3;
		restorePosterFocus();
		poster.style.visibility = entered ? 'hidden' : '';
		world.inert = !worldState.interactive;
		world.setAttribute('aria-hidden', String(!worldState.interactive));
		if (entered) {
			world.style.cssText = '';
			content.style.removeProperty('transform');
			content.style.removeProperty('--portal-page-height');
			preview.sync();
			return;
		}
		const lcd = stage.querySelector<HTMLElement>('.lcd');
		if (!lcd) return;
		const bounds = lcd.getBoundingClientRect();
		const pinBounds = pin.getBoundingClientRect();
		const screen = {
			x: (bounds.left - pinBounds.left - previous.x) / previous.scale,
			y: (bounds.top - pinBounds.top - previous.y) / previous.scale,
			width: bounds.width / previous.scale,
			height: bounds.height / previous.scale,
		};
		if (screen.width < 1 || screen.height < 1) return;
		const camera = brainPodPortalFrame(progress, screen, viewport, pinBounds.top);
		poster.style.transform = `translate3d(${camera.x}px,${camera.y}px,0) scale(${camera.scale})`;
		previous = camera;
		const aperture = camera.window;
		const release = portalEase(0.68, 1, progress);
		const scale = Math.min(1, aperture.width / viewport.width);
		const visibleHeight =
			Math.min(viewport.height, aperture.y + aperture.height) - Math.max(0, aperture.y);
		// The child document must fit the aperture; focusing it must not scroll the camera.
		content.style.setProperty('--portal-page-height', `${Math.max(1, visibleHeight / scale)}px`);
		// A landscape LCD opens vertically on phones; never carry its negative left edge
		// into the actual portrait page, where it would cut off headings and search.
		content.style.transform = `translate3d(${Math.max(0, aperture.x)}px,${Math.max(0, aperture.y)}px,0) scale(${scale})`;
		world.style.transform = `translateY(${window.scrollY - end}px)`;
		world.style.opacity = String(worldState.opacity);
		world.style.visibility = worldState.visible ? 'visible' : 'hidden';
		world.style.clipPath = `inset(${Math.max(0, aperture.y)}px ${Math.max(0, viewport.width - aperture.x - aperture.width)}px ${Math.max(0, worldHeight - Math.min(viewport.height, aperture.y + aperture.height))}px ${Math.max(0, aperture.x)}px round ${Math.max(0, 5 * camera.scale * (1 - release))}px)`;
	}
	function schedule() {
		if (!raf && enabled && !signal.aborted) raf = requestAnimationFrame(paint);
	}
	function refresh() {
		needsMeasure = true;
		schedule();
	}
	function sync() {
		const next = !reduced.matches && root.dataset.motion !== 'off';
		if (next === enabled) return;
		const worldTop = world.getBoundingClientRect().top;
		const keepReading = initialized && (enabled ? lastProgress === 1 : worldTop <= 1);
		const readingOffset = Math.max(0, enabled ? window.scrollY - end : -worldTop);
		enabled = next;
		initialized = true;
		if (enabled) {
			root.classList.add('portal-ready');
			measure();
			if (keepReading) window.scrollTo({ top: end + readingOffset, behavior: 'instant' });
			paint();
		} else {
			clear();
			if (keepReading)
				window.scrollTo({
					top: world.getBoundingClientRect().top + window.scrollY + readingOffset,
					behavior: 'instant',
				});
		}
	}
	window.addEventListener(
		'scroll',
		() => {
			// Also catch scrollbar dragging, anchor navigation and keyboard scrolling.
			if (locked && window.scrollY > lockedScrollY) {
				requestUnlock();
				window.scrollTo({ top: lockedScrollY, behavior: 'instant' });
			}
			schedule();
		},
		{ passive: true, signal },
	);
	window.addEventListener(
		'wheel',
		(event) => {
			if (event.deltaY > 0 && !event.ctrlKey && !isSeparateControl(event.target) && requestUnlock())
				event.preventDefault();
		},
		{ passive: false, signal },
	);
	window.addEventListener(
		'touchstart',
		(event) => {
			touchY = event.touches[0]?.clientY ?? 0;
		},
		{ passive: true, signal },
	);
	window.addEventListener(
		'touchmove',
		(event) => {
			const nextY = event.touches[0]?.clientY ?? touchY;
			if (
				event.touches.length === 1 &&
				nextY < touchY &&
				!isSeparateControl(event.target) &&
				requestUnlock()
			)
				event.preventDefault();
			touchY = nextY;
		},
		{ passive: false, signal },
	);
	window.addEventListener(
		'keydown',
		(event) => {
			if (isSeparateControl(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
			if (
				event.key === ' ' &&
				event.target instanceof Element &&
				event.target.closest('button, a, [role="switch"]')
			)
				return;
			if (['ArrowDown', 'PageDown', 'End', ' '].includes(event.key) && requestUnlock())
				event.preventDefault();
		},
		{ capture: true, signal },
	);
	window.addEventListener('resize', refresh, { passive: true, signal });
	document.addEventListener('visibilitychange', schedule, { signal });
	reduced.addEventListener('change', sync, { signal });
	enter.addEventListener(
		'click',
		(event) => {
			event.preventDefault();
			if (requestUnlock()) return;
			// A keyboard-accessible shortcut, including when motion is disabled.
			window.scrollTo({
				top: enabled ? end : world.getBoundingClientRect().top + window.scrollY,
				behavior: 'instant',
			});
			paint();
			world.parentElement?.focus({ preventScroll: true });
		},
		{ signal },
	);
	const resize = new ResizeObserver(refresh);
	resize.observe(poster);
	resize.observe(world);
	const state = new MutationObserver(() => {
		sync();
		refresh();
	});
	state.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
	state.observe(stage, { attributes: true, attributeFilter: ['data-renderer'] });
	// An in-page target may land beyond the entrance before the model finishes loading.
	void document.fonts.ready.then(() => {
		if (!signal.aborted) refresh();
	});
	sync();
	signal.addEventListener(
		'abort',
		() => {
			cancelAnimationFrame(raf);
			resize.disconnect();
			state.disconnect();
			locked = false;
			unlockHint.remove();
			enter.style.removeProperty('visibility');
			clear();
		},
		{ once: true },
	);
	return {
		setLocked(value: boolean) {
			locked = value;
			unlockHint.textContent = '';
			enter.style.removeProperty('visibility');
			if (locked) {
				preview.close();
				// Return a partially zoomed device to its fully usable entrance pose.
				lockedScrollY = track.getBoundingClientRect().top + window.scrollY;
				window.scrollTo({ top: lockedScrollY, behavior: 'instant' });
			}
			if (enabled) {
				measure();
				paint();
			} else {
				world.inert = locked;
				if (locked) world.setAttribute('aria-hidden', 'true');
				else world.removeAttribute('aria-hidden');
			}
		},
		enterRoom(element: HTMLElement) {
			if (requestUnlock()) return;
			measure();
			// Use the target's layout position while the room is projected inside the LCD.
			let offset = 0;
			let current: HTMLElement | null = element;
			while (current && current !== world.parentElement) {
				offset += current.offsetTop;
				current = current.offsetParent as HTMLElement | null;
			}
			const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
			const top = enabled ? end : world.getBoundingClientRect().top + window.scrollY;
			window.scrollTo({ top: top + offset - margin, behavior: 'instant' });
			paint();
		},
		reveal(element: HTMLElement) {
			if (!enabled) {
				element.scrollIntoView({
					behavior: reduced.matches ? 'instant' : 'smooth',
					block: 'center',
				});
				return;
			}
			measure();
			const rect = element.getBoundingClientRect();
			const pinTop = pin.getBoundingClientRect().top;
			const trackTop = track.getBoundingClientRect().top + window.scrollY;
			const originalCenter = (rect.top - pinTop - previous.y + rect.height / 2) / previous.scale;
			// Discoveries and playlists reveal their original poster controls without
			// accidentally advancing the camera into an inert part of the transition.
			const top = Math.max(
				trackTop,
				Math.min(Math.floor(start), trackTop + originalCenter - viewport.height / 2),
			);
			if (element.hasAttribute('tabindex')) pendingFocus = element;
			window.scrollTo({ top, behavior: 'smooth' });
		},
	};
}
