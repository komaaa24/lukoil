import { AppDataSource } from '../db/data-source';
import { Admin, AdminRole } from '../db/entities/Admin';
import { env } from '../config';

export const getAdminByTelegramId = async (telegramId: string): Promise<Admin | null> => {
  const repo = AppDataSource.getRepository(Admin);
  return repo.findOne({ where: { telegramId, isActive: true } });
};

export const assertAdmin = async (telegramId: number | undefined): Promise<Admin> => {
  if (!telegramId) {
    throw new Error('Admin not recognized');
  }
  const admin = await getAdminByTelegramId(String(telegramId));
  if (!admin) {
    throw new Error('Sizda bu amal uchun ruxsat yo‘q.');
  }
  return admin;
};

export const seedSuperAdmin = async (): Promise<Admin | null> => {
  if (!env.SEED_SUPER_ADMIN_TELEGRAM_ID) return null;
  const repo = AppDataSource.getRepository(Admin);
  const existing = await repo.findOne({
    where: { telegramId: env.SEED_SUPER_ADMIN_TELEGRAM_ID },
  });
  if (existing) return existing;
  const admin = repo.create({
    telegramId: env.SEED_SUPER_ADMIN_TELEGRAM_ID,
    role: AdminRole.SUPER_ADMIN,
    isActive: true,
  });
  return repo.save(admin);
};
