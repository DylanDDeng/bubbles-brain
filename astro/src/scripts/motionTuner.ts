import {
	defaultMotionValues,
	formatMotionValue,
	renderMotionPrompt,
	type MotionProfile,
	type MotionValues,
} from '../lib/vibeCodingMotion';

const EASE: Record<string, string> = {
	out: 'cubic-bezier(0.16, 1, 0.3, 1)',
	in: 'cubic-bezier(0.7, 0, 0.84, 0)',
	inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
	linear: 'linear',
	back: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

interface Demo {
	/** 从头播一遍；auto 为 true 时是参数变化触发的自动重播 */
	play(values: MotionValues, auto: boolean): void;
	stop(): void;
	/** 只应用参数、不播放：交互类在「减少动态效果」下也要能亲手试 */
	prepare?(values: MotionValues): void;
}

function cancelAll(elements: Element[]) {
	for (const element of elements)
		for (const animation of element.getAnimations()) animation.cancel();
}

/**
 * 在演示框里自动滚到底，停一下，淡出回到顶部，再从头播，一直循环。
 * 用户自己动手滚，就停下循环，把控制权还给用户。
 */
function scrollLoop(box: HTMLElement, duration: number, restart: () => void): () => void {
	let frame = 0;
	let timer = 0;
	let stopped = false;
	const takeover = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
	const stop = () => {
		stopped = true;
		cancelAnimationFrame(frame);
		window.clearTimeout(timer);
		for (const type of takeover) box.removeEventListener(type, stop);
	};
	for (const type of takeover) box.addEventListener(type, stop, { passive: true });
	const run = () => {
		if (stopped) return;
		restart();
		box.scrollTop = 0;
		const distance = box.scrollHeight - box.clientHeight;
		let start = 0;
		const step = (time: number) => {
			if (stopped) return;
			if (!start) start = time;
			const progress = Math.min((time - start) / duration, 1);
			const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
			box.scrollTop = eased * distance;
			if (progress < 1) frame = requestAnimationFrame(step);
			else timer = window.setTimeout(rewind, 1500);
		};
		frame = requestAnimationFrame(step);
	};
	const rewind = () => {
		if (stopped) return;
		const out = box.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 250,
			easing: 'ease-in',
			fill: 'forwards',
		});
		out.finished
			.then(() => {
				if (stopped) return out.cancel();
				run();
				box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
				out.cancel();
			})
			.catch(() => {});
	};
	run();
	return () => {
		stop();
		for (const animation of box.getAnimations()) animation.cancel();
	};
}

/** 弹簧：按回弹程度和时长模拟出关键帧，回弹 0 即临界阻尼 */
function springFrames(bounce: number, duration: number, from: number): number[] {
	const omega = (2 * Math.PI) / (duration / 1000);
	const zeta = 1 - bounce;
	const samples: number[] = [];
	const total = duration * 1.6;
	for (let t = 0; t <= total; t += 16) {
		const s = t / 1000;
		let x: number;
		if (zeta < 1) {
			const wd = omega * Math.sqrt(1 - zeta * zeta);
			x =
				Math.exp(-zeta * omega * s) * (Math.cos(wd * s) + ((zeta * omega) / wd) * Math.sin(wd * s));
		} else {
			x = Math.exp(-omega * s) * (1 + omega * s);
		}
		samples.push(from * x);
	}
	samples.push(0);
	return samples;
}

function durationDemo(stage: HTMLElement): Demo {
	const menu = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	let timer = 0;
	return {
		play(values) {
			window.clearTimeout(timer);
			cancelAll([menu]);
			const duration = Number(values.dur);
			const loop = () => {
				const open = menu.animate(
					[
						{ opacity: 0, transform: 'translateY(-6px) scaleY(0.6)' },
						{ opacity: 1, transform: 'none' },
					],
					{ duration, easing: EASE.out, fill: 'both' },
				);
				open.finished
					.then(() => new Promise((resolve) => (timer = window.setTimeout(resolve, 900))))
					.then(
						() =>
							menu.animate(
								[
									{ opacity: 1, transform: 'none' },
									{ opacity: 0, transform: 'translateY(-6px) scaleY(0.6)' },
								],
								{ duration, easing: EASE.in, fill: 'both' },
							).finished,
					)
					.then(() => (timer = window.setTimeout(loop, 500)))
					.catch(() => {});
			};
			loop();
		},
		stop() {
			window.clearTimeout(timer);
			cancelAll([menu]);
		},
	};
}

function easingDemo(stage: HTMLElement): Demo {
	const lanes = [...stage.querySelectorAll<HTMLElement>('[data-lane]')];
	let timer = 0;
	return {
		play(values) {
			window.clearTimeout(timer);
			const duration = Number(values.dur);
			for (const lane of lanes)
				lane.classList.toggle('is-picked', lane.dataset.lane === values.ease);
			const balls = lanes.map((lane) => lane.querySelector<HTMLElement>('[data-motion-target]')!);
			const run = () => {
				cancelAll(balls);
				const animations = balls.map((ball, index) =>
					ball.animate([{ left: '0%' }, { left: 'calc(100% - 14px)' }], {
						duration,
						easing: EASE[lanes[index].dataset.lane!],
						fill: 'both',
					}),
				);
				Promise.all(animations.map((animation) => animation.finished))
					.then(() => (timer = window.setTimeout(run, 900)))
					.catch(() => {});
			};
			run();
		},
		stop() {
			window.clearTimeout(timer);
		},
	};
}

function springDemo(stage: HTMLElement): Demo {
	const card = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	let timer = 0;
	return {
		play(values) {
			window.clearTimeout(timer);
			const bounce = Number(values.bounce) / 100;
			const duration = Number(values.dur);
			const run = () => {
				cancelAll([card]);
				const offsets = springFrames(bounce, duration, -90);
				card
					.animate(
						offsets.map((y, index) => ({
							transform: `translateY(${y.toFixed(2)}px)`,
							opacity: index === 0 ? 0 : 1,
						})),
						{ duration: offsets.length * 16, easing: 'linear', fill: 'both' },
					)
					.finished.then(() => (timer = window.setTimeout(run, 1200)))
					.catch(() => {});
			};
			run();
		},
		stop() {
			window.clearTimeout(timer);
		},
	};
}

function revealDemo(stage: HTMLElement): Demo {
	const box = stage.querySelector<HTMLElement>('[data-motion-scroll]')!;
	const cards = [...stage.querySelectorAll<HTMLElement>('[data-motion-target]')];
	let observer: IntersectionObserver | null = null;
	let release = () => {};
	const from = (values: MotionValues) => {
		const distance = Number(values.dist);
		if (values.kind === 'up') return `translateY(${distance}px)`;
		if (values.kind === 'left') return `translateX(${-distance}px)`;
		if (values.kind === 'scale') return 'scale(0.9)';
		return 'none';
	};
	return {
		play(values, auto) {
			release();
			const restart = () => {
				observer?.disconnect();
				cancelAll(cards);
				for (const card of cards) card.style.opacity = '0';
				observer = new IntersectionObserver(
					(entries) => {
						for (const entry of entries) {
							if (!entry.isIntersecting) continue;
							const card = entry.target as HTMLElement;
							observer!.unobserve(card);
							card.style.opacity = '';
							card.animate(
								[
									{ opacity: 0, transform: from(values) },
									{ opacity: 1, transform: 'none' },
								],
								{ duration: Number(values.dur), easing: EASE[String(values.ease)], fill: 'both' },
							);
						}
					},
					{ root: box, threshold: 0.35 },
				);
				for (const card of cards) observer.observe(card);
			};
			release = scrollLoop(box, auto ? 2600 : 3200, restart);
		},
		stop() {
			observer?.disconnect();
			release();
		},
	};
}

function staggerDemo(stage: HTMLElement): Demo {
	const tiles = [...stage.querySelectorAll<HTMLElement>('[data-motion-target]')];
	const columns = 4;
	let timer = 0;
	const orderOf = (order: string): number[] => {
		const positions = tiles.map((_, index) => ({
			row: Math.floor(index / columns),
			col: index % columns,
		}));
		if (order === 'diag') return positions.map(({ row, col }) => row + col);
		if (order === 'center') return positions.map(({ col }) => Math.abs(col - 1.5) - 0.5);
		if (order === 'random') {
			const ranks = tiles.map((_, index) => index).sort(() => Math.random() - 0.5);
			return tiles.map((_, index) => ranks.indexOf(index));
		}
		return tiles.map((_, index) => index);
	};
	return {
		play(values) {
			window.clearTimeout(timer);
			cancelAll(tiles);
			const ranks = orderOf(String(values.order));
			// 全部登场后停一会儿，淡出再来一遍
			const total = Math.max(...ranks) * Number(values.gap) + Number(values.dur);
			timer = window.setTimeout(() => {
				const fades = tiles.map((tile) =>
					tile.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }),
				);
				fades[0].finished.then(() => this.play(values, true)).catch(() => {});
			}, total + 1500);
			tiles.forEach((tile, index) =>
				tile.animate(
					[
						{ opacity: 0, transform: 'translateY(16px)' },
						{ opacity: 1, transform: 'none' },
					],
					{
						duration: Number(values.dur),
						delay: ranks[index] * Number(values.gap),
						easing: EASE.out,
						fill: 'both',
					},
				),
			);
		},
		stop() {
			window.clearTimeout(timer);
		},
	};
}

