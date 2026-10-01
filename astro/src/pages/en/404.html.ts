import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(
		`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <meta name="description" content="The requested page does not exist or has moved.">
  <link rel="canonical" href="https://bubblenews.today/en/404">
  <link rel="alternate" hreflang="en" href="https://bubblenews.today/en/404">
  <link rel="alternate" hreflang="zh-CN" href="https://bubblenews.today/404">
  <link rel="alternate" hreflang="x-default" href="https://bubblenews.today/404">
  <title>Page not found · Bubble's Brain</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', system-ui, sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #ffffff; color: #111111; text-align: center; }
    main { width: min(42rem, calc(100% - 2rem)); }
    h1 { font-size: 32px; font-weight: 600; letter-spacing: -0.01em; }
    p { color: #555555; line-height: 1.7; }
    a { color: #111111; margin: 0 .75rem; text-underline-offset: 4px; }
    .skip-link { position: fixed; left: 1rem; top: 1rem; transform: translateY(-200%); padding: .75rem 1rem; background: #111111; color: #ffffff; z-index: 10; }
    .skip-link:focus { transform: translateY(0); }
  </style>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <main id="main-content" tabindex="-1">
    <p>404</p>
    <h1>The cat lost this page.</h1>
    <p>The link may have moved. A search will most likely find it.</p>
    <nav aria-label="404 navigation"><a href="/en/">Home</a><a href="/search/">Search</a></nav>
  </main>
</body>
</html>`,
		{ headers: { 'Content-Type': 'text/html; charset=utf-8' } },
	);
