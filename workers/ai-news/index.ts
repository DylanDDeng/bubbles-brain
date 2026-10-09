/**
 * bubble-ai-news: copies the AI news the Grok bot writes into a Feishu Base into one JSON feed for
 * the /ai-news/ page (see sync.ts). The bot asks for a sync after each batch (POST /v1/sync); the
 * hourly cron is the safety net. The entry module exports only the handlers: the Workers runtime
 * rejects any other export.
 */
import { handleRequest, sync, type Env, type Waiter } from './sync';

export default {
	fetch(request: Request, env: Env, ctx: Waiter): Promise<Response> {
		return handleRequest(request, env, ctx);
	},

	async scheduled(_controller: unknown, env: Env, ctx: Waiter): Promise<void> {
		ctx.waitUntil(sync(env));
	},
};
