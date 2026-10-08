# AI 动态 feed Worker

`bubble-ai-news` keeps the `/ai-news/` page fed. A Grok bot writes AI news into the
Feishu Base「Hourly AI X digest」(table 选题) once an hour. Every 15 minutes this Worker:

1. reads the rows pushed in the last 30 days (标题, 内容, 链接, 推送时间 only; the
   internal columns such as 适合原因 and the tweet drafts are never requested);
2. drops rows without a title, link or time, keeps the newest push of each story, and
   cuts summaries to 160 characters;
3. looks up the share image (`og:image`) of up to 15 new stories per run and remembers
   each answer in KV (45 days when found, 3 days when not);
4. stores the result as one JSON value, `feed:v1`, grouped by Beijing day, and only
   rewrites it when the stories changed.

`GET https://news-api.bubblenews.today/v1/feed` serves that value to any origin with a
five-minute cache. The page itself is static; publishing news never needs a site release.
The Base remains the archive: if KV is lost, the next run rebuilds the feed.

## One-time setup

1. In the Feishu developer console, create a custom app, enable the
   `bitable:app:readonly` permission and publish a version. In the Base, add the app
   as a collaborator with read access (… → 更多 → 添加文档应用).
2. Create the KV namespace and paste its id into `wrangler.toml`:

   ```sh
   npx wrangler kv namespace create bubble-ai-news
   ```

3. Store the app credentials as secrets:

   ```sh
   npx wrangler secret put FEISHU_APP_ID --config workers/ai-news/wrangler.toml
   npx wrangler secret put FEISHU_APP_SECRET --config workers/ai-news/wrangler.toml
   ```

## Deploy and check

Deployment is manual, like the other Workers:

```sh
npx wrangler deploy --config workers/ai-news/wrangler.toml
npx wrangler tail --config workers/ai-news/wrangler.toml   # watch the next */15 run
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
