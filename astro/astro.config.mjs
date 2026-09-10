// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import { fileURLToPath, URL } from 'node:url';

import { rehypeArticleFigures } from './src/lib/articleFigures.ts';

const staticRoot = fileURLToPath(new URL('../static', import.meta.url));

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({
		prerenderEnvironment: 'node',
	}),
	site: 'https://bubblenews.today',
	output: 'static',
	trailingSlash: 'always',
	markdown: {
		processor: unified({ rehypePlugins: [[rehypeArticleFigures, { staticRoot }]] }),
		shikiConfig: {
			theme: 'min-light',
		},
	},
	publicDir: '../static',
	vite: {
		build: {
			// The global CSP has no 'unsafe-inline' for scripts, so even tiny
			// component scripts must be emitted as external files. Stylesheets
			// keep the default 4 KB inlining threshold.
			assetsInlineLimit: (filePath) => (filePath.endsWith('.js') ? false : undefined),
		},
	},
	i18n: {
		defaultLocale: 'zh-CN',
		locales: ['zh-CN', 'en'],
		routing: {
			prefixDefaultLocale: false,
			redirectToDefaultLocale: false,
		},
	},
});
