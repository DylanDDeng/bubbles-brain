# Retired collection directories

The nine Chinese collection indexes live only in homepage sections. This Worker
enforces real `404` responses on their exact former paths before the Pages asset
cache can return an old directory. It does not redirect, render a compatibility
directory, or intercept article subpaths. The route list is checked against the
site's collection directory contract by the unit test.

On 2026-09-11, release 774 removed the old index assets. The Pages production and
deployment domains returned 404, while ordinary custom-domain index URLs returned
old 200 responses with `CF-Cache-Status: DYNAMIC`, `Age`, and a one-week shared TTL.
Adding a query parameter returned 404. A zone Purge Everything request was captured
returning HTTP 200, `success: true`, and no errors, but the old responses persisted.
The exact upstream cache layer was not established. This Worker is a scoped
containment measure, not evidence that the upstream cache defect was fixed.

After merging and successful CI, deploy with:

```sh
npx wrangler deploy --config workers/retired-collections/wrangler.toml
node --experimental-strip-types workers/retired-collections/verify.mjs
```

The post-release check intentionally uses bare URLs and rejects redirects. Do not
add cache-busting parameters. The Pages site itself still uses the content release
pipeline; this Worker has no content, secrets, storage, or Pages deployment rights.

To remove this containment after the underlying cache behavior is resolved, remove
only this Worker's nine routes, then run the bare-URL verifier again. Do not change
the existing daily tombstone route or DNS bindings.
