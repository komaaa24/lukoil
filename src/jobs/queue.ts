import { Queue, QueueEvents } from 'bullmq';
import { env } from '../config/env';

const connection = { url: env.REDIS_URL };

export const remindersQueue = new Queue('reminders', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});
export const reminderQueueEvents = new QueueEvents('reminders', { connection });

export const broadcastQueue = new Queue('broadcasts', {
  connection,
  defaultJobOptions: { removeOnComplete: true, attempts: 2, backoff: { type: 'fixed', delay: 1000 } },
});
export const broadcastQueueEvents = new QueueEvents('broadcasts', { connection });
