import { Bot } from 'grammy';
import { env, logger } from '../config';
import { registerHandlers } from './handlers';
import { registerErrorHandling } from './middlewares/error';
import { registerLogging, registerSession } from './middlewares/logging';
import { BotContext } from './types';
import { initDataSource } from '../db/data-source';
import { seedSuperAdmin } from '../services/auth.service';
import { startApiServer } from '../api/server';

const bootstrap = async () => {
  await initDataSource();
  await seedSuperAdmin();

  const bot = new Bot<BotContext>(env.BOT_TOKEN);
  registerSession(bot);
  registerLogging(bot);
  registerErrorHandling(bot);
  registerHandlers(bot);

  await bot.api.setMyCommands([
    { command: 'start', description: 'Boshlash' },
  ]);

  if (env.WEBHOOK_URL) {
    await bot.api.setWebhook(env.WEBHOOK_URL, {
      secret_token: env.WEBHOOK_SECRET_TOKEN,
    });
    logger.info('Webhook configured');
  } else {
    await bot.start();
    logger.info('Bot started in long-polling mode');
  }

  startApiServer();

  const shutdown = async () => {
    logger.info('Shutting down bot...');
    await bot.stop();
    await bot.api.deleteWebhook({ drop_pending_updates: true }).catch(() => undefined);
    if ((await import('../db/data-source')).AppDataSource.isInitialized) {
      await (await import('../db/data-source')).AppDataSource.destroy();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

bootstrap().catch((err) => {
  logger.error({ err }, 'Bootstrap failed');
  process.exit(1);
});
