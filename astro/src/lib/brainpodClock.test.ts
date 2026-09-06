import { describe, expect, it } from 'vitest';
import { formatBrainPodClock } from './brainpodClock';

describe('BrainPod local clock', () => {
	it('uses an English representative city for the device time zone', () => {
		expect(formatBrainPodClock(new Date('2026-09-06T10:30:00Z'), 'Asia/Shanghai')).toEqual({
			time: '18:30',
			region: 'Shanghai',
			timeZone: 'Asia/Shanghai',
		});
	});
	it('formats city names and falls back to an offset for zones without a city', () => {
		const now = new Date('2026-09-06T10:30:00Z');
		expect(formatBrainPodClock(now, 'America/New_York')).toMatchObject({
			time: '06:30',
			region: 'New York',
		});
		expect(formatBrainPodClock(now, 'America/Argentina/Buenos_Aires').region).toBe('Buenos Aires');
		expect(formatBrainPodClock(now, 'Etc/GMT+5')).toMatchObject({ time: '05:30', region: 'GMT-5' });
		expect(formatBrainPodClock(now, 'UTC').region).toBe('GMT');
	});

	it('follows daylight saving transitions instead of a fixed UTC offset', () => {
		expect(formatBrainPodClock(new Date('2026-03-08T06:59:00Z'), 'America/New_York').time).toBe(
			'01:59',
		);
		expect(formatBrainPodClock(new Date('2026-03-08T07:00:00Z'), 'America/New_York').time).toBe(
			'03:00',
		);
	});

	it('displays midnight as 00:00', () => {
		expect(formatBrainPodClock(new Date('2026-09-06T15:00:00Z'), 'Asia/Tokyo').time).toBe('00:00');
	});
});
