/** A repeatable source of surprise for the 483101 poster and its reading order. */
export function createBrainPodRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state += 0x6d2b79f5;
		let value = Math.imul(state ^ (state >>> 15), 1 | state);
		value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export function createBrainPodDiscoveryOrder<T>(items: readonly T[], seed: number): T[] {
	const random = createBrainPodRandom(seed);
	const order = [...items];
	for (let i = order.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[order[i], order[j]] = [order[j], order[i]];
	}
	return order;
}
