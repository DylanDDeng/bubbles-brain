import { describe, expect, it } from 'vitest';
import { createBrainPodDiscoveryOrder } from './brainpodSeed';

describe('BrainPod poster seed', () => {
	const library = Array.from({ length: 24 }, (_, key) => ({ key }));
	it('reproduces the same reading order for the same seed', () => {
		expect(createBrainPodDiscoveryOrder(library, 483101)).toEqual(
			createBrainPodDiscoveryOrder(library, 483101),
		);
		expect(createBrainPodDiscoveryOrder(library, 483102)).not.toEqual(
			createBrainPodDiscoveryOrder(library, 483101),
		);
	});
	it('visits every entry once without mutating the published library', () => {
		const original = [...library];
		const order = createBrainPodDiscoveryOrder(library, 483101);
		expect(new Set(order).size).toBe(library.length);
		expect(new Set(order)).toEqual(new Set(library));
		expect(library).toEqual(original);
		expect(createBrainPodDiscoveryOrder([], 483101)).toEqual([]);
	});
});
