export interface PortalRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function portalEase(start: number, end: number, progress: number) {
	const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
	return t * t * (3 - 2 * t);
}

/** Layout and scroll offsets can round differently at the end of a short page. */
export function brainPodPortalProgress(scrollY: number, start: number, end: number) {
	if (scrollY >= end - 1) return 1;
	return Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
}

/** A reversible camera move. Coordinates are measured in the unscaled poster. */
export function brainPodPortalFrame(
	progress: number,
	screen: PortalRect,
	viewport: { width: number; height: number },
	pinTop: number,
) {
	const centerX = screen.x + screen.width / 2;
	const centerY = screen.y + screen.height / 2;
	const cover = Math.max(viewport.width / screen.width, viewport.height / screen.height) * 1.08;
	const scale = Math.pow(Math.max(1, cover), portalEase(0.06, 1, progress));
	const aim = portalEase(0, 0.52, progress);
	const x = (viewport.width / 2 - centerX) * aim - centerX * (scale - 1);
	const y = (viewport.height / 2 - pinTop - centerY) * aim - centerY * (scale - 1);
	return {
		scale,
		x,
		y,
		window: {
			x: screen.x * scale + x,
			y: screen.y * scale + y + pinTop,
			width: screen.width * scale,
			height: screen.height * scale,
		},
	};
}