function parallaxDemo(stage: HTMLElement): Demo {
	const box = stage.querySelector<HTMLElement>('[data-motion-scroll]')!;
	const bg = stage.querySelector<HTMLElement>('[data-layer="bg"]')!;
	const mid = stage.querySelector<HTMLElement>('[data-layer="mid"]')!;
	let speed = 0.4;
	let release = () => {};
	// 内容按 100% 速度滚走；背景反向补偿一部分位移，看起来就只走了 speed 那么多
	const update = () => {
		const top = box.scrollTop;
		bg.style.transform = `translateY(${top * (1 - speed)}px)`;
		mid.style.transform = `translateY(${top * (1 - (speed + 1) / 2)}px)`;
	};
	box.addEventListener('scroll', update, { passive: true });
	return {
		play(values, auto) {
			release();
			speed = Number(values.speed) / 100;
			mid.hidden = values.layers !== '3';
			release = scrollLoop(box, auto ? 2400 : 3000, update);
		},
		stop() {
			release();
		},
	};
}

function countupDemo(stage: HTMLElement): Demo {
	const numbers = [...stage.querySelectorAll<HTMLElement>('[data-motion-target]')];
	let frame = 0;
	let timer = 0;
	return {
		play(values) {
			cancelAnimationFrame(frame);
			window.clearTimeout(timer);
			const duration = Number(values.dur);
			const comma = values.sep === 'yes';
			let start = 0;
			const format = (element: HTMLElement, progress: number) => {
				const to = Number(element.dataset.to);
				const decimals = Number(element.dataset.decimals);
				const value = (to * progress).toFixed(decimals);
				const [whole, fraction] = value.split('.');
				const grouped = comma ? Number(whole).toLocaleString('en-US') : whole;
				element.textContent = `${grouped}${fraction ? `.${fraction}` : ''}${element.dataset.suffix ?? ''}`;
			};
			const step = (time: number) => {
				if (!start) start = time;
				const linear = Math.min((time - start) / duration, 1);
				const progress = values.ease === 'out' ? 1 - (1 - linear) ** 3 : linear;
				for (const element of numbers) format(element, progress);
				if (linear < 1) frame = requestAnimationFrame(step);
				else timer = window.setTimeout(() => this.play(values, true), 1800);
			};
			frame = requestAnimationFrame(step);
		},
		stop() {
			cancelAnimationFrame(frame);
			window.clearTimeout(timer);
		},
	};
}

/* ---------- 交互类：真鼠标和虚拟鼠标走同一套处理 ---------- */

interface PointerHandlers {
	move(x: number, y: number): void;
	leave(): void;
	down(): void;
	up(): void;
}

/** 虚拟鼠标的路线：坐标是舞台宽高的比例；move 是走过去的毫秒数，hold 是到了之后停多久 */
interface Waypoint {
	x: number;
	y: number;
	move: number;
	hold: number;
	act?: 'down' | 'up';
}

const inside = (element: Element, x: number, y: number) => {
	const rect = element.getBoundingClientRect();
	return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
};

function pointerDemo(
	stage: HTMLElement,
	handlers: PointerHandlers,
	route: Waypoint[] | (() => Waypoint[]),
	apply: (values: MotionValues) => void,
): Demo {
	const ghost = stage.querySelector<SVGElement>('[data-motion-ghost]')!;
	let frame = 0;
	let timer = 0;
	let userActive = false;
	let ghostOn = false;

	const stopGhost = () => {
		ghostOn = false;
		cancelAnimationFrame(frame);
		window.clearTimeout(timer);
		ghost.classList.remove('is-on');
	};
	const startGhost = () => {
		stopGhost();
		if (userActive || reducedMotion.matches) return;
		ghostOn = true;
		ghost.classList.add('is-on');
		// 路线可以按目标元素的实际位置现算，布局变了也能点中
		const path = typeof route === 'function' ? route() : route;
		let index = 0;
		let from = path[0];
		const place = (point: { x: number; y: number }) => {
			const rect = stage.getBoundingClientRect();
			const x = point.x * rect.width;
			const y = point.y * rect.height;
			ghost.style.transform = `translate(${x}px, ${y}px)`;
			handlers.move(rect.left + x, rect.top + y);
		};
		const next = () => {
			if (!ghostOn) return;
			index = (index + 1) % path.length;
			if (index === 0) {
				handlers.up();
				handlers.leave();
			}
			const to = path[index];
			let start = 0;
			const step = (time: number) => {
				if (!ghostOn) return;
				if (!start) start = time;
				const progress = to.move ? Math.min((time - start) / to.move, 1) : 1;
				const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
				place({ x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased });
				if (progress < 1) {
					frame = requestAnimationFrame(step);
					return;
				}
				from = to;
				if (to.act === 'down') handlers.down();
				if (to.act === 'up') handlers.up();
				timer = window.setTimeout(next, to.hold);
			};
			frame = requestAnimationFrame(step);
		};
		place(from);
		timer = window.setTimeout(next, from.hold);
	};

	// 真鼠标一进舞台，虚拟鼠标让开；离开两秒半后再回来演示
	stage.addEventListener('pointerenter', (event) => {
		if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
			userActive = true;
			stopGhost();
			handlers.leave();
		}
	});
	stage.addEventListener('pointermove', (event) => {
		if (!userActive && event.pointerType !== 'touch') return;
		handlers.move(event.clientX, event.clientY);
	});
	stage.addEventListener('pointerdown', (event) => {
		if (event.pointerType === 'touch') {
			userActive = true;
			stopGhost();
			handlers.move(event.clientX, event.clientY);
		}
		handlers.down();
	});
	stage.addEventListener('pointerup', () => handlers.up());
	stage.addEventListener('pointercancel', () => handlers.up());
	stage.addEventListener('pointerleave', () => {
		handlers.up();
		handlers.leave();
		userActive = false;
		window.clearTimeout(timer);
		timer = window.setTimeout(startGhost, 2500);
	});

	return {
		prepare: apply,
		play(values) {
			apply(values);
			startGhost();
		},
		stop: stopGhost,
	};
}

const SHADOWS: Record<string, string> = {
	none: '0 0 0 rgb(0 0 0 / 0)',
	soft: '0 8px 18px rgb(0 0 0 / 0.08)',
	strong: '0 16px 32px rgb(0 0 0 / 0.16)',
};

function liftDemo(stage: HTMLElement): Demo {
	const cards = [...stage.querySelectorAll<HTMLElement>('[data-motion-target]')];
	return pointerDemo(
		stage,
		{
			move(x, y) {
				for (const card of cards) card.classList.toggle('is-hover', inside(card, x, y));
			},
			leave() {
				for (const card of cards) card.classList.remove('is-hover');
			},
			down() {},
			up() {},
		},
		[
			{ x: 0.5, y: 0.94, move: 0, hold: 400 },
			{ x: 0.24, y: 0.5, move: 700, hold: 1000 },
			{ x: 0.5, y: 0.52, move: 600, hold: 1000 },
			{ x: 0.76, y: 0.5, move: 600, hold: 1000 },
			{ x: 0.86, y: 0.94, move: 700, hold: 800 },
		],
		(values) => {
			stage.style.setProperty('--lift', `${values.lift}px`);
			stage.style.setProperty('--shadow', SHADOWS[String(values.shadow)]);
			stage.style.setProperty('--dur', `${values.dur}ms`);
			stage.style.setProperty('--ease', EASE[String(values.ease)]);
		},
	);
}

