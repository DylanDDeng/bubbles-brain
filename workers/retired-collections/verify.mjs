import { collectionDirectories } from "../../astro/src/lib/collectionRoutes.ts";

const origins = process.argv.slice(2);
if (!origins.length) origins.push("https://bubblenews.today", "https://ai-bubblebrain-daily-news.pages.dev");
for (const origin of origins) {
  for (const path of [...Object.keys(collectionDirectories), "/highlights/2025/"]) {
    // Intentionally no cache-busting query: this must test an ordinary visitor's URL.
    const url = new URL(path, origin);
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(30000) });
    await response.body?.cancel();
    if (response.status !== 404) throw new Error(`${url}: expected 404, received ${response.status}`);
    console.log(`404 ${url}`);
  }
}
