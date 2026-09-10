# Astro development guidelines

## Scope

- This directory is the production renderer for Bubble's Brain: Astro 7 static output, deployed through the Cloudflare adapter.
- `../content` is the only Markdown source of truth. Edit content in place; do not copy or rewrite historical Markdown in bulk.
- Public URLs are long-lived contracts. Preserve existing routes; when a route change is intentional, update the redirect generation (`scripts/generate-redirects.ts`), `route-ownership.json`, and the related tests in the same change.

## Architecture boundaries

- The content release pipeline (ingest, review, publish) lives in `../workers/content/` with its own wrangler configs and GitHub Actions workflows. Astro consumes already-published Markdown from `../content`; do not implement pipeline logic in Astro code or templates.
- Structured knowledge data follows `../schemas/knowledge-taxonomy.schema.json` and lives in `../data/knowledge/taxonomy.json`.
- Astro owns rendering, navigation, SEO, RSS, the search index, and progressively enhanced interactions. Do not put editorial or business logic in components.
- Keep user-specific state behind Supabase or another authenticated API (`src/lib/auth`, `src/lib/supabase`); never commit private notes.

## Commands

Run commands from this directory:

```sh
npm run dev      # local dev server
npm run check    # astro check
npm run lint     # eslint
npm run format   # prettier
npm run test     # vitest
npm run build    # release build (astro build + redirects + legacy compat + site contract)
npm run verify   # check + lint + test + images:check + build + CSP + site verification
npm run images:generate  # regenerate ../static/_responsive variants + responsive-images.lock.json
npm run images:check     # fail if referenced images changed without regenerating variants
```

Build output lands in `dist/`.

Responsive image variants (`../static/_responsive/`) are committed content assets, not build output. After adding or changing an image referenced from `../content`, run `npm run images:generate` and commit the variants together with `responsive-images.lock.json`; CI only verifies, it never generates.

## Development rules

- Use TypeScript strict mode.
- Prefer Astro components and framework-free scripts until shared client state justifies an island.
- Build pages as static HTML by default. Add SSR only for authenticated private content.
- Preserve canonical URLs, language routes, RSS behavior, and no-JavaScript readability.
- Add or update tests whenever route identity or data-contract behavior changes.
- Run `npm run verify` before claiming work on this directory is ready.

## Vibe Coding UI patterns

- Add glossary entries in `src/data/vibeCodingTerms.ts` and their illustrated profiles in `src/data/vibeCodingPatternDetails.ts`. Anatomy, variant sketches, and recognition exercises are rendered by `src/components/VibeCodingPatternDetail.astro` with `src/styles/vibe-coding-pattern-detail.css`.
- The homepage term directory and detail routes are generated from the glossary data. `brainPodTermReturn` returns to the exact directory page containing a term; `/vibe-coding/terms/ui-patterns/` is a category explainer, not the directory. Focused checks: `npm run test -- src/lib/brainpodTerms.test.ts src/lib/searchIndex.test.ts`.