function pressDemo(stage: HTMLElement): Demo {
	const button = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	let over = false;
	return pointerDemo(
		stage,
		{
			move(x, y) {
				over = inside(button, x, y);
				button.classList.toggle('is-hover', over);
			},
			leave() {
				over = false;
				button.classList.remove('is-hover');
			},
			down() {
				if (over) button.classList.add('is-pressed');
			},
			up() {
				button.classList.remove('is-pressed');
			},
		},
		[
			{ x: 0.78, y: 0.86, move: 0, hold: 400 },
			{ x: 0.5, y: 0.45, move: 700, hold: 300 },
			{ x: 0.5, y: 0.45, move: 0, hold: 450, act: 'down' },
			{ x: 0.5, y: 0.45, move: 0, hold: 900, act: 'up' },
			{ x: 0.5, y: 0.45, move: 0, hold: 450, act: 'down' },
			{ x: 0.5, y: 0.45, move: 0, hold: 900, act: 'up' },
			{ x: 0.8, y: 0.88, move: 700, hold: 700 },
		],
		(values) => {
			stage.style.setProperty('--scale', String(Number(values.scale) / 100));
			stage.style.setProperty('--dur', `${values.dur}ms`);
			stage.style.setProperty('--release', values.back === 'spring' ? EASE.back : EASE.out);
		},
	);
}

function magneticDemo(stage: HTMLElement): Demo {
	const button = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	let range = 60;
	let strength = 0.3;
	let release = EASE.back;
	const settle = () => {
		button.style.transition = `transform 600ms ${release}`;
		button.style.transform = '';
	};
	return pointerDemo(
		stage,
		{
			move(x, y) {
				const rect = button.getBoundingClientRect();
				const cx = rect.left + rect.width / 2;
				const cy = rect.top + rect.height / 2;
				const reach = Math.max(rect.width, rect.height) / 2 + range;
				if (Math.hypot(x - cx, y - cy) > reach) {
					if (button.style.transform) settle();
					return;
				}
				button.style.transition = 'transform 150ms ease-out';
				button.style.transform = `translate(${(x - cx) * strength}px, ${(y - cy) * strength}px)`;
			},
			leave: settle,
			down() {},
			up() {},
		},
		[
			{ x: 0.12, y: 0.88, move: 0, hold: 300 },
			{ x: 0.3, y: 0.72, move: 900, hold: 200 },
			{ x: 0.42, y: 0.56, move: 700, hold: 300 },
			{ x: 0.6, y: 0.5, move: 600, hold: 200 },
			{ x: 0.64, y: 0.74, move: 600, hold: 200 },
			{ x: 0.46, y: 0.78, move: 600, hold: 300 },
			{ x: 0.9, y: 0.9, move: 800, hold: 1000 },
		],
		(values) => {
			range = Number(values.range);
			strength = Number(values.strength) / 100;
			release = values.back === 'spring' ? EASE.back : EASE.out;
		},
	);
}

function spotlightDemo(stage: HTMLElement): Demo {
	const card = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	return pointerDemo(
		stage,
		{
			move(x, y) {
				const rect = card.getBoundingClientRect();
				const lit = inside(card, x, y);
				card.classList.toggle('is-lit', lit);
				if (!lit) return;
				card.style.setProperty('--mx', `${x - rect.left}px`);
				card.style.setProperty('--my', `${y - rect.top}px`);
			},
			leave() {
				card.classList.remove('is-lit');
			},
			down() {},
			up() {},
		},
		[
			{ x: 0.04, y: 0.5, move: 0, hold: 200 },
			{ x: 0.26, y: 0.3, move: 600, hold: 100 },
			{ x: 0.74, y: 0.3, move: 1100, hold: 100 },
			{ x: 0.7, y: 0.74, move: 900, hold: 100 },
			{ x: 0.3, y: 0.7, move: 1000, hold: 100 },
			{ x: 0.5, y: 0.5, move: 700, hold: 300 },
			{ x: 0.96, y: 0.5, move: 700, hold: 900 },
		],
		(values) => {
			card.style.setProperty('--spot-size', `${values.size}px`);
			card.style.setProperty('--spot-strength', `${values.strength}%`);
			card.classList.toggle('has-border', values.border === 'yes');
		},
	);
}

function tiltDemo(stage: HTMLElement): Demo {
	const card = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	let angle = 10;
	let settle = 400;
	return pointerDemo(
		stage,
		{
			move(x, y) {
				const rect = card.getBoundingClientRect();
				if (!inside(card, x, y)) {
					this.leave();
					return;
				}
				const px = (x - rect.left) / rect.width - 0.5;
				const py = (y - rect.top) / rect.height - 0.5;
				card.style.transition = 'transform 100ms linear';
				card.style.transform = `perspective(700px) rotateX(${(-py * 2 * angle).toFixed(2)}deg) rotateY(${(px * 2 * angle).toFixed(2)}deg)`;
				card.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
				card.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
				card.classList.add('is-tilting');
			},
			leave() {
				if (!card.classList.contains('is-tilting')) return;
				card.classList.remove('is-tilting');
				card.style.transition = `transform ${settle}ms ${EASE.out}`;
				card.style.transform = '';
			},
			down() {},
			up() {},
		},
		[
			{ x: 0.9, y: 0.9, move: 0, hold: 300 },
			{ x: 0.36, y: 0.32, move: 700, hold: 300 },
			{ x: 0.64, y: 0.32, move: 800, hold: 300 },
			{ x: 0.64, y: 0.68, move: 800, hold: 300 },
			{ x: 0.36, y: 0.68, move: 800, hold: 300 },
			{ x: 0.5, y: 0.5, move: 600, hold: 400 },
			{ x: 0.92, y: 0.86, move: 700, hold: 1000 },
		],
		(values) => {
			angle = Number(values.angle);
			settle = Number(values.dur);
			card.classList.toggle('has-glare', values.glare === 'yes');
		},
	);
}

/* ---------- 点击和状态：按下、松开都在目标上才算一次点击 ---------- */

interface ClickOptions {
	onDown?(x: number, y: number, over: boolean): void;
	onUp?(): void;
	onClick(x: number, y: number): void;
	onLeave?(): void;
}

function clicker(target: HTMLElement, options: ClickOptions): PointerHandlers {
	let x = 0;
	let y = 0;
	let over = false;
	let pressed = false;
	return {
		move(nextX, nextY) {
			x = nextX;
			y = nextY;
			over = inside(target, x, y);
			target.classList.toggle('is-hover', over);
		},
		leave() {
			over = false;
			pressed = false;
			target.classList.remove('is-hover');
			options.onLeave?.();
		},
		down() {
			pressed = over;
			options.onDown?.(x, y, over);
		},
		up() {
			options.onUp?.();
			if (pressed && over) options.onClick(x, y);
			pressed = false;
		},
	};
}

/** 元素中心在舞台里的比例坐标 */
function centerOf(stage: HTMLElement, element: Element): { x: number; y: number } {
	const box = stage.getBoundingClientRect();
	const rect = element.getBoundingClientRect();
	return {
		x: (rect.left + rect.width / 2 - box.left) / box.width,
		y: (rect.top + rect.height / 2 - box.top) / box.height,
	};
}

/** 一次点击的虚拟鼠标动作：走到 (x, y)，按下，松开 */
const click = (x: number, y: number, move: number, hold: number): Waypoint[] => [
	{ x, y, move, hold: 250 },
	{ x, y, move: 0, hold: 140, act: 'down' },
	{ x, y, move: 0, hold, act: 'up' },
];

