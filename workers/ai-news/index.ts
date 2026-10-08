/**
 * bubble-ai-news: every 15 minutes, copies the AI news the Grok bot writes into a Feishu Base into
 * one JSON feed for the /ai-news/ page (see sync.ts). The entry module exports only the handlers:
 * the Workers runtime rejects any other export.
 */
import { serveFeed, sync, type Env } from './sync';

export default {
	fetch(request: Request, env: Env): Promise<Response> {
		return serveFeed(request, env);
	},

	async scheduled(_controller: unknown, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<void> {
		ctx.waitUntil(sync(env));
	},
};
