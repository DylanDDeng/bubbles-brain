/** Showcase prompt: clamp long prompts, switch language, copy. Without JS the full text shows. */
function setupPrompt(section: HTMLElement) {
	if (section.dataset.ready) return;
	section.dataset.ready = 'true';
	const tools = section.querySelector<HTMLElement>('[data-prompt-tools]');
	const toggle = section.querySelector<HTMLButtonElement>('[data-prompt-toggle]');
	const copy = section.querySelector<HTMLButtonElement>('[data-prompt-copy]');
	const texts = Array.from(section.querySelectorAll<HTMLElement>('[data-prompt-text]'));
	const langs = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-prompt-lang]'));
	if (tools) tools.hidden = false;
	let expanded = false;
	const visible = () => texts.find((text) => !text.hidden) ?? texts[0];

	function paint() {
		const text = visible();
		texts.forEach((item) => item.classList.toggle('is-clamped', !expanded));
		if (!toggle || !text) return;
		// Only offer "expand" when the clamp actually hides something.
		const overflowing = expanded || text.scrollHeight > text.clientHeight + 1;
		toggle.hidden = !overflowing;
		toggle.textContent = expanded ? '收起' : '展开全部';
		toggle.setAttribute('aria-expanded', String(expanded));
	}

	toggle?.addEventListener('click', () => {
		expanded = !expanded;
		paint();
	});
	langs.forEach((button) =>
		button.addEventListener('click', () => {
			const lang = button.dataset.promptLang;
			texts.forEach((text) => (text.hidden = text.dataset.promptText !== lang));
			langs.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
			paint();
		}),
	);
	copy?.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(visible()?.textContent?.trim() ?? '');
			copy.textContent = '已复制';
		} catch {
			copy.textContent = '复制失败';
		}
		setTimeout(() => (copy.textContent = '复制'), 1600);
	});
	paint();
	// Room panels start hidden; measure again once the prompt actually has a size.
	const observer = new ResizeObserver(() => paint());
	texts.forEach((text) => observer.observe(text));
	document.addEventListener('astro:before-swap', () => observer.disconnect(), { once: true });
}

/**
 * The client router parses the next page in a detached document, where a <video> picks its
 * source, finds no browsing context and gives up (MEDIA_ERR_SRC_NOT_SUPPORTED). That failed
 * state survives the swap, so the film will not play until a full reload. Restart its loading.
 */
function reviveVideos() {
	document
		.querySelectorAll<HTMLVideoElement>('[data-showcase-theater] video, video[data-showcase-video]')
		.forEach((video) => {
			if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) video.load();
		});
}

/**
 * The reel's category menu. Picking the category of the work on screen filters the reel in place;
 * any other category follows its link to that category's newest work, which arrives with ?c=.
 * Without JS every option is an ordinary link and the reel simply lists everything.
 */
