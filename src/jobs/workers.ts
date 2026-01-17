import { Worker } from 'bullmq';
import { Bot, GrammyError } from 'grammy';
import { env, logger } from '../config';
import { initDataSource, AppDataSource } from '../db/data-source';
import { Subscription } from '../db/entities/Subscription';
import { computeNextAfterSend } from '../utils/time';
import { isTelegramBlockError } from '../utils/telegram';
import { appendBroadcastLog, findUsersForBroadcast, markBroadcastStatus } from '../services/broadcast.service';
import { Broadcast, BroadcastStatus } from '../db/entities/Broadcast';
import { BroadcastLogStatus } from '../db/entities/BroadcastLog';
import { reminderActionKeyboard } from '../bot/keyboards';

const bot = new Bot(env.BOT_TOKEN);
const connection = { url: env.REDIS_URL };

const chunk = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const reminderWorker = new Worker(
  'reminders',
  async (job) => {
    await initDataSource();
    const { subscriptionId } = job.data as { subscriptionId: string };
    const repo = AppDataSource.getRepository(Subscription);
    const subscription = await repo.findOne({
      where: { id: subscriptionId },
      relations: ['user', 'productToken'],
    });
    if (!subscription || !subscription.isActive) {
      logger.warn({ subscriptionId }, 'Subscription not found or inactive');
      return;
    }
    try {
      const text =
        subscription.mode === 'KM'
          ? '🧮 Bu oy nechchi km yurdingiz? Eslatma: moy almashtirishni unutmang.'
          : '⛽️ Avtomobilingiz moyini almashtirishni esdan chiqarmang!\nAgar moyni almashtirgan bo‘lsangiz, /status ni tekshiring.';
      await bot.api.sendMessage(Number(subscription.user.telegramId), text, {
        reply_markup: reminderActionKeyboard(subscription, subscription.user.telegramId),
      });
      const sentAt = new Date();
      subscription.lastSentAt = sentAt;
      subscription.nextRunAt = computeNextAfterSend(
        sentAt,
        subscription.reminderDayOfMonth,
        subscription.timezone,
      );
      await repo.save(subscription);
    } catch (err) {
      if (isTelegramBlockError(err)) {
        subscription.isActive = false;
        await repo.save(subscription);
        logger.warn({ subscriptionId }, 'User blocked bot, deactivating subscription');
        return;
      }
      logger.error({ err, subscriptionId }, 'Failed to send reminder');
      throw err;
    }
  },
  { connection, concurrency: 5 },
);

const broadcastWorker = new Worker(
  'broadcasts',
  async (job) => {
    await initDataSource();
    const { broadcastId } = job.data as { broadcastId: string };
    const broadcastRepo = AppDataSource.getRepository(Broadcast);
    const broadcast = await broadcastRepo.findOne({ where: { id: broadcastId } });
    if (!broadcast) {
      logger.error({ broadcastId }, 'Broadcast not found');
      return;
    }

    await markBroadcastStatus(broadcastId, BroadcastStatus.SENDING);
    const users = await findUsersForBroadcast(broadcast.target, broadcast.filterValue);
    let sentCount = 0;
    let failCount = 0;

    for (const batch of chunk(users, 25)) {
      await Promise.all(
        batch.map(async (user) => {
          try {
            await bot.api.sendMessage(Number(user.telegramId), broadcast.messageText);
            sentCount += 1;
            await appendBroadcastLog(broadcast, user, BroadcastLogStatus.SENT);
          } catch (err) {
            failCount += 1;
            const message = err instanceof GrammyError ? err.message : 'unknown';
            await appendBroadcastLog(broadcast, user, BroadcastLogStatus.FAILED, message);
            if (isTelegramBlockError(err)) {
              logger.warn({ userId: user.id }, 'User blocked bot during broadcast');
            } else {
              logger.error({ err, userId: user.id }, 'Broadcast send failed');
            }
          }
        }),
      );
      await sleep(1200); // ~20 msgs/sec guardrail
    }

    const finalStatus =
      failCount > 0 && sentCount === 0 ? BroadcastStatus.FAILED : BroadcastStatus.DONE;
    await markBroadcastStatus(broadcastId, finalStatus, { sentCount, failCount });
  },
  { connection, concurrency: 2 },
);

const handleShutdown = async () => {
  logger.info('Shutting down workers...');
  await reminderWorker.close();
  await broadcastWorker.close();
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

logger.info('Workers started');
