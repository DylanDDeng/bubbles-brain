/**
 * The home search box types a question, holds it, erases it and types the next. The order is
 * shuffled on every visit, and the first question is never the one the last visit opened with,
 * so a returning reader always sees something new. Three other questions sit under the box.
 */

const LAST_KEY = 'home-ask:last';
const TRIED = 3;

export interface VisitPlan {
	/** Indexes of the questions shown as links under the box. */
	tried: number[];
	/** Indexes of the questions typed into the box, in order. */
	typed: number[];
}

export function planVisit(count: number, last: number | null, random = Math.random): VisitPlan {
	const order = Array.from({ length: count }, (_, index) => index);
	for (let index = order.length - 1; index > 0; index -= 1) {
		const pick = Math.floor(random() * (index + 1));
		[order[index], order[pick]] = [order[pick], order[index]];
	}
	const tried = order.slice(0, Math.min(TRIED, Math.max(count - 1, 0)));
	const typed = order.slice(tried.length);
	if (typed.length > 1 && typed[0] === last) typed.push(typed.shift()!);
	return { tried, typed };
}

function readLast(): number | null {
	try {
		const value = Number.parseInt(localStorage.getItem(LAST_KEY) ?? '', 10);
		return Number.isFinite(value) ? value : null;
	} catch {
		return null;
	}
}

function writeLast(index: number) {
	try {
		localStorage.setItem(LAST_KEY, String(index));
	} catch {
		// Private windows can refuse storage; the next visit just shuffles without memory.
	}
}

const wait = (ms: number, signal: AbortSignal) =>
	new Promise<void>((resolve, reject) => {
		const timer = window.setTimeout(resolve, ms);
		signal.addEventListener('abort', () => {
			window.clearTimeout(timer);
			reject(signal.reason);
		});
	});

let stop: AbortController | null = null;

function init() {
	stop?.abort();
	stop = null;
	const form = document.querySelector<HTMLFormElement>('[data-home-ask]');
	const input = form?.querySelector<HTMLInputElement>('input');
	const overlay = form?.querySelector<HTMLElement>('.home-ask');
	const text = form?.querySelector<HTMLElement>('[data-home-ask-text]');
	const items = [...document.querySelectorAll<HTMLAnchorElement>('[data-home-ask-item]')];
	if (!form || !input || !overlay || !text || items.length === 0) return;

	const questions = items.map((item) => ({ ask: item.textContent?.trim() ?? '', href: item.href }));
	const plan = planVisit(questions.length, readLast());
	items.forEach((item, index) => {
		item.hidden = !plan.tried.includes(index);
	});
	// Put the shown three first so the separators between them line up.
	for (const index of plan.tried) items[index].parentElement?.append(items[index]);
	writeLast(plan.typed[0]);

	const controller = new AbortController();
	stop = controller;
	const { signal } = controller;
	let current = questions[plan.typed[0]];
	let paused = false;

	input.placeholder = '';
	overlay.hidden = false;
	const show = () => {
		overlay.hidden = paused || input.value !== '';
	};

	input.addEventListener(
		'focus',
		() => {
			paused = true;
			input.placeholder = current.ask;
			show();
		},
		{ signal },
	);
	input.addEventListener(
		'blur',
		() => {
			paused = false;
			input.placeholder = '';
			show();
		},
		{ signal },
	);
	input.addEventListener('input', show, { signal });
	// An empty box sends the reader to the answer of the question it is showing.
	form.addEventListener(
		'submit',
		(event) => {
			if (input.value.trim() !== '') return;
			event.preventDefault();
			window.location.assign(current.href);
		},
		{ signal },
	);

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		form.classList.add('is-still');
		text.textContent = current.ask;
		return;
	}

	const resumed = async () => {
		while (paused) await wait(200, signal);
	};
	const loop = async () => {
		for (let step = 0; ; step += 1) {
			current = questions[plan.typed[step % plan.typed.length]];
			const chars = Array.from(current.ask);
			for (let count = 1; count <= chars.length; count += 1) {
				await resumed();
				text.textContent = chars.slice(0, count).join('');
				await wait(70 + Math.random() * 60, signal);
			}
			await wait(2600, signal);
			await resumed();
			for (let count = chars.length - 1; count >= 0; count -= 1) {
				await resumed();
				text.textContent = chars.slice(0, count).join('');
				await wait(28, signal);
			}
			await wait(450, signal);
		}
	};
	loop().catch(() => {
		// Aborted when the reader leaves the page.
	});
}

if (typeof document !== 'undefined') {
	document.addEventListener('astro:page-load', init);
	document.addEventListener('astro:before-swap', () => {
		stop?.abort();
		stop = null;
	});
}