function setupFilter(theater: HTMLElement) {
	const menu = theater.querySelector<HTMLDetailsElement>('[data-showcase-filter]');
	if (!menu || menu.dataset.ready) return;
	menu.dataset.ready = 'true';
	const inPage = !theater.closest('[data-collection-room]');
	const label = menu.querySelector<HTMLElement>('[data-filter-label]')!;
	const options = Array.from(menu.querySelectorAll<HTMLAnchorElement>('[data-filter-option]'));
	const items = Array.from(theater.querySelectorAll<HTMLLIElement>('.showcase-reel ol > li'));
	const current = items.find((item) => item.querySelector('[aria-current="true"]'));
	const position = theater.querySelector<HTMLElement>('[data-count-position]');
	const total = theater.querySelector<HTMLElement>('[data-count-total]');
	const pad = (n: number) => String(n).padStart(2, '0');

	function apply(category: string) {
		const shown = items.filter((item) => !category || item.dataset.category === category);
		items.forEach((item) => (item.hidden = !shown.includes(item)));
		options.forEach((option) =>
			option.dataset.filterOption === category
				? option.setAttribute('aria-current', 'true')
				: option.removeAttribute('aria-current'),
		);
		label.textContent =
			options.find((option) => option.dataset.filterOption === category)?.firstElementChild
				?.textContent ?? '全部';
		if (position && total && current) {
			position.textContent = pad(shown.indexOf(current) + 1);
			total.textContent = pad(shown.length);
		}
		// Moving along a filtered reel keeps the filter.
		items.forEach((item) => {
			const link = item.querySelector('a')!;
			const url = new URL(link.href);
			if (category) url.searchParams.set('c', category);
			else url.searchParams.delete('c');
			link.href = url.pathname + url.search;
		});
		if (inPage) {
			const url = new URL(location.href);
			if (category) url.searchParams.set('c', category);
			else url.searchParams.delete('c');
			history.replaceState(history.state, '', url);
		}
	}

	options.forEach((option) =>
		option.addEventListener('click', (event) => {
			const category = option.dataset.filterOption ?? '';
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			if (category && current?.dataset.category !== category) return;
			event.preventDefault();
			apply(category);
			menu.open = false;
			menu.querySelector('summary')?.focus();
		}),
	);
	const closeOutside = (event: PointerEvent) => {
		if (menu.open && !menu.contains(event.target as Node)) menu.open = false;
	};
	const closeOnEscape = (event: KeyboardEvent) => {
		if (event.key !== 'Escape' || !menu.open) return;
		menu.open = false;
		menu.querySelector('summary')?.focus();
	};
	document.addEventListener('pointerdown', closeOutside);
	document.addEventListener('keydown', closeOnEscape);
	document.addEventListener(
		'astro:before-swap',
		() => {
			document.removeEventListener('pointerdown', closeOutside);
			document.removeEventListener('keydown', closeOnEscape);
		},
		{ once: true },
	);

	const requested = inPage ? (new URL(location.href).searchParams.get('c') ?? '') : '';
	// Ignore a category that does not hold the work on screen (a hand-edited or stale link).
	apply(requested && current?.dataset.category === requested ? requested : '');
}

/**
 * Gallery tiles play their film while the pointer is over them (or the tile has keyboard focus)
 * and pause when it leaves, keeping that frame. The video is silent and loops, and it loads
 * nothing until the first hover. Touch screens have no hover, and readers who ask for reduced
 * motion get no autoplay: both keep the poster, and a tap opens the work.
 */
function setupHoverPlay(root: HTMLElement) {
	if (root.dataset.hoverReady) return;
	root.dataset.hoverReady = 'true';
	if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	for (const tile of root.querySelectorAll<HTMLElement>('.showcase-tile')) {
		const video = tile.querySelector<HTMLVideoElement>('.showcase-tile__video');
		if (!video?.dataset.src) continue;
		video.muted = true;
		let wanted = false;

		const start = () => {
			wanted = true;
			if (!video.getAttribute('src')) video.src = video.dataset.src!;
			video
				.play()
				.then(() => {
					// The pointer may have left while the first frames were loading.
					if (!wanted) return video.pause();
					tile.classList.remove('is-paused');
					tile.classList.add('is-playing');
				})
				.catch(() => {
					// Blocked or failed: the poster stays, which is the same as no hover play.
				});
		};
		const stop = () => {
			wanted = false;
			video.pause();
			if (tile.classList.contains('is-playing')) {
				tile.classList.remove('is-playing');
				tile.classList.add('is-paused');
			}
		};

		tile.addEventListener('pointerenter', start);
		tile.addEventListener('pointerleave', stop);
		tile.addEventListener('focus', start);
		tile.addEventListener('blur', stop);
	}
}

function initShowcase() {
	reviveVideos();
	document.querySelectorAll<HTMLElement>('[data-showcase-prompt]').forEach(setupPrompt);
	document.querySelectorAll<HTMLElement>('[data-showcase-theater]').forEach(setupFilter);
	document.querySelectorAll<HTMLElement>('[data-showcase-gallery]').forEach(setupHoverPlay);
}

document.addEventListener('astro:page-load', initShowcase);
