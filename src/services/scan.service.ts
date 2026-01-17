import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { ProductToken } from '../db/entities/ProductToken';
import { ScanEvent, ScanSource } from '../db/entities/ScanEvent';
import { ReminderMode, Subscription } from '../db/entities/Subscription';
import { User, MileageMode } from '../db/entities/User';
import { DEFAULT_TIMEZONE, clampReminderDay, computeNextRunAt } from '../utils/time';
import { validateProductToken } from '../utils/validation';

type RecordScanArgs = {
  user: User;
  tokenRaw: string;
  scannedAt: Date;
  source: ScanSource;
  createSubscription?: boolean;
  timezone?: string;
  dataSource?: DataSource;
};

export const recordScan = async ({
  user,
  tokenRaw,
  scannedAt,
  source,
  createSubscription = false,
  timezone = DEFAULT_TIMEZONE,
  dataSource = AppDataSource,
}: RecordScanArgs): Promise<{
  tokenValid: boolean;
  productToken: ProductToken | null;
  scanEvent: ScanEvent;
  subscription: Subscription | null;
}> => {
  const productTokenRepo = dataSource.getRepository(ProductToken);
  const scanRepo = dataSource.getRepository(ScanEvent);

  const normalizedToken = validateProductToken(tokenRaw);
  let productToken: ProductToken | null = null;

  if (normalizedToken) {
    productToken =
      (await productTokenRepo.findOne({ where: { token: normalizedToken } })) ||
      productTokenRepo.create({ token: normalizedToken, isActive: true });
    if (!productToken.id) {
      productToken = await productTokenRepo.save(productToken);
    }
  }

  const scanEvent = scanRepo.create({
    user,
    productToken,
    tokenRaw: tokenRaw.trim(),
    scannedAt,
    source,
  });
  await scanRepo.save(scanEvent);

  let subscription: Subscription | null = null;
  if (createSubscription && productToken) {
    subscription = await ensureSubscription(user, productToken, scannedAt, timezone, dataSource);
  }

  return {
    tokenValid: Boolean(normalizedToken),
    productToken,
    scanEvent,
    subscription,
  };
};

export const ensureSubscription = async (
  user: User,
  productToken: ProductToken,
  scannedAt: Date,
  timezone = DEFAULT_TIMEZONE,
  dataSource: DataSource = AppDataSource,
): Promise<Subscription> => {
  const subscriptionRepo = dataSource.getRepository(Subscription);
  const day = clampReminderDay(DateTime.fromJSDate(scannedAt, { zone: timezone }).day);

  const existing = await subscriptionRepo.findOne({
    where: { user: { id: user.id }, productToken: { id: productToken.id } },
  });

  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.nextRunAt = computeNextRunAt(scannedAt, existing.reminderDayOfMonth, timezone);
      existing.timezone = timezone;
      return subscriptionRepo.save(existing);
    }
    return existing;
  }

  const nextRunAt = computeNextRunAt(scannedAt, day, timezone);
  const subscription = subscriptionRepo.create({
    user,
    productToken,
    reminderDayOfMonth: day,
    timezone,
    isActive: true,
    nextRunAt,
    lastSentAt: null,
    mode: user.mileageMode === MileageMode.KM ? ReminderMode.KM : ReminderMode.MONTHLY,
  });
  return subscriptionRepo.save(subscription);
};

export const getActiveSubscriptionsForUser = async (
  userId: string,
  dataSource: DataSource = AppDataSource,
): Promise<Subscription[]> => {
  const repo = dataSource.getRepository(Subscription);
  return repo.find({
    where: { user: { id: userId }, isActive: true },
    relations: ['productToken'],
    order: { nextRunAt: 'ASC' },
  });
};

export const deactivateAllSubscriptions = async (
  userId: string,
  dataSource: DataSource = AppDataSource,
): Promise<void> => {
  const repo = dataSource.getRepository(Subscription);
  await repo
    .createQueryBuilder()
    .update()
    .set({ isActive: false })
    .where('userId = :userId', { userId })
    .execute();
};
