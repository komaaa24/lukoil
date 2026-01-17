import { Bot, session } from 'grammy';
import { RedisAdapter } from '@grammyjs/storage-redis';
import IORedis from 'ioredis';
import { env, logger } from '../../config';
import { BotContext, SessionData } from '../types';

export const registerSession = (bot: Bot<BotContext>) => {
  const redis = new IORedis(env.REDIS_URL);
  bot.use(
    session({
      initial: (): SessionData => ({
        pendingToken: null,
        pendingScannedAt: null,
        awaitingPhone: false,
        lastToken: null,
        lastScanAt: null,
        phoneRequestedAt: null,
        onboarding: undefined,
        complaint: undefined,
        adminFlow: undefined,
      }),
      storage: new RedisAdapter({ instance: redis }),
    }),
  );
};

export const registerLogging = (bot: Bot<BotContext>) => {
  bot.use(async (ctx, next) => {
    logger.debug({ from: ctx.from, updateType: ctx.update.update_id }, 'Incoming update');
    await next();
  });
};
