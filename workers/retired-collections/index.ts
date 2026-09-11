import { isRetiredDirectory } from "../../astro/src/lib/collectionRoutes";

// Enforce removed directories before the Pages asset cache can serve an old copy.
// These are exact Worker routes; article subpaths remain owned by Pages.
export default {
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (!isRetiredDirectory(path)) return fetch(request);
    return new Response(request.method === "HEAD" ? null :
      '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>404 · Bubble\'s Brain</title><h1>404</h1><p>此页面不存在。</p><a href="/">返回首页</a></html>', {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};
