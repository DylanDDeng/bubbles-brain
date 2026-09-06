/** A shared, pausable motion layer. The 3D model and its DOM controls move together. */
export function mountBrainPodMotion(root: HTMLElement, signal: AbortSignal) {
	const poster = root.querySelector<HTMLElement>('.curiosity-poster')!;
	const toggle = root.querySelector<HTMLButtonElement>('#poster-motion-toggle')!;
	const menu = root.querySelector<HTMLDetailsElement>('#poster-menu')!;
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
	let modalOpen = !!document.querySelector('dialog[open]');
	const storageKey = 'bubble-brainpod-motion';
	let enabled = true;
	try {
		enabled = sessionStorage.getItem(storageKey) !== 'paused';
	} catch {
		/* Motion does not require storage. */
	}
	let visible = true,
		raf = 0,
		x = 0,
		y = 0,
		targetX = 0,
		targetY = 0;
	const active = () =>
		enabled &&
		!reduced.matches &&
		visible &&
		!document.hidden &&
		!menu.open &&
		!modalOpen &&
		!root.hasAttribute('data-portal-active');
	const animations = new Set<Animation>();
	function paint() {
		root.style.setProperty('--pointer-x', x.toFixed(4));
		root.style.setProperty('--pointer-y', y.toFixed(4));
	}
	function frame() {
		raf = 0;
		if (!active() || signal.aborted) return;
		x += (targetX - x) * 0.075;
		y += (targetY - y) * 0.075;
		paint();
		if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.001) schedule();
	}
	function schedule() {
		if (!raf && active()) raf = requestAnimationFrame(frame);
	}
	function sync() {
		root.dataset.motion = enabled && !reduced.matches ? 'on' : 'off';
		root.dataset.motionRunning = String(active());
		toggle.hidden = false;
		toggle.disabled = reduced.matches;
		toggle.setAttribute('aria-pressed', String(enabled && !reduced.matches));
		toggle.setAttribute(
			'aria-label',
			reduced.matches ? '已按系统偏好减少动态效果' : enabled ? '暂停画面动效' : '开启画面动效',
		);
		toggle.querySelector('span')!.textContent = reduced.matches
			? '静静地，保持好奇'
			: enabled
				? '让时间慢一点'
				: '让好奇心动起来';
		toggle.querySelector('i')!.className =
			enabled && !reduced.matches ? 'ph ph-pause' : 'ph ph-play';
		if (!active()) {
			cancelAnimationFrame(raf);
			raf = 0;
			animations.forEach((animation) => animation.cancel());
			animations.clear();
		}
		if (!enabled || reduced.matches) {
			x = y = targetX = targetY = 0;
			paint();
		} else schedule();
	}
	poster.addEventListener(
		'pointermove',
		(event) => {
			if (!active() || !finePointer.matches || event.pointerType !== 'mouse' || event.buttons)
				return;
			const bounds = poster.getBoundingClientRect();
			targetX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
			targetY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));
			schedule();
		},
		{ signal, passive: true },
	);
	poster.addEventListener(
		'pointerleave',
		() => {
			targetX = targetY = 0;
			schedule();
		},
		{ signal },
	);
	toggle.addEventListener(
		'click',
		() => {
			enabled = !enabled;
			try {
				sessionStorage.setItem(storageKey, enabled ? 'playing' : 'paused');
			} catch {
				/* Optional. */
			}
			sync();
		},
		{ signal },
	);
	menu.addEventListener('toggle', sync, { signal });
	root.addEventListener('brainpod:portal-state', sync, { signal });
	menu.addEventListener(
		'keydown',
		(event) => {
			if (event.key !== 'Escape' || !menu.open) return;
			event.preventDefault();
			menu.open = false;
			menu.querySelector('summary')?.focus();
		},
		{ signal },
	);
	document.addEventListener(
		'pointerdown',
		(event) => {
			if (!menu.contains(event.target as Node)) menu.open = false;
		},
		{ signal },
	);
	document.addEventListener('visibilitychange', sync, { signal });
	reduced.addEventListener('change', sync, { signal });
	const observer = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		sync();
	});
	observer.observe(poster);
	const modalObserver = new MutationObserver(() => {
		modalOpen = !!document.querySelector('dialog[open]');
		sync();
	});
	document
		.querySelectorAll('dialog')
		.forEach((dialog) =>
			modalObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] }),
		);
	root.classList.add('motion-ready');
	sync();
	signal.addEventListener(
		'abort',
		() => {
			cancelAnimationFrame(raf);
			observer.disconnect();
			modalObserver.disconnect();
			animations.forEach((animation) => animation.cancel());
			root.classList.remove('motion-ready');
		},
		{ once: true },
	);
	return {
		discover() {
			if (!active()) return;
			const stamp = root.querySelector<HTMLElement>('.surprise-stamp > span')!;
			const animation = stamp.animate(
				[
					{ transform: 'scale(1) rotate(0deg)' },
					{ transform: 'scale(0.82) rotate(-12deg)', offset: 0.25 },
					{ transform: 'scale(1.13) rotate(5deg)', offset: 0.65 },
					{ transform: 'scale(1) rotate(0deg)' },
				],
				{ duration: 540, easing: 'cubic-bezier(.2,.8,.2,1)' },
			);
			animations.add(animation);
			animation.addEventListener('finish', () => animations.delete(animation), { once: true });
		},
	};
}
