import { randomBytes } from 'crypto';
import { AppDataSource } from '../db/data-source';
import { User } from '../db/entities/User';
import { Referral } from '../db/entities/Referral';
import { PromoCode, PromoCodeStatus } from '../db/entities/PromoCode';

const generateCode = () => randomBytes(4).toString('hex').toUpperCase();

export const ensureReferralCode = async (
  user: User,
  dataSource = AppDataSource,
): Promise<User> => {
  if (user.referralCode) return user;
  const repo = dataSource.getRepository(User);
  let code = generateCode();
  // naive uniqueness guard
  while (await repo.findOne({ where: { referralCode: code } })) {
    code = generateCode();
  }
  user.referralCode = code;
  return repo.save(user);
};

export const handleReferralStart = async (
  inviterCode: string,
  invitedUser: User,
  dataSource = AppDataSource,
): Promise<{ inviter: User | null; created: boolean }> => {
  const userRepo = dataSource.getRepository(User);
  const refRepo = dataSource.getRepository(Referral);
  const promoRepo = dataSource.getRepository(PromoCode);
  const inviter = await userRepo.findOne({ where: { referralCode: inviterCode } });
  if (!inviter || inviter.id === invitedUser.id) return { inviter: null, created: false };
  const exists = await refRepo.findOne({
    where: { inviter: { id: inviter.id }, invited: { id: invitedUser.id } },
  });
  if (exists) return { inviter, created: false };
  const ref = refRepo.create({ inviter, invited: invitedUser });
  await refRepo.save(ref);
  inviter.points += 1;
  await userRepo.save(inviter);
  if (inviter.points >= 5) {
    // issue promo if none active
    const hasOpen = await promoRepo.findOne({
      where: { user: { id: inviter.id }, status: PromoCodeStatus.ISSUED },
    });
    if (!hasOpen) {
      const code = `PROMO-${generateCode()}`;
      const promo = promoRepo.create({ user: inviter, code });
      await promoRepo.save(promo);
    }
  }
  return { inviter, created: true };
};

export const getPointsAndPromos = async (userId: string) => {
  const userRepo = AppDataSource.getRepository(User);
  const promoRepo = AppDataSource.getRepository(PromoCode);
  const user = await userRepo.findOneOrFail({ where: { id: userId } });
  const promos = await promoRepo.find({ where: { user: { id: userId } } });
  return { points: user.points, promos };
};
