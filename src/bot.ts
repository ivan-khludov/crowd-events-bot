import {
  conversations,
  type ConversationData,
  createConversation,
  type ConversationFlavor,
  type VersionedState,
} from '@grammyjs/conversations';
import { Bot, Context } from 'grammy';

import { Repo } from './db/repo.js';
import { D1SessionStorage } from './db/sessionStore.js';
import type { Env } from './env.js';
import { registerAdminHandlers } from './handlers/admin.js';
import {
  buildDigestBlockConversation,
  buildEventConversation,
  DIGEST_BLOCK_CONVERSATION_ID,
  EVENT_CONVERSATION_ID,
  registerDmKickoff,
} from './handlers/conversation.js';
import { registerMentionHandler } from './handlers/mention.js';
import { registerSuperadminHandlers } from './handlers/superadmin.js';
import { registerVoteHandler } from './handlers/vote.js';

/**
 * Extra fields injected into the outer grammY context by the bot's own
 * middleware. Handlers rely on these to stay concise.
 */
export interface AppFlavor {
  repo: Repo;
  env: Env;
}

/**
 * Full outer context type used by every handler in the group/DM pipeline.
 */
export type AppContext = ConversationFlavor<Context & AppFlavor>;

/**
 * Builds a fresh grammY bot bound to the current request's environment.
 *
 * A new instance is created for every Worker invocation: bindings are valid
 * only for the current request, and grammY itself is lightweight enough to
 * re-initialise on each webhook call.
 *
 * @param env Worker environment with D1 and secrets.
 * @returns A configured bot ready to consume a webhook update.
 */
export function createBot(env: Env): Bot<AppContext> {
  const bot = new Bot<AppContext>(env.BOT_TOKEN);
  const repo = new Repo(env.DB);

  bot.use(async (ctx, next) => {
    ctx.repo = repo;
    ctx.env = env;
    await next();
  });

  registerSuperadminHandlers(bot);

  bot.use(
    conversations<AppContext, Context>({
      storage: {
        type: 'key',
        version: 0,
        getStorageKey: (ctx: AppContext): string | undefined =>
          ctx.from ? `conv:${ctx.from.id}` : undefined,
        adapter: new D1SessionStorage<VersionedState<ConversationData>>(env.DB),
      },
    }),
  );

  bot.use(createConversation(buildEventConversation(env), { id: EVENT_CONVERSATION_ID }));
  bot.use(
    createConversation(buildDigestBlockConversation(env), { id: DIGEST_BLOCK_CONVERSATION_ID }),
  );

  registerMentionHandler(bot);
  registerAdminHandlers(bot);
  registerVoteHandler(bot);
  registerDmKickoff(bot);

  return bot;
}