function rippleDemo(stage: HTMLElement): Demo {
	const button = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	let fromCenter = false;
	let alpha = 0.3;
	let duration = 550;
	return pointerDemo(
		stage,
		clicker(button, {
			onDown(x, y, over) {
				if (!over) return;
				const rect = button.getBoundingClientRect();
				const ox = fromCenter ? rect.width / 2 : x - rect.left;
				const oy = fromCenter ? rect.height / 2 : y - rect.top;
				const radius = Math.hypot(Math.max(ox, rect.width - ox), Math.max(oy, rect.height - oy));
				const wave = document.createElement('span');
				wave.className = 'ms-ripple__wave';
				wave.style.cssText = `left:${ox - radius}px;top:${oy - radius}px;width:${radius * 2}px;height:${radius * 2}px`;
				button.append(wave);
				wave
					.animate(
						[
							{ transform: 'scale(0)', opacity: alpha },
							{ transform: 'scale(1)', opacity: alpha, offset: 0.6 },
							{ transform: 'scale(1)', opacity: 0 },
						],
						{ duration, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
					)
					.finished.then(() => wave.remove())
					.catch(() => wave.remove());
			},
			onClick() {},
		}),
		() => {
			const { x, y } = centerOf(stage, button);
			return [
				{ x: 0.8, y: 0.88, move: 0, hold: 400 },
				...click(x - 0.06, y - 0.02, 700, 900),
				...click(x + 0.07, y + 0.02, 300, 900),
				{ x: 0.82, y: 0.88, move: 700, hold: 600 },
			];
		},
		(values) => {
			fromCenter = values.origin === 'center';
			alpha = Number(values.alpha) / 100;
			duration = Number(values.dur);
		},
	);
}

function likeDemo(stage: HTMLElement): Demo {
	const button = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	const heart = button.querySelector<SVGElement>('svg')!;
	const burst = stage.querySelector<HTMLElement>('[data-motion-burst]')!;
	const count = stage.querySelector<HTMLElement>('[data-motion-count]')!;
	let pop = 1.3;
	let particles = 6;
	let duration = 450;
	const reset = () => {
		button.classList.remove('is-liked');
		count.textContent = '128';
	};
	return pointerDemo(
		stage,
		clicker(button, {
			onClick() {
				const liked = !button.classList.contains('is-liked');
				button.classList.toggle('is-liked', liked);
				count.textContent = liked ? '129' : '128';
				if (!liked) return;
				heart.animate(
					[
						{ transform: 'scale(1)' },
						{ transform: `scale(${pop})`, offset: 0.35 },
						{ transform: 'scale(1)' },
					],
					{ duration, easing: EASE.out },
				);
				for (let index = 0; index < particles; index++) {
					const dot = document.createElement('i');
					const angle = (index / particles) * Math.PI * 2;
					burst.append(dot);
					dot
						.animate(
							[
								{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
								{
									transform: `translate(calc(-50% + ${Math.cos(angle) * 22}px), calc(-50% + ${Math.sin(angle) * 22}px)) scale(0.4)`,
									opacity: 0,
								},
							],
							{ duration: duration * 1.2, easing: EASE.out },
						)
						.finished.then(() => dot.remove())
						.catch(() => dot.remove());
				}
			},
		}),
		() => {
			const { x, y } = centerOf(stage, heart);
			return [
				{ x: 0.85, y: 0.92, move: 0, hold: 400 },
				...click(x, y, 800, 1600),
				...click(x, y, 0, 1000),
				{ x: 0.85, y: 0.92, move: 700, hold: 600 },
			];
		},
		(values) => {
			reset();
			pop = Number(values.pop) / 100;
			particles = values.particles === 'many' ? 12 : values.particles === 'few' ? 6 : 0;
			duration = Number(values.dur);
		},
	);
}

function toggleDemo(stage: HTMLElement): Demo {
	const toggle = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	let stretch = true;
	return pointerDemo(
		stage,
		clicker(toggle, {
			onDown(_x, _y, over) {
				if (over && stretch) toggle.classList.add('is-pressing');
			},
			onUp() {
				toggle.classList.remove('is-pressing');
			},
			onClick() {
				toggle.classList.toggle('is-on');
			},
		}),
		() => {
			const { x, y } = centerOf(stage, toggle);
			return [
				{ x: 0.5, y: 0.92, move: 0, hold: 400 },
				{ x, y, move: 700, hold: 250 },
				{ x, y, move: 0, hold: 450, act: 'down' },
				{ x, y, move: 0, hold: 1400, act: 'up' },
				{ x, y, move: 0, hold: 450, act: 'down' },
				{ x, y, move: 0, hold: 1000, act: 'up' },
				{ x: 0.5, y: 0.92, move: 700, hold: 500 },
			];
		},
		(values) => {
			toggle.classList.remove('is-on');
			stage.style.setProperty('--dur', `${values.dur}ms`);
			stage.style.setProperty('--ease', EASE[String(values.ease)]);
			stretch = values.stretch === 'yes';
		},
	);
}

function loadingDemo(stage: HTMLElement): Demo {
	const button = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	let showDone = true;
	let timer = 0;
	const idle = () => {
		window.clearTimeout(timer);
		button.dataset.state = 'idle';
	};
	return pointerDemo(
		stage,
		clicker(button, {
			onClick() {
				// 等待中再点没有反应：这正是加载状态要防的重复提交
				if (button.dataset.state !== 'idle') return;
				button.dataset.state = 'busy';
				timer = window.setTimeout(() => {
					if (!showDone) return idle();
					button.dataset.state = 'done';
					timer = window.setTimeout(idle, 1500);
				}, 1600);
			},
		}),
		() => {
			const { x, y } = centerOf(stage, button);
			return [
				{ x: 0.85, y: 0.94, move: 0, hold: 400 },
				...click(x, y, 800, 500),
				...click(x, y, 0, 3600),
				{ x: 0.85, y: 0.94, move: 700, hold: 600 },
			];
		},
		(values) => {
			idle();
			button.dataset.waiting = String(values.waiting);
			button.dataset.shape = String(values.shape);
			showDone = values.done === 'check';
		},
	);
}

function shakeDemo(stage: HTMLElement): Demo {
	const button = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	const field = stage.querySelector<HTMLElement>('[data-motion-field]')!;
	const error = stage.querySelector<HTMLElement>('[data-motion-error]')!;
	let amp = 8;
	let times = 3;
	let duration = 400;
	let timer = 0;
	const reset = () => {
		window.clearTimeout(timer);
		field.classList.remove('is-error');
		error.classList.remove('is-shown');
	};
	return pointerDemo(
		stage,
		clicker(button, {
			onClick() {
				reset();
				field.classList.add('is-error');
				error.classList.add('is-shown');
				const frames: Keyframe[] = [{ transform: 'translateX(0)' }];
				for (let index = 0; index < times; index++) {
					const fade = 1 - index / (times + 1);
					frames.push({ transform: `translateX(${-amp * fade}px)` });
					frames.push({ transform: `translateX(${amp * fade}px)` });
				}
				frames.push({ transform: 'translateX(0)' });
				field.animate(frames, { duration, easing: 'ease-in-out' });
				timer = window.setTimeout(reset, 2600);
			},
		}),
		() => {
			const { x, y } = centerOf(stage, button);
			return [
				{ x: 0.88, y: 0.96, move: 0, hold: 400 },
				...click(x, y, 800, 2800),
				{ x: 0.88, y: 0.96, move: 700, hold: 600 },
			];
		},
		(values) => {
			reset();
			amp = Number(values.amp);
			times = Number(values.count);
			duration = Number(values.dur);
		},
	);
}

function focusDemo(stage: HTMLElement): Demo {
	const field = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	const typed = stage.querySelector<HTMLElement>('[data-motion-typed]')!;
	const text = 'aqing@example.com';
	let timer = 0;
	const blur = () => {
		window.clearInterval(timer);
		typed.textContent = '';
		field.classList.remove('is-focused', 'has-value');
	};
	return pointerDemo(
		stage,
		clicker(field, {
			onDown(_x, _y, over) {
				if (!over) blur();
			},
			onLeave: blur,
			onClick() {
				if (field.classList.contains('is-focused')) return;
				field.classList.add('is-focused');
				let index = 0;
				timer = window.setInterval(() => {
					index += 1;
					typed.textContent = text.slice(0, index);
					field.classList.add('has-value');
					if (index >= text.length) window.clearInterval(timer);
				}, 90);
			},
		}),
		() => {
			const { x, y } = centerOf(stage, field);
			return [
				{ x: 0.88, y: 0.94, move: 0, hold: 400 },
				...click(x - 0.08, y, 800, 2600),
				...click(0.88, 0.94, 600, 1000),
			];
		},
		(values) => {
			blur();
			field.dataset.label = String(values.label);
			field.classList.toggle('has-ring', values.ring === 'ring');
			stage.style.setProperty('--dur', `${values.dur}ms`);
		},
	);
}

/* ---------- 粘性滚动叙事 ---------- */

function scrollyDemo(stage: HTMLElement): Demo {
	const box = stage.querySelector<HTMLElement>('[data-motion-scroll]')!;
	const steps = [...stage.querySelectorAll<HTMLElement>('[data-step]')];
	const screens = [...stage.querySelectorAll<HTMLElement>('[data-screen]')];
	let release = () => {};
	let active = -1;
	const update = () => {
		const middle = box.getBoundingClientRect().top + box.clientHeight / 2;
		let nearest = 0;
		let best = Infinity;
		steps.forEach((step, index) => {
			const rect = step.getBoundingClientRect();
			const distance = Math.abs(rect.top + rect.height / 2 - middle);
			if (distance < best) {
				best = distance;
				nearest = index;
			}
		});
		if (nearest === active) return;
		active = nearest;
		steps.forEach((step, index) => step.classList.toggle('is-active', index === nearest));
		screens.forEach((screen, index) => screen.classList.toggle('is-active', index === nearest));
	};
	box.addEventListener('scroll', update, { passive: true });
	return {
		prepare(values) {
			stage.dataset.swap = String(values.swap);
			stage.style.setProperty('--dur', `${values.dur}ms`);
			active = -1;
			update();
		},
		play(values, auto) {
			release();
			this.prepare!(values);
			release = scrollLoop(box, auto ? 3600 : 4400, () => {
				active = -1;
				update();
			});
		},
		stop() {
			release();
		},
	};
}

/* ---------- 复制成功 ---------- */

function copyDemo(stage: HTMLElement): Demo {
	const button = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	let hold = 1500;
	let timer = 0;
	const reset = () => {
		window.clearTimeout(timer);
		button.classList.remove('is-copied');
	};
	return pointerDemo(
		stage,
		clicker(button, {
			onClick() {
				if (button.classList.contains('is-copied')) return;
				button.classList.add('is-copied');
				timer = window.setTimeout(reset, hold);
			},
		}),
		() => {
			const { x, y } = centerOf(stage, button);
			return [
				{ x: 0.9, y: 0.92, move: 0, hold: 400 },
				...click(x, y, 800, hold + 900),
				{ x: 0.9, y: 0.92, move: 700, hold: 500 },
			];
		},
		(values) => {
			reset();
			button.dataset.tip = String(values.tip);
			button.dataset.swap = String(values.swap);
			hold = Number(values.hold);
		},
	);
}

/* ---------- 加入购物车 ---------- */

function cartDemo(stage: HTMLElement): Demo {
	const button = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	const thumb = stage.querySelector<HTMLElement>('[data-motion-thumb]')!;
	const cart = stage.querySelector<HTMLElement>('[data-motion-cart]')!;
	const count = stage.querySelector<HTMLElement>('[data-motion-count]')!;
	let duration = 700;
	let arc = true;
	let bump = 'both';
	return pointerDemo(
		stage,
		clicker(button, {
			onClick() {
				const box = stage.getBoundingClientRect();
				const from = thumb.getBoundingClientRect();
				const to = cart.getBoundingClientRect();
				const flyer = thumb.cloneNode(true) as HTMLElement;
				flyer.classList.add('ms-shop__flyer');
				flyer.style.left = `${from.left - box.left}px`;
				flyer.style.top = `${from.top - box.top}px`;
				stage.append(flyer);
				const dx = to.left + to.width / 2 - (from.left + from.width / 2);
				const dy = to.top + to.height / 2 - (from.top + from.height / 2);
				const middle = arc
					? `translate(${dx * 0.45}px, ${dy * 0.5 - 70}px) scale(0.7)`
					: `translate(${dx * 0.5}px, ${dy * 0.5}px) scale(0.7)`;
				flyer
					.animate(
						[
							{ transform: 'translate(0, 0) scale(1)', opacity: 1 },
							{ transform: middle, opacity: 1, offset: 0.5 },
							{ transform: `translate(${dx}px, ${dy}px) scale(0.25)`, opacity: 0.2 },
						],
						{ duration, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' },
					)
					.finished.then(() => {
						flyer.remove();
						const next = Number(count.textContent) + 1;
						count.textContent = String(next > 9 ? 3 : next);
						if (bump !== 'shake') {
							count.animate(
								[{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }],
								{ duration: 350, easing: EASE.out },
							);
						}
						if (bump !== 'count') {
							cart.animate(
								[
									{ transform: 'rotate(0)' },
									{ transform: 'rotate(-14deg)' },
									{ transform: 'rotate(10deg)' },
									{ transform: 'rotate(-5deg)' },
									{ transform: 'rotate(0)' },
								],
								{ duration: 450, easing: 'ease-in-out' },
							);
						}
					})
					.catch(() => flyer.remove());
			},
		}),
		() => {
			const { x, y } = centerOf(stage, button);
			return [
				{ x: 0.5, y: 0.94, move: 0, hold: 400 },
				...click(x, y, 800, duration + 1300),
				{ x: 0.5, y: 0.94, move: 700, hold: 500 },
			];
		},
		(values) => {
			count.textContent = '2';
			duration = Number(values.dur);
			arc = values.path === 'arc';
			bump = String(values.bump);
		},
	);
}

/* ---------- 打字机 ---------- */

function typewriterDemo(stage: HTMLElement): Demo {
	const typed = stage.querySelector<HTMLElement>('[data-motion-typed]')!;
	const sentences = ['把灵感随手记下来', '把会议整理成要点', '把读过的书串起来'];
	let timer = 0;
	const wait = (ms: number, next: () => void) => {
		timer = window.setTimeout(next, ms);
	};
	return {
		prepare(values) {
			stage.dataset.cursor = String(values.cursor);
		},
		play(values) {
			window.clearTimeout(timer);
			this.prepare!(values);
			const speed = Number(values.speed);
			const cycle = values.loop === 'cycle';
			let sentence = 0;
			const type = (index: number) => {
				const text = sentences[sentence];
				typed.textContent = text.slice(0, index);
				if (index < text.length) return wait(speed, () => type(index + 1));
				if (!cycle) return wait(2600, () => type(0));
				wait(1500, () => erase(text.length));
			};
			const erase = (index: number) => {
				typed.textContent = sentences[sentence].slice(0, index);
				if (index > 0) return wait(Math.max(25, speed / 2), () => erase(index - 1));
				sentence = (sentence + 1) % sentences.length;
				wait(350, () => type(1));
			};
			type(0);
		},
		stop() {
			window.clearTimeout(timer);
		},
	};
}

/* ---------- 逐字出现 ---------- */

function textRevealDemo(stage: HTMLElement): Demo {
	const root = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	const all = [
		...root.querySelectorAll<HTMLElement>('.ms-reveal__line, .ms-reveal__word, .ms-reveal__char'),
	];
	const FROM: Record<string, Keyframe> = {
		up: { opacity: 0, transform: 'translateY(12px)' },
		blur: { opacity: 0, filter: 'blur(8px)' },
		mask: { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(40%)' },
	};
	const TO: Record<string, Keyframe> = {
		up: { opacity: 1, transform: 'none' },
		blur: { opacity: 1, filter: 'blur(0)' },
		mask: { clipPath: 'inset(0 0 0 0)', transform: 'none' },
	};
	let timer = 0;
	return {
		play(values) {
			window.clearTimeout(timer);
			cancelAll([root, ...all]);
			const selector = {
				char: '.ms-reveal__char',
				word: '.ms-reveal__word',
				line: '.ms-reveal__line',
			}[String(values.unit) as 'char' | 'word' | 'line'];
			const units = [...root.querySelectorAll<HTMLElement>(selector)];
			const gap = Number(values.gap);
			const style = String(values.style);
			units.forEach((unit, index) =>
				unit.animate([FROM[style], TO[style]], {
					duration: 600,
					delay: index * gap,
					easing: EASE.out,
					fill: 'both',
				}),
			);
			// 全部出现后停一会儿，淡出再来一遍
			timer = window.setTimeout(
				() => {
					root
						.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })
						.finished.then(() => this.play(values, true))
						.catch(() => {});
				},
				units.length * gap + 600 + 2200,
			);
		},
		stop() {
			window.clearTimeout(timer);
		},
	};
}

/* ---------- 跑马灯 ---------- */

function marqueeDemo(stage: HTMLElement): Demo {
	const marquee = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	const track = stage.querySelector<HTMLElement>('[data-motion-track]')!;
	let animation: Animation | null = null;
	let hoverRate = 0.33;
	stage.addEventListener('pointerenter', () => animation?.updatePlaybackRate(hoverRate));
	stage.addEventListener('pointerleave', () => animation?.updatePlaybackRate(1));
	return {
		prepare(values) {
			marquee.classList.toggle('has-fade', values.edge === 'fade');
			hoverRate = values.hover === 'pause' ? 0 : values.hover === 'slow' ? 0.33 : 1;
		},
		play(values) {
			this.prepare!(values);
			animation?.cancel();
			const half = track.scrollWidth / 2;
			const frames =
				values.dir === 'left'
					? [{ transform: 'translateX(0)' }, { transform: `translateX(${-half}px)` }]
					: [{ transform: `translateX(${-half}px)` }, { transform: 'translateX(0)' }];
			animation = track.animate(frames, {
				duration: (half / Number(values.speed)) * 1000,
				iterations: Infinity,
				easing: 'linear',
			});
		},
		stop() {
			animation?.cancel();
		},
	};
}

/* ---------- 渐变流动 ---------- */

function gradientDemo(stage: HTMLElement): Demo {
	const root = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	const blobs = [...root.querySelectorAll<HTMLElement>('.ms-blob')];
	const paths = [
		[
			'translate(-30%, -20%)',
			'translate(40%, 10%)',
			'translate(10%, 50%)',
			'translate(-30%, -20%)',
		],
		['translate(60%, 40%)', 'translate(-10%, 20%)', 'translate(30%, -30%)', 'translate(60%, 40%)'],
		['translate(10%, 60%)', 'translate(50%, -10%)', 'translate(-20%, 20%)', 'translate(10%, 60%)'],
	];
	return {
		prepare(values) {
			root.dataset.palette = String(values.palette);
			root.style.setProperty('--strength', `${values.strength}%`);
		},
		play(values) {
			this.prepare!(values);
			cancelAll(blobs);
			blobs.forEach((blob, index) =>
				blob.animate(
					paths[index].map((transform) => ({ transform })),
					{
						duration: Number(values.cycle),
						delay: (-Number(values.cycle) * index) / 3,
						iterations: Infinity,
						easing: 'ease-in-out',
					},
				),
			);
		},
		stop() {
			cancelAll(blobs);
		},
	};
}

/* ---------- 展开收起 ---------- */

function expandDemo(stage: HTMLElement): Demo {
	const toggle = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	const body = stage.querySelector<HTMLElement>('[data-motion-body]')!;
	const label = stage.querySelector<HTMLElement>('[data-motion-label]')!;
	const extra = [...body.querySelectorAll<HTMLElement>('li')].slice(2);
	const collapsed = 64;
	let duration = 300;
	let easing = EASE.out;
	let fade = true;
	let open = false;
	const set = (next: boolean, animate: boolean) => {
		const from = body.offsetHeight;
		open = next;
		const to = open ? body.scrollHeight : collapsed;
		toggle.classList.toggle('is-open', open);
		label.textContent = open ? '收起' : '展开全部';
		cancelAll([body, ...extra]);
		body.style.height = `${to}px`;
		if (!animate) return;
		body.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration, easing });
		if (open && fade) {
			extra.forEach((item, index) =>
				item.animate([{ opacity: 0 }, { opacity: 1 }], {
					duration: duration * 0.8,
					delay: duration * 0.25 + index * 40,
					fill: 'backwards',
				}),
			);
		}
	};
	return pointerDemo(
		stage,
		clicker(toggle, { onClick: () => set(!open, true) }),
		() => {
			const { x, y } = centerOf(stage, toggle);
			return [
				{ x: 0.85, y: 0.94, move: 0, hold: 400 },
				...click(x, y, 800, 1800),
				...click(x, y, 0, 1200),
				{ x: 0.85, y: 0.94, move: 700, hold: 400 },
			];
		},
		(values) => {
			duration = Number(values.dur);
			easing = EASE[String(values.ease)];
			fade = values.fade === 'fade';
			toggle.classList.toggle('turns', values.arrow === 'turn');
			set(false, false);
		},
	);
}

