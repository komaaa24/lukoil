import { User as TgUser } from 'grammy/types';
import { AppDataSource } from '../db/data-source';
import { User, MileageMode } from '../db/entities/User';

export const upsertUserFromTelegram = async (telegramUser: TgUser): Promise<User> => {
  const repo = AppDataSource.getRepository(User);
  let user = await repo.findOne({ where: { telegramId: String(telegramUser.id) } });
  if (!user) {
    user = repo.create({
      telegramId: String(telegramUser.id),
      username: telegramUser.username ?? null,
      firstName: telegramUser.first_name ?? null,
      lastName: telegramUser.last_name ?? null,
      phoneNumber: null,
      languageCode: telegramUser.language_code ?? null,
      vehicleBrand: null,
      oilType: null,
      mileageMode: MileageMode.MONTHLY,
      mileageCurrent: 0,
      mileageThreshold: 5000,
      referralCode: null,
      points: 0,
    });
  } else {
    user.username = telegramUser.username ?? user.username;
    user.firstName = telegramUser.first_name ?? user.firstName;
    user.lastName = telegramUser.last_name ?? user.lastName;
    user.languageCode = telegramUser.language_code ?? user.languageCode;
  }
  return repo.save(user);
};

export const updateUserPhone = async (userId: string, phoneNumber: string): Promise<User> => {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneOrFail({ where: { id: userId } });
  user.phoneNumber = phoneNumber;
  return repo.save(user);
};

export const findUserByTelegramId = async (telegramId: string): Promise<User | null> => {
  const repo = AppDataSource.getRepository(User);
  return repo.findOne({ where: { telegramId } });
};

export const deleteUserByTelegramId = async (telegramId: string): Promise<boolean> => {
  const repo = AppDataSource.getRepository(User);
  const result = await repo.delete({ telegramId });
  return (result.affected ?? 0) > 0;
};

export const updateUserPreferences = async (
  userId: string,
  prefs: Partial<Pick<User, 'languageCode' | 'vehicleBrand' | 'oilType' | 'mileageMode' | 'mileageThreshold'>>,
): Promise<User> => {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneOrFail({ where: { id: userId } });
  Object.assign(user, prefs);
  if (prefs.mileageMode && prefs.mileageMode === MileageMode.KM && !user.mileageThreshold) {
    user.mileageThreshold = 5000;
  }
  return repo.save(user);
};
