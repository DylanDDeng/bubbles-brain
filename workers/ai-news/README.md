# AI 动态 feed Worker

`bubble-ai-news` keeps the `/ai-news/` page fed. A Grok bot writes AI news into the
Feishu Base「Hourly AI X digest」(table 选题) once an hour. A sync runs when the bot asks for one
right after writing a batch (`POST /v1/sync`), and once an hour on a cron as a safety net. A sync:

1. reads the rows pushed in the last 30 days (标题, 内容, 链接, 推送时间, 封面 only; the
   internal columns such as 适合原因 and the tweet drafts are never requested);
2. drops rows without a title, link or time, keeps the newest push of each story, and
   cuts summaries to 160 characters;
3. finds each story's cover. An image the bot attached in 封面 wins: it is downloaded from
   Feishu once, shrunk to an 800px WebP by the Images binding (kept as is if that fails), stored
   in the R2 bucket `bubble-ai-news-covers`, and served from `/v1/cover/<file token>` with a
   one-year immutable cache (40 copies per cron run, 4 per bot-triggered run). Otherwise the
   source page's share image (`og:image`) is used: up to 15 lookups per cron run (5 per
   bot-triggered run, which must finish within 30 seconds), each answer remembered in KV (45
   days when found, 3 days when not);
4. stores the result as one JSON value, `feed:v1`, grouped by Beijing day, and only
   rewrites it when the stories changed.

`GET https://news-api.bubblenews.today/v1/feed` serves that value to any origin with a
one-minute cache. The page itself is static; publishing news never needs a site release.
The feed covers the last 30 days. Every sync also folds it into a monthly archive in the R2
bucket `bubble-ai-news-archive` (`archive/YYYY-MM.json`, grouped by Beijing day), so a story
keeps its last version after it ages out of the window and the Base can be pruned. Days
before the window are kept as archived; later days follow the feed (edits and deletions carry
over); the window's first day keeps both. `GET /v1/archive/<YYYY-MM>` serves a month, and the
feed's `archiveMonths` lists the months that hold days older than the window. If KV is lost,
the next run rebuilds the feed from the Base.

The Feishu tenant token is kept in KV until five minutes before it expires, so a run normally
costs one or two Feishu API calls (the record search), not three.

## Asking for a sync (the Grok bot)

After writing a batch of rows, the bot calls:

```sh
curl -s -X POST -H "Authorization: Bearer $SYNC_TOKEN" https://news-api.bubblenews.today/v1/sync
```

It answers `202 {"status":"queued"}` at once and syncs about three seconds later (a row just
written can take a moment to appear in search). Calls within the next minute answer
`{"status":"already_queued"}` and are folded into that sync. A wrong or missing token gets 401.

## One-time setup

1. In the Feishu developer console, create a custom app, enable the
   `bitable:app:readonly` permission and publish a version. In the Base, add the app
   as a collaborator with read access (… → 更多 → 添加文档应用).
2. Create the KV namespace and paste its id into `wrangler.toml`:

   ```sh
   npx wrangler kv namespace create bubble-ai-news
   ```

3. Store the app credentials, and a random token shared with the bot, as secrets:

   ```sh
   npx wrangler secret put FEISHU_APP_ID --config workers/ai-news/wrangler.toml
   npx wrangler secret put FEISHU_APP_SECRET --config workers/ai-news/wrangler.toml
   openssl rand -base64 32 | tr -d '=+/' | npx wrangler secret put SYNC_TOKEN --config workers/ai-news/wrangler.toml
   ```

## Deploy and check

Deployment is manual, like the other Workers:

```sh
npx wrangler deploy --config workers/ai-news/wrangler.toml
npx wrangler tail --config workers/ai-news/wrangler.toml   # watch the next run
curl -s https://news-api.bubblenews.today/v1/feed | head -c 300
```

The feed answers `503 feed_not_ready` until the first scheduled run has finished.
A failing run (bad secret, app not added to the Base) throws `feishu_token_failed` or
`feishu_search_failed` in the logs and leaves the last good feed in place; the page's
「更新于」line shows how old it is.

## Local run

```sh
npx wrangler dev --config workers/ai-news/wrangler.toml --port 8790
curl "http://localhost:8790/cdn-cgi/handler/scheduled"   # one sync (needs a .dev.vars with the two secrets)
```

Point the dev site at it with `PUBLIC_AI_NEWS_FEED=http://localhost:8790/v1/feed` in
`astro/.env.local`.
