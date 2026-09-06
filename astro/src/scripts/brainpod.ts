import { navigate } from 'astro:transitions/client';
import { CAT_CURATOR_AVATAR } from '../data/catCurator';
import { formatBrainPodClock } from '../lib/brainpodClock';
import type { BrainPodCollection, BrainPodItem, BrainPodLibrary } from '../lib/brainpod';
import { createBrainPodDiscoveryOrder } from '../lib/brainpodSeed';
import { createBrainPodScene, type BrainPodScene } from './brainpodScene';
import { mountBrainPodMotion } from './brainpodMotion';
import { mountBrainPodPortal } from './brainpodPortal';
import { mountBrainPodCollection } from './brainpodCollection';

type Row = BrainPodCollection | BrainPodItem;
interface MenuPage {
	title: string;
	rows: Row[];
	selected: number;
	key: string;
	index?: number;
}
interface SavedState {
	pages?: { key: string; selected: number }[];
	detail?: string;
	finish?: string;
	discoveryIndex?: number;
}
const isCollection = (row: Row): row is BrainPodCollection => 'kind' in row;
const escapeHTML = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
	);
const STORAGE_KEY = 'bubble-brainpod-navigation-v3';

export function mountBrainPod(root: HTMLElement): () => void {
	const payload = root.querySelector('[data-brainpod-library]');
	if (!payload?.textContent) return () => {};
	const library: BrainPodLibrary = JSON.parse(payload.textContent);
	const { items, collections, playlists, featured } = library;
	const deviceOnly = root.classList.contains('brainpod--device');
	// The device entrance starts as a browser, independently of the old featured-paper view.
	const storageKey = deviceOnly ? 'bubble-brainpod-navigation-v4' : STORAGE_KEY;
	const discoveryOrder = createBrainPodDiscoveryOrder(items, Number(root.dataset.seed) || 483101);
	let discoveryIndex = 0;
	const controller = new AbortController(),
		{ signal } = controller;
	const $ = <T extends HTMLElement = HTMLElement>(id: string) => {
		const element = root.querySelector<T>(`#${id}`);
		if (!element) throw new Error(`Missing BrainPod element: ${id}`);
		return element;
	};
	const stage = $('brainpod-stage');
	delete stage.dataset.ready;
	stage.setAttribute('aria-busy', 'true');
	stage.tabIndex = -1;
	const motion = mountBrainPodMotion(root, signal);
	const state: {
		pages: MenuPage[];
		detail: BrainPodItem | null;
		finish: 'white' | 'graphite';
		sound: boolean;
	} = {
		pages: [{ title: '知识资料库', rows: collections, selected: 0, key: 'home' }],
		detail: deviceOnly ? null : (featured?.item ?? null),
		finish: 'white',
		sound: false,
	};
	const page = () => state.pages[state.pages.length - 1];
	const current = () => state.detail || page().rows[page().selected];
	function persist() {
		try {
			sessionStorage.setItem(
				storageKey,
				JSON.stringify({
					pages: state.pages.map((p) => ({ key: p.key, selected: p.selected })),
					detail: state.detail?.key,
					finish: state.finish,
					discoveryIndex,
				}),
			);
		} catch {
			/* Storage is optional. */
		}
	}
	try {
		const savedJSON = sessionStorage.getItem(storageKey);
		if (savedJSON) {
			const saved: SavedState = JSON.parse(savedJSON);
			if (Number.isSafeInteger(saved.discoveryIndex) && saved.discoveryIndex! >= 0)
				discoveryIndex = saved.discoveryIndex! % Math.max(1, discoveryOrder.length);
			const selected = (n: number | undefined, length: number) =>
				Math.max(0, Math.min(length - 1, Number.isFinite(n) ? Math.floor(n!) : 0));
			state.pages[0].selected = selected(saved.pages?.[0]?.selected, collections.length);
			if (Array.isArray(saved.pages))
				for (const p of saved.pages.slice(1, 2)) {
					const c = collections.find((c) => c.id === p.key) || playlists[p.key];
					if (c?.items.length)
						state.pages.push({
							title: c.title,
							rows: c.items,
							selected: selected(p.selected, c.items.length),
							key: p.key,
							index: c.index,
						});
				}
			state.detail = items.find((i) => i.key === saved.detail) || null;
			state.finish = saved.finish === 'graphite' ? 'graphite' : 'white';
		}
	} catch {
		/* A stale or invalid saved position keeps the initial recommendation. */
	}
	const lcd = document.createElement('section');
	lcd.className = 'lcd';
	lcd.setAttribute('aria-label', 'iPod 屏幕');
	lcd.innerHTML =
		'<div class="lcd-header"><strong id="lcd-title">知识资料库</strong><span class="battery" aria-label="知识持续更新"></span></div><div class="lcd-list" id="lcd-list" role="navigation" aria-label="知识目录"></div><div class="lcd-footer"><span id="lcd-position"></span><span id="lcd-status"></span></div>';
	const wheel = document.createElement('div');
	wheel.className = 'wheel-ui';
	wheel.setAttribute('aria-label', 'iPod 滚轮');
	wheel.innerHTML =
		'<button class="menu-button" aria-label="返回上一级">MENU</button><button class="prev-button" aria-label="上一条"><svg viewBox="0 0 40 28"><path d="M5 5h3v18H5zM9 14 23 5v18zM23 14 37 5v18z"/></svg></button><button class="next-button" aria-label="下一条"><svg viewBox="0 0 40 28"><path d="M32 5h3v18h-3zM31 14 17 5v18zM17 14 3 5v18z"/></svg></button><button class="play-button" aria-label="随机发现一篇知识"><svg viewBox="0 0 40 28"><path d="M3 4 20 14 3 24zM26 4h4v20h-4zM34 4h4v20h-4z"/></svg></button><button class="select-button" aria-label="进入当前选项"><span>ENTER</span></button>';
	if (deviceOnly) {
		wheel
			.querySelector('.prev-button path')!
			.setAttribute('d', 'M18 27V9l-9 9-3-3L20 1l14 14-3 3-9-9v18z');
		wheel
			.querySelector('.next-button path')!
			.setAttribute('d', 'M18 1v18l-9-9-3 3 14 14 14-14-3-3-9 9V1z');
		for (const [selector, label, key] of [
			['.prev-button', '上一条', 'ArrowUp'],
			['.next-button', '下一条', 'ArrowDown'],
			['.menu-button', '返回上一级', 'Escape'],
			['.select-button', '确认进入', 'Enter'],
		]) {
			const button = wheel.querySelector<HTMLButtonElement>(selector)!;
			button.title = label;
			button.setAttribute('aria-keyshortcuts', key);
		}
	}
	const hold = document.createElement('button');
	hold.className = 'hold-switch';
	hold.type = 'button';
	hold.setAttribute('role', 'switch');
	hold.setAttribute('aria-label', 'Hold 锁定');
	hold.setAttribute('aria-checked', 'false');
	hold.title = '锁定 iPod';
	const lockScreen = document.createElement('div');
	lockScreen.className = 'lcd-lock-screen';
	lockScreen.hidden = true;
	lockScreen.innerHTML = `<time class="lcd-lock-time"></time><span class="lcd-lock-region"></span><img src="${CAT_CURATOR_AVATAR}" alt="猫馆长" width="180" height="180" /><span class="sr-only">iPod 已锁定</span>`;
	lcd.append(lockScreen);
	const clockTime = lockScreen.querySelector<HTMLTimeElement>('time')!;
	const clockRegion = lockScreen.querySelector<HTMLElement>('.lcd-lock-region')!;
	let locked = false;
	let clockTimer: ReturnType<typeof setTimeout> | undefined;
	function updateLockClock() {
		clearTimeout(clockTimer);
		if (!locked || signal.aborted || document.hidden) return;
		const now = new Date();
		const clock = formatBrainPodClock(now);
		clockTime.textContent = clock.time;
		clockTime.dateTime = now.toISOString();
		clockRegion.textContent = clock.region;
		clockRegion.title = `Device time zone: ${clock.timeZone}`;
		clockRegion.setAttribute('aria-label', `Time zone city: ${clock.region}`);
		// Update on minute boundaries; resume immediately after returning to this tab.
		clockTimer = setTimeout(updateLockClock, 60000 - (now.getTime() % 60000));
	}
	document.addEventListener('visibilitychange', updateLockClock, { signal });
	signal.addEventListener('abort', () => clearTimeout(clockTimer), { once: true });
	function updateSelectButton() {
		const button = wheel.querySelector<HTMLButtonElement>('.select-button')!;
		const entry = current();
		button.title = locked ? '解锁 iPod' : '确认进入';
		button.setAttribute(
			'aria-label',
			locked
				? '解锁 iPod'
				: entry && !isCollection(entry)
					? `打开文章：${entry.title}`
					: entry
						? `进入栏目：${entry.title}`
						: '确认进入',
		);
	}
	function setLocked(value: boolean) {
		locked = value;
		portal?.setLocked(locked);
		updateLockClock();
		hold.setAttribute('aria-checked', String(locked));
		hold.title = locked ? '解锁 iPod' : '锁定 iPod';
		lcd.classList.toggle('lcd--locked', locked);
		lockScreen.hidden = !locked;
		for (const child of lcd.children) {
			if (child !== lockScreen) (child as HTMLElement).inert = locked;
		}
		wheel.querySelectorAll('button').forEach((button) => {
			button.disabled = locked && !button.classList.contains('select-button');
		});
		updateSelectButton();
		scene?.setHold(locked);
		clickSound();
	}
	hold.addEventListener('click', () => setLocked(!locked), { signal });
	stage.append(lcd, wheel, hold);
	let scene: BrainPodScene | undefined,
		lastPreviewKey = '',
		audio: AudioContext | undefined;
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	function revealPosterElement(element: HTMLElement) {
		if (portal) portal.reveal(element);
		else
			element.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' });
	}
	function paint(animate = false) {
		const p = page(),
			entry = current(),
			list = $('lcd-list');
		$('lcd-title').textContent = state.detail ? '正在阅读' : p.title;
		if (state.detail) {
			const detail = state.detail;
			list.innerHTML = `<div class="lcd-detail"><h3>${escapeHTML(detail.title)}</h3><p>${escapeHTML(detail.summary || detail.section_label)}</p><a href="${escapeHTML(detail.href)}" ${detail.external ? 'target="_blank" rel="noopener noreferrer"' : ''} data-read>打开完整内容 ↗</a></div>`;
		} else {
			const start = Math.max(0, Math.min(p.selected - 2, p.rows.length - 5));
			list.innerHTML = p.rows.length
				? p.rows
						.slice(start, start + 5)
						.map(
							(r, i) =>
								`<button class="lcd-row" data-row="${i + start}" aria-current="${i + start === p.selected}" title="${escapeHTML(r.title)}"><span>${escapeHTML(r.title)}</span>${isCollection(r) ? `<span class="row-count">${r.items.length}</span>` : ''}<span class="row-chevron">›</span></button>`,
						)
						.join('')
				: '<div class="lcd-detail"><p>这里的内容正在整理中。</p></div>';
		}
		$('lcd-position').textContent = state.detail
			? state.detail.section_label
			: `${p.rows.length ? String(p.selected + 1).padStart(2, '0') : '00'} / ${String(p.rows.length).padStart(2, '0')}`;
		$('lcd-status').textContent = state.detail
			? 'MENU 返回'
			: p.key === 'home'
				? deviceOnly
					? '↑↓选择 · 确认进入'
					: `${items.length} 条知识`
				: deviceOnly
					? '确认阅读 · MENU 返回'
					: '中央键查看';
		updateSelectButton();
		if (entry) {
			root.dataset.brainpodCollection = isCollection(entry) ? entry.id : entry.section;
			const key = isCollection(entry) ? entry.id : entry.key;
			const isFeatured = !isCollection(entry) && key === featured?.item.key;
			$('preview').dataset.featured = String(isFeatured);
			$('return-featured').hidden = !featured || isFeatured;
			$('preview-number').hidden = !!state.detail;
			$('preview-number').textContent =
				`${String(p.selected + 1).padStart(2, '0')} / ${String(p.rows.length).padStart(2, '0')}`;
			if (key !== lastPreviewKey) {
				lastPreviewKey = key;
				if (animate && !reduced.matches) {
					$('preview').classList.remove('changing');
					void $('preview').offsetWidth;
					$('preview').classList.add('changing');
				}
				$('preview-title').textContent = entry.title;
				$('preview-description').textContent = isCollection(entry)
					? entry.description
					: isFeatured
						? featured!.reason
						: entry.summary;
				$('preview').querySelector('.preview-kicker span')!.textContent = isCollection(entry)
					? '正在浏览'
					: isFeatured
						? '先读这一篇'
						: entry.section_label;
				$('preview-meta').textContent = isCollection(entry)
					? `${entry.items.length} 篇内容`
					: isFeatured
						? featured!.detail
						: entry.date || '';
				const action = $<HTMLAnchorElement>('preview-action');
				action.innerHTML = `${isCollection(entry) ? '挑一篇来读' : isFeatured ? '从这里开始读' : '阅读全文'} <i class="ph ph-arrow-right" aria-hidden="true"></i>`;
				for (const id of ['preview-action', 'preview-title']) {
					const link = $<HTMLAnchorElement>(id);
					link.href = entry.href;
					link.target = !isCollection(entry) && entry.external ? '_blank' : '_self';
					link.rel = link.target === '_blank' ? 'noopener noreferrer' : '';
				}
			}
		}
		persist();
	}
	function clickSound() {
		if (!state.sound) return;
		try {
			audio ??= new AudioContext();
			if (audio.state === 'suspended') void audio.resume();
			const oscillator = audio.createOscillator(),
				gain = audio.createGain();
			oscillator.type = 'triangle';
			oscillator.frequency.value = 1100;
			gain.gain.setValueAtTime(0.022, audio.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.022);
			oscillator.connect(gain);
			gain.connect(audio.destination);
			oscillator.start();
			oscillator.stop(audio.currentTime + 0.026);
		} catch {
			/* Optional sound should never interrupt navigation. */
		}
	}
	function openArticle(item: BrainPodItem) {
		persist();
		if (item.external) window.open(item.href, '_blank', 'noopener,noreferrer');
		else void navigate(item.href);
	}
	function move(delta: number) {
		if (locked) return;
		state.detail = null;
		const p = page(),
			next = Math.max(0, Math.min(p.rows.length - 1, p.selected + delta));
		if (next !== p.selected) {
			p.selected = next;
			clickSound();
		}
		paint();
	}
	function enter() {
		if (locked) {
			setLocked(false);
			return;
		}
		if (state.detail) {
			openArticle(state.detail);
			return;
		}
		const entry = current();
		if (!entry) return;
		clickSound();
		if (isCollection(entry))
			state.pages.push({
				title: entry.title,
				rows: entry.items,
				selected: 0,
				key: entry.id,
				index: entry.index,
			});
		else if (deviceOnly) {
			openArticle(entry);
			return;
		} else state.detail = entry;
		paint(true);
	}
	function back() {
		if (locked) return;
		if (state.detail) state.detail = null;
		else if (state.pages.length > 1) state.pages.pop();
		clickSound();
		paint(true);
	}
	function discover() {
		if (locked) return;
		if (!discoveryOrder.length) return;
		motion.discover();
		const previous = current();
		let item = discoveryOrder[discoveryIndex++ % discoveryOrder.length];
		if (
			previous &&
			!isCollection(previous) &&
			item.key === previous.key &&
			discoveryOrder.length > 1
		)
			item = discoveryOrder[discoveryIndex++ % discoveryOrder.length];
		state.detail = item;
		paint(true);
		clickSound();
		resetPose();
	}
	$('surprise-pick').addEventListener(
		'click',
		(event) => {
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			event.preventDefault();
			discover();
			if (matchMedia('(max-width: 720px)').matches) revealPosterElement($('preview'));
		},
		{ signal },
	);
	function resetPose() {
		scene?.reset();
		$('turn-device').querySelector('span')!.textContent = '翻转';
	}
	function home() {
		if (locked) return;
		state.detail = null;
		state.pages = state.pages.slice(0, 1);
		paint(true);
		resetPose();
	}
	root.querySelectorAll<HTMLAnchorElement>('[data-playlist]').forEach((link) =>
		link.addEventListener(
			'click',
			(event) => {
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
				const key = link.dataset.playlist!,
					p = playlists[key];
				if (!p?.items.length) return;
				event.preventDefault();
				state.detail = null;
				state.pages = state.pages.slice(0, 1);
				state.pages.push({ title: p.title, rows: p.items, selected: 0, key, index: p.index });
				paint(true);
				resetPose();
				$<HTMLDetailsElement>('brainpod-directory').open = false;
				revealPosterElement(stage);
				stage.focus({ preventScroll: true });
			},
			{ signal },
		),
	);
	root.querySelectorAll<HTMLAnchorElement>('[data-preview-open]').forEach((link) =>
		link.addEventListener(
			'click',
			(event) => {
				const entry = current();
				if (entry && isCollection(entry) && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
					event.preventDefault();
					enter();
				} else persist();
			},
			{ signal },
		),
	);
	$('return-featured').addEventListener(
		'click',
		() => {
			if (!featured) return;
			state.pages = state.pages.slice(0, 1);
			state.detail = featured.item;
			paint(true);
			resetPose();
			$('preview-title').focus({ preventScroll: true });
		},
		{ signal },
	);
	lcd.addEventListener(
		'click',
		(event) => {
			if (locked) return;
			const row = (event.target as Element).closest<HTMLElement>('[data-row]');
			if (row) {
				page().selected = Number(row.dataset.row);
				enter();
				stage.focus({ preventScroll: true });
			}
			if ((event.target as Element).closest('[data-read]')) persist();
		},
		{ signal },
	);
	let wheelDrag: {
			id: number;
			cx: number;
			cy: number;
			angle: number;
			accum: number;
			moved: number;
			x: number;
			y: number;
		} | null = null,
		suppressClick = false,
		releaseTimer: ReturnType<typeof setTimeout> | undefined;
	wheel.addEventListener(
		'pointerdown',
		(e) => {
			if (locked || e.button !== 0) return;
			const b = wheel.getBoundingClientRect(),
				cx = b.left + b.width / 2,
				cy = b.top + b.height / 2;
			if (Math.hypot(e.clientX - cx, e.clientY - cy) / (b.width / 2) < 0.4) return;
			wheelDrag = {
				id: e.pointerId,
				cx,
				cy,
				angle: Math.atan2(e.clientY - cy, e.clientX - cx),
				accum: 0,
				moved: 0,
				x: e.clientX,
				y: e.clientY,
			};
			suppressClick = false;
		},
		{ signal },
	);
	wheel.addEventListener(
		'pointermove',
		(e) => {
			if (!wheelDrag || e.pointerId !== wheelDrag.id) return;
			const d = wheelDrag,
				angle = Math.atan2(e.clientY - d.cy, e.clientX - d.cx);
			let delta = angle - d.angle;
			if (delta > Math.PI) delta -= 2 * Math.PI;
			if (delta < -Math.PI) delta += 2 * Math.PI;
			d.angle = angle;
			d.accum += delta;
			d.moved = Math.max(d.moved, Math.hypot(e.clientX - d.x, e.clientY - d.y));
			if (d.moved > 7) {
				if (!suppressClick) wheel.setPointerCapture(e.pointerId);
				suppressClick = true;
				e.preventDefault();
				const ticks = Math.trunc(d.accum / 0.23);
				if (ticks) {
					move(ticks);
					d.accum -= ticks * 0.23;
				}
			}
		},
		{ signal },
	);
	function releaseWheel() {
		wheelDrag = null;
		releaseTimer = setTimeout(() => (suppressClick = false), 0);
	}
	wheel.addEventListener('pointerup', releaseWheel, { signal });
	wheel.addEventListener('pointercancel', releaseWheel, { signal });
	wheel.addEventListener(
		'click',
		(event) => {
			if (suppressClick) {
				event.preventDefault();
				return;
			}
			const target = event.target as Element;
			if (target.closest('.menu-button')) back();
			else if (target.closest('.prev-button')) move(-1);
			else if (target.closest('.next-button')) move(1);
			else if (target.closest('.select-button')) enter();
			else if (target.closest('.play-button')) discover();
			// Keep the next keyboard Enter tied to the highlighted item, not the last arrow clicked.
			stage.focus({ preventScroll: true });
		},
		{ signal },
	);
	let scrollAccumulator = 0,
		lastScroll = 0;
	stage.addEventListener(
		'wheel',
		(event) => {
			// In the entrance, vertical wheel gestures drive the camera even over the LCD.
			// The physical click wheel still supports circular dragging and button controls.
			if (root.classList.contains('portal-ready')) return;
			if (!(event.target as Element).closest('.lcd,.wheel-ui')) return;
			event.preventDefault();
			const now = performance.now();
			if (now - lastScroll > 160) scrollAccumulator = 0;
			lastScroll = now;
			scrollAccumulator += event.deltaY * (event.deltaMode === 1 ? 16 : 1);
			if (Math.abs(scrollAccumulator) > 36) {
				move(Math.sign(scrollAccumulator));
				scrollAccumulator = 0;
			}
		},
		{ passive: false, signal },
	);
	document.addEventListener(
		'keydown',
		(event) => {
			if (stage.dataset.ready !== 'true' || (event.target as Element).closest('.hold-switch'))
				return;
			const target = event.target as Element;
			const inDevice = stage.contains(target);
			const idlePage = [
				document.body,
				document.documentElement,
				root,
				document.getElementById('main-content'),
			].includes(target as HTMLElement);
			if (!inDevice) {
				if (
					!deviceOnly ||
					!idlePage ||
					root.querySelector<HTMLElement>('.curiosity-poster')!.inert ||
					$<HTMLDetailsElement>('poster-menu').open ||
					$<HTMLDetailsElement>('device-settings').open
				)
					return;
				const bounds = stage.getBoundingClientRect();
				if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
			}
			if (
				document.querySelector('dialog[open]') ||
				event.metaKey ||
				event.ctrlKey ||
				event.altKey ||
				target.closest('input,textarea,select,[contenteditable="true"]')
			)
				return;
			if (event.key === 'Enter' && (event.target as Element).closest('button,a')) return;
			if (
				![
					'ArrowDown',
					'ArrowRight',
					'ArrowUp',
					'ArrowLeft',
					'Enter',
					'Escape',
					'Backspace',
					'Home',
				].includes(event.key)
			)
				return;
			event.preventDefault();
			if ((locked && event.key !== 'Enter') || (event.key === 'Enter' && event.repeat)) return;
			if (event.key === 'ArrowDown') move(1);
			else if (event.key === 'ArrowUp') move(-1);
			else if (['Enter', 'ArrowRight'].includes(event.key)) enter();
			else if (event.key === 'Home') home();
			else back();
			// Repainting the LCD replaces focused rows; keep keyboard navigation in the device.
			stage.focus({ preventScroll: true });
		},
		{ signal },
	);
	const settings = $<HTMLDetailsElement>('device-settings');
	settings.addEventListener(
		'keydown',
		(event) => {
			if (event.key !== 'Escape' || !settings.open) return;
			event.preventDefault();
			settings.open = false;
			settings.querySelector<HTMLElement>('summary')?.focus();
		},
		{ signal },
	);
	document.addEventListener(
		'pointerdown',
		(event) => {
			if (!settings.contains(event.target as Node)) settings.open = false;
		},
		{ signal },
	);
	$('sound-toggle').addEventListener(
		'click',
		() => {
			state.sound = !state.sound;
			$('sound-toggle').setAttribute('aria-pressed', String(state.sound));
			$('sound-toggle').querySelector('span')!.textContent = state.sound ? '声音开' : '声音关';
			$('sound-toggle').querySelector('i')!.className = state.sound
				? 'ph ph-speaker-high'
				: 'ph ph-speaker-slash';
			clickSound();
		},
		{ signal },
	);
	function changeFinish(finish: 'white' | 'graphite') {
		state.finish = finish;
		root.classList.toggle('brainpod-graphite', finish === 'graphite');
		root
			.querySelectorAll<HTMLElement>('[data-finish]')
			.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.finish === finish)));
		scene?.setFinish(finish);
		persist();
	}
	root
		.querySelectorAll<HTMLElement>('[data-finish]')
		.forEach((b) =>
			b.addEventListener(
				'click',
				() => changeFinish(b.dataset.finish === 'graphite' ? 'graphite' : 'white'),
				{ signal },
			),
		);
	$('turn-device').addEventListener(
		'click',
		() => {
			$('turn-device').querySelector('span')!.textContent = scene?.turn() ? '正面' : '翻转';
		},
		{ signal },
	);
	function revealDevice() {
		if (signal.aborted) return;
		root.querySelector('#loading')?.remove();
		stage.dataset.ready = 'true';
		stage.setAttribute('aria-busy', 'false');
		stage.tabIndex = 0;
	}
	function fallback() {
		scene?.dispose();
		scene = undefined;
		stage.querySelectorAll('canvas, .html-render, .fallback-device').forEach((el) => el.remove());
		const device = document.createElement('div');
		device.className = 'fallback-device';
		for (const el of [lcd, wheel]) {
			el.removeAttribute('style');
			device.append(el);
		}
		hold.removeAttribute('style');
		device.append(hold);
		stage.append(device);
		$('turn-device').hidden = true;
		stage.dataset.renderer = 'fallback';
		revealDevice();
	}
	stage.addEventListener(
		'webglcontextlost',
		(event) => {
			event.preventDefault();
			fallback();
		},
		{ signal, capture: true },
	);
	paint();
	changeFinish(state.finish);
	const portal = mountBrainPodPortal(root, () => scene, signal);
	mountBrainPodCollection(root, signal, {
		select(id) {
			const collection = collections.find((collection) => collection.id === id);
			if (!collection) return;
			state.detail = null;
			state.pages = [
				{
					title: '知识资料库',
					rows: collections,
					selected: collections.indexOf(collection),
					key: 'home',
				},
				{
					title: collection.title,
					rows: collection.items,
					selected: 0,
					key: collection.id,
					index: collection.index,
				},
			];
			paint();
		},
		returnToDevice() {
			revealPosterElement(stage);
			if (!root.classList.contains('portal-ready')) stage.focus({ preventScroll: true });
		},
		revealCollection() {
			const room = root.querySelector<HTMLElement>('[data-collection-room]');
			if (room) portal?.enterRoom(room);
		},
	});
	// DOM controls must not appear before their physical surface and pixel font are ready.
	const pixelFontReady = document.fonts.load('24px "BrainPod Pixel"').catch(() => []);
	void Promise.all([
		createBrainPodScene(stage, lcd, wheel, hold, signal).catch(() => undefined),
		pixelFontReady,
	]).then(([result]) => {
		if (signal.aborted) {
			result?.dispose();
			return;
		}
		scene = result;
		if (scene) {
			scene.setHold(locked);
			changeFinish(state.finish);
			revealDevice();
		} else fallback();
	});
	return () => {
		persist();
		controller.abort();
		clearTimeout(releaseTimer);
		scene?.dispose();
		lcd.remove();
		wheel.remove();
		hold.remove();
		stage.querySelector('.fallback-device')?.remove();
		if (audio) void audio.close();
	};
}
