import { DateTime } from 'luxon';
import { AppDataSource } from '../db/data-source';
import { ReminderMode, Subscription } from '../db/entities/Subscription';
import { computeNextAfterSend, DEFAULT_TIMEZONE } from '../utils/time';

export const loadSubscriptionForUser = async (
  subId: string,
  userId: string,
): Promise<Subscription | null> => {
  const repo = AppDataSource.getRepository(Subscription);
  return repo.findOne({ where: { id: subId, user: { id: userId } }, relations: ['user'] });
};

export const confirmReminder = async (subscription: Subscription): Promise<Subscription> => {
  const repo = AppDataSource.getRepository(Subscription);
  const now = new Date();
  subscription.lastConfirmedAt = now;
  subscription.snoozedUntil = null;
  if (subscription.mode === ReminderMode.MONTHLY) {
    subscription.nextRunAt = computeNextAfterSend(
      now,
      subscription.reminderDayOfMonth,
      subscription.timezone,
    );
  } else {
    // KM mode: reset counter and schedule next check-in after a week
    subscription.nextRunAt = DateTime.fromJSDate(now, { zone: subscription.timezone })
      .plus({ days: 7 })
      .set({ hour: 10, minute: 0, second: 0, millisecond: 0 })
      .toJSDate();
  }
  return repo.save(subscription);
};

export const snoozeReminder = async (subscription: Subscription): Promise<Subscription> => {
  const repo = AppDataSource.getRepository(Subscription);
  const now = new Date();
  const snoozed = DateTime.fromJSDate(now, { zone: subscription.timezone })
    .plus({ days: 7 })
    .set({ hour: 10, minute: 0, second: 0, millisecond: 0 })
    .toJSDate();
  subscription.snoozedUntil = snoozed;
  subscription.nextRunAt = snoozed;
  return repo.save(subscription);
};

export const stopReminder = async (subscription: Subscription): Promise<Subscription> => {
  const repo = AppDataSource.getRepository(Subscription);
  subscription.isActive = false;
  return repo.save(subscription);
};

export const updateMileageProgress = async (
  subscription: Subscription,
  delta: number,
  threshold: number,
): Promise<{ reached: boolean; updated: Subscription }> => {
  const repo = AppDataSource.getRepository(Subscription);
  subscription.user.mileageCurrent += delta;
  subscription.user.mileageThreshold = threshold;
  if (subscription.user.mileageCurrent >= threshold) {
    subscription.nextRunAt = new Date();
    subscription.user.mileageCurrent = 0;
  } else {
    subscription.nextRunAt = DateTime.now()
      .plus({ days: 7 })
      .setZone(subscription.timezone || DEFAULT_TIMEZONE)
      .set({ hour: 10, minute: 0, second: 0, millisecond: 0 })
      .toJSDate();
  }
  await repo.save(subscription.user);
  const updated = await repo.save(subscription);
  return { reached: subscription.nextRunAt.getTime() <= Date.now(), updated };
};