/* ---------- 页面转场 ---------- */

/** 列表页、详情页之间的点击：在列表点「打开」，在详情点「返回」 */
function pageClicks(app: HTMLElement, onOpen: () => void, onBack: () => void): PointerHandlers {
	let x = 0;
	let y = 0;
	let target: 'open' | 'back' | null = null;
	const hit = () => {
		const current = app.querySelector<HTMLElement>('.is-current')?.dataset.page;
		const open = app.querySelector('[data-motion-open]')!;
		const back = app.querySelector('[data-motion-back]')!;
		if (current === 'list' && inside(open, x, y)) return 'open';
		if (current === 'detail' && inside(back, x, y)) return 'back';
		return null;
	};
	return {
		move(nextX, nextY) {
			x = nextX;
			y = nextY;
			const over = hit();
			app.querySelector('[data-motion-open]')!.classList.toggle('is-hover', over === 'open');
			app.querySelector('[data-motion-back]')!.classList.toggle('is-hover', over === 'back');
		},
		leave() {
			target = null;
		},
		down() {
			target = hit();
		},
		up() {
			if (target && target === hit()) (target === 'open' ? onOpen : onBack)();
			target = null;
		},
	};
}

function pageRoute(stage: HTMLElement, open: Element, back: Element): Waypoint[] {
	const a = centerOf(stage, open);
	const b = centerOf(stage, back);
	return [
		{ x: 0.85, y: 0.94, move: 0, hold: 400 },
		...click(a.x, a.y, 800, 1800),
		...click(b.x, b.y, 700, 1300),
		{ x: 0.85, y: 0.94, move: 700, hold: 400 },
	];
}

