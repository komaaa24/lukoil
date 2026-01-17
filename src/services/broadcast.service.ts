import { IsNull, MoreThanOrEqual, Not } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import {
  Broadcast,
  BroadcastStatus,
  BroadcastTarget,
} from '../db/entities/Broadcast';
import { Admin } from '../db/entities/Admin';
import { BroadcastLog, BroadcastLogStatus } from '../db/entities/BroadcastLog';
import { User } from '../db/entities/User';
import { Subscription } from '../db/entities/Subscription';
import { ScanEvent } from '../db/entities/ScanEvent';
import { broadcastQueue } from '../jobs/queue';

type BroadcastInput = {
  admin: Admin;
  messageText: string;
  target: BroadcastTarget;
  scheduledAt?: Date | null;
  filterValue?: string | null;
};

export const createBroadcast = async ({
  admin,
  messageText,
  target,
  scheduledAt = null,
  filterValue = null,
}: BroadcastInput): Promise<Broadcast> => {
  const repo = AppDataSource.getRepository(Broadcast);
  const broadcast = repo.create({
    createdByAdmin: admin,
    messageText,
    target,
    status: BroadcastStatus.SCHEDULED,
    scheduledAt,
    filterValue,
  });
  const saved = await repo.save(broadcast);
  if (!scheduledAt || scheduledAt <= new Date()) {
    await queueBroadcast(saved);
  }
  return saved;
};

export const queueBroadcast = async (broadcast: Broadcast) => {
  await broadcastQueue.add(
    'broadcast',
    { broadcastId: broadcast.id },
    { removeOnComplete: true, removeOnFail: false, jobId: broadcast.id },
  );
};

export const markBroadcastStatus = async (
  broadcastId: string,
  status: BroadcastStatus,
  extra?: Partial<Broadcast>,
): Promise<Broadcast> => {
  const repo = AppDataSource.getRepository(Broadcast);
  await repo.update({ id: broadcastId }, { status, ...extra });
  return repo.findOneOrFail({ where: { id: broadcastId } });
};

export const appendBroadcastLog = async (
  broadcast: Broadcast,
  user: User,
  status: BroadcastLogStatus,
  error: string | null = null,
) => {
  const repo = AppDataSource.getRepository(BroadcastLog);
  const log = repo.create({ broadcast, user, status, error });
  await repo.save(log);
};

export const getBroadcastStats = async () => {
  const repo = AppDataSource.getRepository(Broadcast);
  return {
    total: await repo.count(),
    scheduled: await repo.count({ where: { status: BroadcastStatus.SCHEDULED } }),
  };
};

export const getStats = async () => {
  const userRepo = AppDataSource.getRepository(User);
  const subRepo = AppDataSource.getRepository(Subscription);
  const scanRepo = AppDataSource.getRepository(ScanEvent);
  const broadcastRepo = AppDataSource.getRepository(Broadcast);
  const totalUsers = await userRepo.count();
  const usersWithPhone = await userRepo.count({ where: { phoneNumber: Not(IsNull()) } });
  const activeSubs = await subRepo.count({ where: { isActive: true } });
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const scansLast7Days = await scanRepo.count({ where: { scannedAt: MoreThanOrEqual(since) } });
  const broadcastsDone = await broadcastRepo.count({ where: { status: BroadcastStatus.DONE } });
  const broadcastsFailed = await broadcastRepo.count({ where: { status: BroadcastStatus.FAILED } });
  return {
    totalUsers,
    usersWithPhone,
    activeSubs,
    scansLast7Days,
    broadcastsDone,
    broadcastsFailed,
  };
};

export const findUsersForBroadcast = async (
  target: BroadcastTarget,
  filterValue?: string | null,
): Promise<User[]> => {
  const userRepo = AppDataSource.getRepository(User);
  if (target === BroadcastTarget.ALL_USERS) {
    return userRepo.find();
  }
  if (target === BroadcastTarget.USERS_WITH_PHONE) {
    return userRepo.find({ where: { phoneNumber: Not(IsNull()) } });
  }
  // USERS_WITH_ACTIVE_SUBS
  if (target === BroadcastTarget.USERS_WITH_ACTIVE_SUBS) {
    return userRepo
      .createQueryBuilder('user')
      .innerJoin(Subscription, 'sub', 'sub.userId = user.id AND sub.isActive = true')
      .distinct(true)
      .getMany();
  }
  if (target === BroadcastTarget.SCANNED_LAST_30_DAYS) {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    return userRepo
      .createQueryBuilder('user')
      .innerJoin(ScanEvent, 'scan', 'scan."userId" = user.id AND scan."scannedAt" >= :since', {
        since,
      })
      .distinct(true)
      .getMany();
  }
  if (target === BroadcastTarget.BY_OIL_TYPE && filterValue) {
    return userRepo.find({ where: { oilType: filterValue } });
  }
  return [];
};

export const lookupUser = async (query: string): Promise<User[]> => {
  const repo = AppDataSource.getRepository(User);
  const qb = repo.createQueryBuilder('user');
  qb.leftJoinAndSelect('user.subscriptions', 'subscription');
  qb.leftJoinAndSelect('subscription.productToken', 'productToken');
  if (/^[0-9]+$/.test(query)) {
    qb.where('user.telegramId = :telegramId', { telegramId: query });
  } else {
    qb.where('user.phoneNumber ILIKE :q', { q: `%${query}%` });
  }
  return qb.limit(10).getMany();
};

export const cancelScheduledBroadcasts = async (): Promise<number> => {
  const repo = AppDataSource.getRepository(Broadcast);
  const result = await repo
    .createQueryBuilder()
    .update()
    .set({ status: BroadcastStatus.FAILED })
    .where('status = :status', { status: BroadcastStatus.SCHEDULED })
    .execute();
  return result.affected ?? 0;
};
