import { describe, expect, it } from 'vitest';
import { vibeCodingTermCategories } from '../data/vibeCodingTerms';
import {
	defaultMotionValues,
	renderMotionPrompt,
	vibeCodingMotionProfiles,
} from './vibeCodingMotion';

const motionTerms = vibeCodingTermCategories.find((category) => category.id === 'motion')!.terms;

describe('vibeCodingMotion', () => {
	it('has a tuner for every motion term and nothing else', () => {
		expect(Object.keys(vibeCodingMotionProfiles).sort()).toEqual(
			motionTerms.map((term) => term.id).sort(),
		);
	});

	it('writes every default prompt without leftover placeholders', () => {
		for (const profile of Object.values(vibeCodingMotionProfiles)) {
			const prompt = renderMotionPrompt(profile, defaultMotionValues(profile));
			expect(prompt).not.toMatch(/[{}]/);
			expect(prompt).not.toMatch(/，，|，。/);
		}
	});

	it('keeps every preset inside its control choices and ranges', () => {
		for (const profile of Object.values(vibeCodingMotionProfiles)) {
			for (const preset of profile.presets) {
				for (const [id, value] of Object.entries(preset.values)) {
					const control = profile.controls.find((item) => item.id === id)!;
					expect(control, `${preset.label} → ${id}`).toBeDefined();
					if (control.type === 'choice') {
						expect(control.options!.map((option) => option.value)).toContain(value);
					} else {
						expect(Number(value)).toBeGreaterThanOrEqual(control.min!);
						expect(Number(value)).toBeLessThanOrEqual(control.max!);
					}
				}
			}
		}
	});

	it('rewrites the prompt from the current values', () => {
		const reveal = vibeCodingMotionProfiles['reveal-on-scroll'];
		expect(renderMotionPrompt(reveal, { kind: 'left', dist: 40, dur: 1200, ease: 'back' })).toBe(
			'卡片滚动进入视口时，从左侧 40px 滑入并淡入，时长 1.2 秒，结尾带一点回弹（back-out），只播一次。',
		);
		const stagger = vibeCodingMotionProfiles.stagger;
		expect(renderMotionPrompt(stagger, { gap: 0, order: 'center', dur: 500 })).toContain(
			'同时出现',
		);
		const spring = vibeCodingMotionProfiles.spring;
		expect(renderMotionPrompt(spring, { bounce: 0, dur: 450 })).toContain('不要回弹');
		const parallax = vibeCodingMotionProfiles.parallax;
		expect(renderMotionPrompt(parallax, { speed: 40, layers: '3' })).toBe(
			'首屏做视差滚动：内容正常滚动，背景图以滚动速度的 40% 移动，中间再加一层以 70% 速度移动的中景。',
		);
	});
});