function pageTransitionDemo(stage: HTMLElement): Demo {
	const app = stage.querySelector<HTMLElement>('[data-motion-app]')!;
	const list = app.querySelector<HTMLElement>('[data-page="list"]')!;
	const detail = app.querySelector<HTMLElement>('[data-page="detail"]')!;
	let kind = 'slide';
	let duration = 300;
	let busy = false;
	const go = (to: HTMLElement, from: HTMLElement, forward: boolean) => {
		if (busy) return;
		busy = true;
		const sign = forward ? 1 : -1;
		const FRAMES: Record<string, [Keyframe[], Keyframe[]]> = {
			fade: [
				[{ opacity: 1 }, { opacity: 0 }],
				[{ opacity: 0 }, { opacity: 1 }],
			],
			slide: [
				[{ transform: 'none' }, { transform: `translateX(${-30 * sign}%)`, opacity: 0.4 }],
				[{ transform: `translateX(${100 * sign}%)` }, { transform: 'none' }],
			],
			up: [
				[{ opacity: 1 }, { opacity: 0 }],
				[
					{ opacity: 0, transform: 'translateY(16px)' },
					{ opacity: 1, transform: 'none' },
				],
			],
			zoom: [
				[
					{ opacity: 1, transform: 'scale(1)' },
					{ opacity: 0, transform: 'scale(0.96)' },
				],
				[
					{ opacity: 0, transform: 'scale(1.04)' },
					{ opacity: 1, transform: 'none' },
				],
			],
		};
		const [out, enter] = FRAMES[kind];
		to.classList.add('is-current', 'is-entering');
		from.animate(out, { duration, easing: EASE.out, fill: 'forwards' });
		to.animate(enter, { duration, easing: EASE.out })
			.finished.then(() => {
				from.classList.remove('is-current');
				to.classList.remove('is-entering');
				cancelAll([from]);
				busy = false;
			})
			.catch(() => (busy = false));
	};
	const showList = () => {
		cancelAll([list, detail]);
		detail.classList.remove('is-current', 'is-entering');
		list.classList.add('is-current');
		busy = false;
	};
	return pointerDemo(
		stage,
		pageClicks(
			app,
			() => go(detail, list, true),
			() => go(list, detail, false),
		),
		() =>
			pageRoute(
				stage,
				list.querySelector('[data-motion-open]')!,
				detail.querySelector('[data-motion-back]')!,
			),
		(values) => {
			kind = String(values.kind);
			duration = Number(values.dur);
			showList();
		},
	);
}

/* ---------- 共享元素转场 ---------- */

function sharedElementDemo(stage: HTMLElement): Demo {
	const app = stage.querySelector<HTMLElement>('[data-motion-app]')!;
	const list = app.querySelector<HTMLElement>('[data-page="list"]')!;
	const detail = app.querySelector<HTMLElement>('[data-page="detail"]')!;
	const cover = app.querySelector<HTMLElement>('[data-motion-cover]')!;
	const hero = app.querySelector<HTMLElement>('[data-motion-hero]')!;
	const rest = app.querySelector<HTMLElement>('[data-motion-rest]')!;
	const flyer = app.querySelector<HTMLElement>('[data-motion-flyer]')!;
	let duration = 450;
	let easing = EASE.out;
	let fadeRest = true;
	let busy = false;
	const box = (element: HTMLElement) => {
		const base = app.getBoundingClientRect();
		const rect = element.getBoundingClientRect();
		return {
			left: `${rect.left - base.left}px`,
			top: `${rect.top - base.top}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`,
			fontSize: getComputedStyle(element).fontSize,
		};
	};
	const fly = (from: HTMLElement, to: HTMLElement) => {
		flyer.className = `${cover.className} ms-shared__flyer is-flying`;
		return flyer.animate([box(from), box(to)], { duration, easing, fill: 'forwards' });
	};
	const open = () => {
		if (busy) return;
		busy = true;
		const start = box(cover);
		detail.classList.add('is-current');
		hero.style.opacity = '0';
		rest.style.opacity = '0';
		flyer.className = `${cover.className} ms-shared__flyer is-flying`;
		cover.style.opacity = '0';
		list.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration * 0.5, fill: 'forwards' });
		flyer
			.animate([start, box(hero)], { duration, easing, fill: 'forwards' })
			.finished.then(() => {
				hero.style.opacity = '';
				flyer.classList.remove('is-flying');
				list.classList.remove('is-current');
				cancelAll([list]);
				rest.style.opacity = '';
				if (fadeRest) {
					rest.animate(
						[
							{ opacity: 0, transform: 'translateY(8px)' },
							{ opacity: 1, transform: 'none' },
						],
						{ duration: 250, easing: EASE.out },
					);
				}
				busy = false;
			})
			.catch(() => (busy = false));
	};
	const back = () => {
		if (busy) return;
		busy = true;
		list.classList.add('is-current');
		list.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duration * 0.6 });
		rest.style.opacity = '0';
		hero.style.opacity = '0';
		fly(hero, cover)
			.finished.then(() => {
				cover.style.opacity = '';
				flyer.classList.remove('is-flying');
				detail.classList.remove('is-current');
				hero.style.opacity = '';
				rest.style.opacity = '';
				busy = false;
			})
			.catch(() => (busy = false));
	};
	const reset = () => {
		cancelAll([list, flyer, rest]);
		flyer.classList.remove('is-flying');
		detail.classList.remove('is-current');
		list.classList.add('is-current');
		cover.style.opacity = '';
		hero.style.opacity = '';
		rest.style.opacity = '';
		busy = false;
	};
	return pointerDemo(
		stage,
		pageClicks(app, open, back),
		() =>
			pageRoute(
				stage,
				list.querySelector('[data-motion-open]')!,
				detail.querySelector('[data-motion-back]')!,
			),
		(values) => {
			duration = Number(values.dur);
			easing = EASE[String(values.ease)];
			fadeRest = values.rest === 'fade';
			reset();
		},
	);
}

