import { describe, expect, it } from 'vitest';
import { brainPodPortalFrame, brainPodPortalProgress, portalEase } from './brainpodPortal';

describe('BrainPod scroll entrance', () => {
	it('releases the directory when browser rounding stops short of the scroll endpoint', () => {
		// Observed in the in-app browser at a 997px viewport and devicePixelRatio 2.
		expect(brainPodPortalProgress(2093.5, 0, 997 * 2.1)).toBe(1);
		expect(brainPodPortalProgress(2093, 0, 997 * 2.1)).toBe(1);
		expect(brainPodPortalProgress(2100, 0, 997 * 2.1)).toBe(1);
	});
	it('keeps the room locked during the transition and restores it on reverse scroll', () => {
		expect(brainPodPortalProgress(2092, 0, 997 * 2.1)).toBeLessThan(1);
		expect(brainPodPortalProgress(1000, 0, 2000)).toBe(0.5);
		expect(brainPodPortalProgress(-10, 0, 2000)).toBe(0);
	});
	const screen = { x: 562, y: 236, width: 234, height: 176 };
	it('starts with the original poster camera and clamps overscroll', () => {
		const frame = brainPodPortalFrame(-1, screen, { width: 1440, height: 900 }, 0);
		expect(frame).toMatchObject({ x: 0, y: 0, scale: 1, window: screen });
		expect(portalEase(0, 1, -0.5)).toBe(0);
		expect(portalEase(0, 1, 1.5)).toBe(1);
	});
	it.each([
		{ width: 1440, height: 900, top: 0 },
		{ width: 390, height: 844, top: -353 },
		{ width: 320, height: 700, top: -550 },
		{ width: 1920, height: 1080, top: 0 },
	])('covers the entire viewport at the handoff: $width × $height', ({ width, height, top }) => {
		const frame = brainPodPortalFrame(1, screen, { width, height }, top);
		expect(frame.window.x).toBeLessThanOrEqual(0);
		expect(frame.window.y).toBeLessThanOrEqual(0);
		expect(frame.window.x + frame.window.width).toBeGreaterThanOrEqual(width);
		expect(frame.window.y + frame.window.height).toBeGreaterThanOrEqual(height);
	});
	it('retraces the same camera path on reverse scroll without accumulating drift', () => {
		const viewport = { width: 1440, height: 900 };
		const points = [0, 0.1, 0.3, 0.5, 0.8, 0.99, 1];
		const forward = points.map((p) => brainPodPortalFrame(p, screen, viewport, 0));
		const reverse = [...points].reverse().map((p) => brainPodPortalFrame(p, screen, viewport, 0));
		expect(reverse.reverse()).toEqual(forward);
		for (let i = 1; i < forward.length; i++) {
			expect(forward[i].scale).toBeGreaterThanOrEqual(forward[i - 1].scale);
		}
	});
});
