import { describe, expect, it } from 'vitest';
import {
	brainPodPortalFrame,
	brainPodPortalPageMode,
	brainPodPortalProgress,
	brainPodPortalWorldState,
	portalEase,
} from './brainpodPortal';

describe('BrainPod scroll entrance', () => {
	it('keeps page navigation windowed until fullscreen, including after reverse scrolling', () => {
		expect(
			[0, 0.3, 0.5, 0.9, 0.2, 0.7, 1].map((p) => brainPodPortalPageMode(p, true, false)),
		).toEqual(['hidden', 'hidden', 'windowed', 'windowed', 'hidden', 'windowed', 'fullscreen']);
		expect(brainPodPortalPageMode(0.5, false, false)).toBe('fullscreen');
		expect(brainPodPortalPageMode(1, true, true)).toBe('hidden');
		expect(brainPodPortalPageMode(0.5, false, true)).toBe('hidden');
	});
	it('releases the directory when browser rounding stops short of the scroll endpoint', () => {
		// Observed in the in-app browser at a 997px viewport and devicePixelRatio 2.
		expect(brainPodPortalProgress(2093.5, 0, 997 * 2.1)).toBe(1);
		expect(brainPodPortalProgress(2093, 0, 997 * 2.1)).toBe(1);
		expect(brainPodPortalProgress(2100, 0, 997 * 2.1)).toBe(1);
	});
	it('tracks intermediate and reverse scroll independently of click availability', () => {
		expect(brainPodPortalProgress(2092, 0, 997 * 2.1)).toBeLessThan(1);
		expect(brainPodPortalProgress(1000, 0, 2000)).toBe(0.5);
		expect(brainPodPortalProgress(-10, 0, 2000)).toBe(0);
	});
	it('makes the page interactive as soon as it appears and disables it when hidden again', () => {
		for (const progress of [0.31, 0.48, 0.6, 0.85, 1, 0.5]) {
			expect(brainPodPortalWorldState(progress)).toMatchObject({
				visible: true,
				interactive: true,
			});
		}
		for (const progress of [0.3, 0.2, 0, -1]) {
			expect(brainPodPortalWorldState(progress)).toEqual({
				opacity: 0,
				visible: false,
				interactive: false,
			});
		}
	});
	it('never enables the page while the device is locked', () => {
		for (const progress of [0, 0.31, 0.5, 0.9, 1]) {
			expect(brainPodPortalWorldState(progress, true).interactive).toBe(false);
		}
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
