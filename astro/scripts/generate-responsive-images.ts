import { resolve } from 'node:path';

import { checkResponsiveImages, generateResponsiveImages } from '../src/lib/responsiveImages';

const astroRoot = resolve(import.meta.dirname, '..');
const roots = {
	contentRoot: resolve(astroRoot, '../content'),
	staticRoot: resolve(astroRoot, '../static'),
	lockPath: resolve(astroRoot, 'responsive-images.lock.json'),
};

if (process.argv.includes('--check')) {
	const problems = await checkResponsiveImages(roots);
	if (problems.length > 0) {
		console.error(
			`Responsive images are out of date (${problems.length} problem(s)). Run \`npm run images:generate\` and commit static/_responsive plus responsive-images.lock.json.`,
		);
		for (const problem of problems.slice(0, 50)) console.error(`  - ${problem}`);
		process.exit(1);
	}
	console.log('Responsive images are current.');
} else {
	const totals = await generateResponsiveImages(roots);
	console.log(
		`Responsive images: ${totals.referenced} referenced, ${totals.generated} generated, ${totals.current} current, ${totals.pruned} pruned.`,
	);
}
