/** Build first, run this server, then open its URL to export the actual web renderer's first frame. */
import { createServer } from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist/client');
const output = resolve(root, 'src/data/brainpod-art/collection-objects/benchmarks-fallback.webp');
const files = await readdir(resolve(dist, '_astro'));
const scene = files.find((file) => /^readingMagazineScene\..*\.js$/.test(file));
if (!scene) throw new Error('Run npm run build before capturing the cover.');

const html = `<!doctype html><html><meta charset="utf-8"><title>Benchmark cover capture</title>
<style>body{margin:0}#cover{position:relative;width:780px;height:1000px}canvas{position:absolute;inset:0;width:100%;height:100%}</style>
<body><div data-brainpod data-motion="off"><div id="cover" data-reading-magazine="benchmarks"></div></div><p id="status">Rendering…</p>
<script type="module">
import { createReadingMagazineScene } from '/_astro/${scene}';
const original = HTMLCanvasElement.prototype.getContext;
// Only this authoring page retains the drawing buffer for PNG export.
HTMLCanvasElement.prototype.getContext = function(type, options) {
  return original.call(this, type, /^(webgl2?|experimental-webgl)$/.test(type)
    ? {...options, preserveDrawingBuffer: true} : options);
};
let renderer;
try {
  renderer = await createReadingMagazineScene(document.querySelector('#cover'), new AbortController().signal);
  if (!renderer) throw new Error('Renderer did not initialize');
  renderer.setVisible(false);
  const png = document.querySelector('#cover canvas').toDataURL('image/png');
  const response = await fetch('/capture', {method:'POST', headers:{'Content-Type':'text/plain'}, body:png});
  if (!response.ok) throw new Error(await response.text());
  document.querySelector('#status').textContent = await response.text();
} catch(error) {
  document.querySelector('#status').textContent = 'Capture failed: ' + error.message;
} finally {
  HTMLCanvasElement.prototype.getContext = original;
}
</script></body></html>`;

const server = createServer(async (req, res) => {
	try {
		if (req.method === 'POST' && req.url === '/capture') {
			if (req.headers.origin !== `http://127.0.0.1:${server.address().port}`) {
				res.writeHead(403).end('Local capture page only');
				return;
			}
			const chunks = [];
			let size = 0;
			for await (const chunk of req) {
				size += chunk.length;
				if (size > 8 * 1024 * 1024) throw new Error('Capture too large');
				chunks.push(chunk);
			}
			const data = Buffer.concat(chunks).toString();
			if (!data.startsWith('data:image/png;base64,')) throw new Error('Expected a PNG frame');
			const png = Buffer.from(data.slice('data:image/png;base64,'.length), 'base64');
			const metadata = await sharp(png).metadata();
			if (!metadata.hasAlpha || Math.abs(metadata.width / metadata.height - 0.78) > 0.001)
				throw new Error('Expected a transparent 780:1000 cover');
			const webp = await sharp(png).webp({ lossless: true }).toBuffer();
			await writeFile(output, webp);
			res
				.writeHead(200, { 'Content-Type': 'text/plain' })
				.end('Saved web-matched benchmark cover.');
			console.log(`Saved ${output} (${webp.length} bytes)`);
			return;
		}
		if (req.method !== 'GET') {
			res.writeHead(405).end();
			return;
		}
		if (req.url === '/') {
			res.writeHead(200, { 'Content-Type': 'text/html' }).end(html);
			return;
		}
		const pathname = new URL(req.url, 'http://localhost').pathname;
		if (!pathname.startsWith('/_astro/')) {
			res.writeHead(404).end();
			return;
		}
		const file = resolve(dist, `.${pathname}`);
		const types = { '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' };
		res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
		res.end(await readFile(file));
	} catch (error) {
		if (!res.headersSent) res.writeHead(500);
		res.end(error.message);
	}
});
server.listen(0, '127.0.0.1', () => {
	console.log(`Open http://127.0.0.1:${server.address().port}/ to capture the benchmark cover.`);
});
