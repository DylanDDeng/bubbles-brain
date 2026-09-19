/** Show the device time zone's representative city, not a geolocation claim. */
export function formatBrainPodClock(
	now = new Date(),
	timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
	const time = new Intl.DateTimeFormat('en-GB', {
		timeZone,
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).format(now);
	const zoneFormat = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'shortOffset' });
	const canonicalZone = zoneFormat.resolvedOptions().timeZone;
	// ICU versions differ on whether zero offset is rendered as GMT or GMT+0.
	const offset = zoneFormat.formatToParts(now).find((part) => part.type === 'timeZoneName')?.value;
	const offsetLabel = offset?.replace(/^GMT[+-]0(?::00)?$/, 'GMT') || 'UTC';
	const region =
		canonicalZone.includes('/') && !canonicalZone.startsWith('Etc/')
			? canonicalZone.split('/').at(-1)!.replaceAll('_', ' ')
			: offsetLabel;
	return { time, region, timeZone };
}