/* ---------- 拖拽排序 ---------- */

function dragDemo(stage: HTMLElement): Demo {
	const list = stage.querySelector<HTMLElement>('[data-motion-list]')!;
	const items = () => [...list.querySelectorAll<HTMLElement>('[data-motion-item]')];
	let duration = 200;
	let drop = EASE.out;
	let x = 0;
	let y = 0;
	let dragged: HTMLElement | null = null;
	let startY = 0;
	let origin = 0;
	let target = 0;
	let step = 0;
	const clear = () => {
		for (const item of items()) {
			cancelAll([item]);
			item.style.transition = '';
			item.style.transform = '';
			item.classList.remove('is-lifted');
		}
	};
	return pointerDemo(
		stage,
		{
			move(nextX, nextY) {
				x = nextX;
				y = nextY;
				if (!dragged) return;
				const all = items();
				const dy = y - startY;
				dragged.style.transform = `translateY(${dy}px)`;
				target = Math.max(0, Math.min(all.length - 1, origin + Math.round(dy / step)));
				all.forEach((item, index) => {
					if (item === dragged) return;
					let shift = 0;
					if (target > origin && index > origin && index <= target) shift = -step;
					if (target < origin && index >= target && index < origin) shift = step;
					item.style.transition = `transform ${duration}ms ${EASE.out}`;
					item.style.transform = shift ? `translateY(${shift}px)` : '';
				});
			},
			leave() {
				if (dragged) this.up();
			},
			down() {
				const all = items();
				const hit = all.find((item) => inside(item, x, y));
				if (!hit) return;
				dragged = hit;
				origin = all.indexOf(hit);
				target = origin;
				startY = y;
				step =
					all.length > 1
						? all[1].getBoundingClientRect().top - all[0].getBoundingClientRect().top
						: 48;
				hit.style.transition = 'box-shadow 0.15s, scale 0.15s, rotate 0.15s';
				hit.classList.add('is-lifted');
			},
			up() {
				if (!dragged) return;
				const item = dragged;
				dragged = null;
				const offset = (target - origin) * step;
				const current = new DOMMatrix(getComputedStyle(item).transform).f;
				item.classList.remove('is-lifted');
				item
					.animate(
						[{ transform: `translateY(${current}px)` }, { transform: `translateY(${offset}px)` }],
						{ duration: duration * 1.3, easing: drop, fill: 'forwards' },
					)
					.finished.then(() => {
						const all = items();
						const reference = all[target + (target > origin ? 1 : 0)] ?? null;
						clear();
						list.insertBefore(item, reference === item ? item.nextSibling : reference);
					})
					.catch(clear);
			},
		},
		() => {
			const all = items();
			const first = centerOf(stage, all[0]);
			const third = centerOf(stage, all[2]);
			return [
				{ x: 0.88, y: 0.92, move: 0, hold: 400 },
				{ x: first.x, y: first.y, move: 800, hold: 250 },
				{ x: first.x, y: first.y, move: 0, hold: 350, act: 'down' },
				{ x: third.x, y: third.y, move: 900, hold: 200 },
				{ x: third.x, y: third.y, move: 0, hold: 1400, act: 'up' },
				{ x: third.x, y: third.y, move: 0, hold: 350, act: 'down' },
				{ x: first.x, y: first.y, move: 900, hold: 200 },
				{ x: first.x, y: first.y, move: 0, hold: 1200, act: 'up' },
				{ x: 0.88, y: 0.92, move: 700, hold: 400 },
			];
		},
		(values) => {
			list.dataset.lift = String(values.lift);
			duration = Number(values.dur);
			drop = values.drop === 'spring' ? EASE.back : EASE.out;
		},
	);
}

/* ---------- 滑动删除 ---------- */

function swipeDemo(stage: HTMLElement): Demo {
	const rows = [...stage.querySelectorAll<HTMLElement>('[data-motion-item]')];
	let width = 80;
	let auto = true;
	let duration = 250;
	let x = 0;
	let y = 0;
	let row: HTMLElement | null = null;
	let startX = 0;
	let base = 0;
	let moved = false;
	let timer = 0;
	const content = (item: HTMLElement) => item.querySelector<HTMLElement>('.ms-inbox__content')!;
	const offsetOf = (item: HTMLElement) => Number(item.dataset.offset ?? 0);
	const slide = (item: HTMLElement, to: number) => {
		item.dataset.offset = String(to);
		content(item).style.transition = `transform ${duration}ms ${EASE.out}`;
		content(item).style.transform = to ? `translateX(${to}px)` : '';
	};
	const restore = () => {
		window.clearTimeout(timer);
		for (const item of rows) {
			cancelAll([item, content(item)]);
			item.classList.remove('is-gone');
			item.style.height = '';
			slide(item, 0);
		}
	};
	const remove = (item: HTMLElement) => {
		const inner = content(item);
		inner.style.transition = `transform ${duration}ms ${EASE.in}`;
		inner.style.transform = 'translateX(-110%)';
		item.animate([{ height: `${item.offsetHeight}px` }, { height: '0px' }], {
			duration,
			delay: duration,
			easing: EASE.out,
			fill: 'forwards',
		});
		item.classList.add('is-gone');
		timer = window.setTimeout(restore, duration * 2 + 1600);
	};
	return pointerDemo(
		stage,
		{
			move(nextX, nextY) {
				x = nextX;
				y = nextY;
				if (!row) return;
				const dx = Math.min(0, base + x - startX);
				if (Math.abs(x - startX) > 3) moved = true;
				content(row).style.transition = 'none';
				content(row).style.transform = `translateX(${dx}px)`;
			},
			leave() {
				if (row) this.up();
			},
			down() {
				row =
					rows.find((item) => !item.classList.contains('is-gone') && inside(item, x, y)) ?? null;
				if (!row) return;
				startX = x;
				base = offsetOf(row);
				moved = false;
				for (const other of rows) if (other !== row && offsetOf(other)) slide(other, 0);
			},
			up() {
				if (!row) return;
				const item = row;
				row = null;
				// 没拖动、只是点了一下：点在露出的删除按钮上就删除，否则合上
				if (!moved) {
					const deleteZone = item.getBoundingClientRect().right - width;
					if (offsetOf(item) && x >= deleteZone) return remove(item);
					return slide(item, 0);
				}
				const dx = Math.min(0, base + x - startX);
				if (auto && dx < -item.offsetWidth / 2) return remove(item);
				slide(item, dx < -width / 2 ? -width : 0);
			},
		},
		() => {
			const target = rows[1].getBoundingClientRect();
			const { x: cx, y: cy } = centerOf(stage, rows[1]);
			const stageWidth = stage.getBoundingClientRect().width;
			const reach = (target.width * 0.62) / stageWidth;
			const deleteX = (target.right - width / 2 - stage.getBoundingClientRect().left) / stageWidth;
			return [
				{ x: 0.88, y: 0.94, move: 0, hold: 400 },
				{ x: cx + 0.15, y: cy, move: 800, hold: 250 },
				{ x: cx + 0.15, y: cy, move: 0, hold: 150, act: 'down' },
				{ x: cx + 0.15 - reach, y: cy, move: 700, hold: 100 },
				{ x: cx + 0.15 - reach, y: cy, move: 0, hold: 900, act: 'up' },
				...click(deleteX, cy, 500, 2600),
				{ x: 0.88, y: 0.94, move: 700, hold: 400 },
			];
		},
		(values) => {
			width = Number(values.width);
			auto = values.release === 'auto';
			duration = Number(values.dur);
			stage.style.setProperty('--swipe-w', `${width}px`);
			restore();
		},
	);
}

