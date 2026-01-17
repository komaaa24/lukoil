import { LessThanOrEqual } from 'typeorm';
import { env, logger } from '../config';
import { initDataSource, AppDataSource } from '../db/data-source';
import { Subscription } from '../db/entities/Subscription';
import { Broadcast, BroadcastStatus } from '../db/entities/Broadcast';
import { remindersQueue, broadcastQueue } from './queue';

const REMINDER_POLL_MS = 60_000;
const BROADCAST_POLL_MS = 30_000;

const scheduleDueReminders = async () => {
  await initDataSource();
  const repo = AppDataSource.getRepository(Subscription);
  const now = new Date();
  const due = await repo.find({
    where: { isActive: true, nextRunAt: LessThanOrEqual(now) },
  });
  for (const sub of due) {
    const jobId = `${sub.id}:${sub.nextRunAt.getTime()}`;
    try {
      await remindersQueue.add('reminder', { subscriptionId: sub.id }, { jobId });
    } catch (err: any) {
      if (err?.message?.includes('jobId')) continue;
      throw err;
    }
  }
};

const scheduleDueBroadcasts = async () => {
  await initDataSource();
  const repo = AppDataSource.getRepository(Broadcast);
  const now = new Date();
  const due = await repo.find({
    where: { status: BroadcastStatus.SCHEDULED, scheduledAt: LessThanOrEqual(now) },
  });
  for (const broadcast of due) {
    try {
      await broadcastQueue.add(
        'broadcast',
        { broadcastId: broadcast.id },
        { jobId: broadcast.id, removeOnComplete: true },
      );
    } catch (err: any) {
      if (err?.message?.includes('jobId')) {
        continue;
      }
      throw err;
    }
  }
};

const startSchedulers = () => {
  logger.info('Schedulers started');
  scheduleDueReminders().catch((err) => logger.error({ err }, 'reminder scheduling failed'));
  scheduleDueBroadcasts().catch((err) => logger.error({ err }, 'broadcast scheduling failed'));
  setInterval(() => {
    scheduleDueReminders().catch((err) => logger.error({ err }, 'reminder scheduling failed'));
  }, REMINDER_POLL_MS);
  setInterval(() => {
    scheduleDueBroadcasts().catch((err) => logger.error({ err }, 'broadcast scheduling failed'));
  }, BROADCAST_POLL_MS);
};

startSchedulers();
