import { createTestDataSource } from './test-data-source';
import { handleReferralStart, ensureReferralCode } from '../src/services/referral.service';
import { User } from '../src/db/entities/User';

describe('Referral attribution', () => {
  it('creates referral and increments points', async () => {
    const ds = await createTestDataSource();
    const userRepo = ds.getRepository(User);
    const inviter = await userRepo.save({
      telegramId: '1',
      username: 'inviter',
      firstName: 'A',
      lastName: null,
      phoneNumber: '+998',
      languageCode: 'uz',
    });
    const invited = await userRepo.save({
      telegramId: '2',
      username: 'invited',
      firstName: 'B',
      lastName: null,
      phoneNumber: '+998',
      languageCode: 'uz',
    });
    await ensureReferralCode(inviter, ds);
    const result = await handleReferralStart(inviter.referralCode!, invited, ds);
    expect(result.created).toBe(true);
    const refreshedInviter = await userRepo.findOneOrFail({ where: { id: inviter.id } });
    expect(refreshedInviter.points).toBeGreaterThanOrEqual(1);
    await ds.destroy();
  });
});