/* ---------- 下拉刷新 ---------- */

function pullDemo(stage: HTMLElement): Demo {
	const area = stage.querySelector<HTMLElement>('[data-motion-target]')!;
	const list = stage.querySelector<HTMLElement>('[data-motion-list]')!;
	const indicator = stage.querySelector<HTMLElement>('[data-motion-indicator]')!;
	let distance = 70;
	let release = EASE.back;
	let x = 0;
	let y = 0;
	let pulling = false;
	let startY = 0;
	let pull = 0;
	let timer = 0;
	const place = (value: number, transition: string) => {
		pull = value;
		list.style.transition = transition;
		indicator.style.transition = transition;
		list.style.transform = value ? `translateY(${value}px)` : '';
		indicator.style.transform = `translateY(${value - 40}px)`;
		indicator.style.setProperty('--progress', String(Math.min(1, value / distance)));
		indicator.classList.toggle('is-ready', value >= distance);
	};
	const reset = () => {
		window.clearTimeout(timer);
		pulling = false;
		indicator.classList.remove('is-refreshing');
		list.querySelector('.is-new')?.remove();
		place(0, 'none');
	};
	return pointerDemo(
		stage,
		{
			move(nextX, nextY) {
				x = nextX;
				y = nextY;
				if (!pulling) return;
				// 越拉阻力越大
				const dy = Math.max(0, y - startY);
				const limit = distance * 1.8;
				place(limit * (1 - Math.exp(-dy / limit)), 'none');
			},
			leave() {
				if (pulling) this.up();
			},
			down() {
				if (indicator.classList.contains('is-refreshing') || !inside(area, x, y)) return;
				pulling = true;
				startY = y;
			},
			up() {
				if (!pulling) return;
				pulling = false;
				if (pull < distance) return place(0, `transform 300ms ${EASE.out}`);
				indicator.classList.add('is-refreshing');
				place(distance * 0.8, `transform 200ms ${EASE.out}`);
				timer = window.setTimeout(() => {
					list.querySelector('.is-new')?.remove();
					const fresh = list.querySelector('.ms-app__row')!.cloneNode(true) as HTMLElement;
					fresh.classList.add('is-new');
					fresh.querySelector('strong')!.textContent = '刚刚同步：周末菜单';
					fresh.querySelector('small')!.textContent = '生活 · 刚刚';
					list.querySelector('.ms-list__title')!.after(fresh);
					indicator.classList.remove('is-refreshing');
					place(0, `transform 450ms ${release}`);
				}, 1300);
			},
		},
		() => {
			const rect = area.getBoundingClientRect();
			const box = stage.getBoundingClientRect();
			const cx = (rect.left + rect.width / 2 - box.left) / box.width;
			const top = (rect.top + 60 - box.top) / box.height;
			const reach = (distance * 2.4) / box.height;
			return [
				{ x: 0.9, y: 0.94, move: 0, hold: 400 },
				{ x: cx, y: top, move: 800, hold: 250 },
				{ x: cx, y: top, move: 0, hold: 150, act: 'down' },
				{ x: cx, y: top + reach, move: 900, hold: 200 },
				{ x: cx, y: top + reach, move: 0, hold: 2600, act: 'up' },
				{ x: 0.9, y: 0.94, move: 700, hold: 400 },
			];
		},
		(values) => {
			distance = Number(values.dist);
			release = values.bounce === 'spring' ? EASE.back : EASE.out;
			area.dataset.indicator = String(values.indicator);
			reset();
		},
	);
}

const DEMOS: Record<MotionProfile['demo'], (stage: HTMLElement) => Demo> = {
	duration: durationDemo,
	easing: easingDemo,
	spring: springDemo,
	reveal: revealDemo,
	stagger: staggerDemo,
	parallax: parallaxDemo,
	countup: countupDemo,
	lift: liftDemo,
	press: pressDemo,
	magnetic: magneticDemo,
	spotlight: spotlightDemo,
	tilt: tiltDemo,
	ripple: rippleDemo,
	like: likeDemo,
	toggle: toggleDemo,
	loading: loadingDemo,
	shake: shakeDemo,
	focus: focusDemo,
	scrolly: scrollyDemo,
	copy: copyDemo,
	cart: cartDemo,
	typewriter: typewriterDemo,
	textReveal: textRevealDemo,
	marquee: marqueeDemo,
	gradient: gradientDemo,
	expand: expandDemo,
	pageTransition: pageTransitionDemo,
	sharedElement: sharedElementDemo,
	drag: dragDemo,
	swipe: swipeDemo,
	pull: pullDemo,
};

function setupTuner(root: HTMLElement): () => void {
	const profile = JSON.parse(root.dataset.motionConfig!) as MotionProfile;
	const stage = root.querySelector<HTMLElement>('[data-motion-stage]')!;
	const prompt = root.querySelector<HTMLElement>('[data-motion-prompt]')!;
	const presets = [...root.querySelectorAll<HTMLButtonElement>('[data-motion-preset]')];
	const demo = DEMOS[profile.demo](stage);
	const values: MotionValues = defaultMotionValues(profile);

	const sync = () => {
		for (const control of profile.controls) {
			const value = values[control.id];
			if (control.type === 'range') {
				const input = root.querySelector<HTMLInputElement>(`[data-motion-input="${control.id}"]`)!;
				input.value = String(value);
				root.querySelector(`[data-motion-output="${control.id}"]`)!.textContent = formatMotionValue(
					control,
					value,
				);
			} else {
				for (const button of root.querySelectorAll<HTMLButtonElement>(
					`[data-motion-choice="${control.id}"]`,
				)) {
					button.setAttribute('aria-pressed', String(button.dataset.value === String(value)));
				}
			}
		}
		// 「只淡入」用不到移动距离
		const distance = root.querySelector<HTMLElement>('[data-motion-control="dist"]');
		if (distance)
			distance.classList.toggle('is-idle', values.kind === 'fade' || values.kind === 'scale');
		presets.forEach((button, index) => {
			const preset = profile.presets[index];
			const matches = Object.entries(preset.values).every(
				([id, value]) => String(values[id]) === String(value),
			);
			button.setAttribute('aria-pressed', String(matches));
		});
		prompt.textContent = renderMotionPrompt(profile, values);
	};

	const replay = (auto: boolean) => {
		sync();
		demo.play(values, auto);
	};

	root.addEventListener('input', (event) => {
		const input = (event.target as HTMLElement).closest<HTMLInputElement>('[data-motion-input]');
		if (!input) return;
		values[input.dataset.motionInput!] = Number(input.value);
		sync();
	});
	// 拖动时只改文字，松手再重播，免得舞台跟着抖
	root.addEventListener('change', (event) => {
		if ((event.target as HTMLElement).closest('[data-motion-input]')) replay(true);
	});
	root.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;
		const choice = target.closest<HTMLButtonElement>('[data-motion-choice]');
		if (choice) {
			values[choice.dataset.motionChoice!] = choice.dataset.value!;
			replay(true);
			return;
		}
		const preset = target.closest<HTMLButtonElement>('[data-motion-preset]');
		if (preset) {
			Object.assign(values, profile.presets[Number(preset.dataset.motionPreset)].values);
			replay(true);
			return;
		}
		if (target.closest('[data-motion-replay]')) {
			replay(false);
			return;
		}
		const copy = target.closest<HTMLButtonElement>('[data-motion-copy]');
		if (copy) {
			const label = copy.querySelector('[data-motion-copy-label]')!;
			navigator.clipboard
				?.writeText(prompt.textContent ?? '')
				.then(() => {
					label.textContent = '已复制';
					window.setTimeout(() => (label.textContent = '复制'), 1500);
				})
				.catch(() => {});
		}
	});

	sync();
	demo.prepare?.(values);
	// 系统开了「减少动态效果」：不自动播放，等用户自己点重播
	if (!reducedMotion.matches) {
		const observer = new IntersectionObserver((entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			observer.disconnect();
			demo.play(values, false);
		});
		observer.observe(stage);
	} else {
		root.classList.add('is-reduced');
	}
	return () => demo.stop();
}

let cleanups: (() => void)[] = [];

function initMotionTuners() {
	for (const cleanup of cleanups) cleanup();
	cleanups = [...document.querySelectorAll<HTMLElement>('[data-motion-tuner]')].map(setupTuner);
}

document.addEventListener('astro:page-load', initMotionTuners);
document.addEventListener('astro:before-swap', () => {
	for (const cleanup of cleanups) cleanup();
	cleanups = [];
});
