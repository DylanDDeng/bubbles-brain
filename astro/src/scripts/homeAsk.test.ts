import { describe, expect, it } from 'vitest';
import { planVisit } from './homeAsk';

const seeded = (seed: number) => () => {
	seed = (seed * 16807) % 2147483647;
	return (seed - 1) / 2147483646;
};

describe('planVisit', () => {
	it('shows three questions under the box and types every other one', () => {
		const plan = planVisit(10, null, seeded(7));
		expect(plan.tried).toHaveLength(3);
		expect([...plan.tried, ...plan.typed].sort((a, b) => a - b)).toEqual([...Array(10).keys()]);
	});

	it('never opens with the question the last visit opened with', () => {
		for (let seed = 1; seed < 200; seed += 1) {
			const first = planVisit(8, null, seeded(seed)).typed[0];
			expect(planVisit(8, first, seeded(seed)).typed[0]).not.toBe(first);
		}
	});

	it('keeps a question to type when the pool is tiny', () => {
		expect(planVisit(1, 0).typed).toEqual([0]);
		expect(planVisit(2, null).typed).toHaveLength(1);
	});
});
