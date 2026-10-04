/**
 * URLs for Showcase media. Videos, previews and posters carry `?v=<content hash>` from
 * src/data/showcaseMedia.json (written by `npm run showcase:media`), so /media/showcase/* can be
 * cached for a year. Posters also get the responsive variants the image pipeline cut for them.
 */
import responsiveLock from '../../responsive-images.lock.json';
import versions from '../data/showcaseMedia.json';

const versionOf: Record<string, string | undefined> = versions;
const responsiveSources: Record<string, { variants: string[] } | undefined> =
	responsiveLock.sources;

/** The short, silent clip that plays when the pointer rests on a gallery tile. */
export const showcasePreviewPath = (video: string) => video.replace(/\.mp4$/, '-preview.mp4');

export function showcaseMediaUrl(path: string): string {
	const version = versionOf[path];
	return version ? `${path}?v=${version}` : path;
}

/** `srcset` for a poster in one format, or undefined when the pipeline has not cut it. */
export function showcasePosterSrcset(poster: string, format: 'avif' | 'webp'): string | undefined {
	const variants = responsiveSources[poster]?.variants.filter((variant) =>
		variant.endsWith(`.${format}`),
	);
	if (!variants?.length) return undefined;
	return variants.map((variant) => `${variant} ${variant.match(/-(\d+)\.\w+$/)![1]}w`).join(', ');
}
