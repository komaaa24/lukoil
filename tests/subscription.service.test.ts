import { ensureSubscription } from '../src/services/scan.service';
import { createTestDataSource } from './test-data-source';
import { User } from '../src/db/entities/User';
import { ProductToken } from '../src/db/entities/ProductToken';
import { Subscription } from '../src/db/entities/Subscription';

describe('ensureSubscription', () => {
  it('creates only one subscription per user/token', async () => {
    const ds = await createTestDataSource();
    const userRepo = ds.getRepository(User);
    const tokenRepo = ds.getRepository(ProductToken);

    const user = await userRepo.save({
      telegramId: '123',
      username: 'test',
      firstName: 'Test',
      lastName: null,
      phoneNumber: '+998901234567',
      languageCode: 'uz',
    });
    const token = await tokenRepo.save({ token: 'P2026-ABCDE', isActive: true });

    const first = await ensureSubscription(
      user,
      token,
      new Date('2024-01-10T00:00:00Z'),
      'Asia/Tashkent',
      ds,
    );
    const second = await ensureSubscription(
      user,
      token,
      new Date('2024-02-10T00:00:00Z'),
      'Asia/Tashkent',
      ds,
    );

    expect(first.id).toBe(second.id);
    const count = await ds.getRepository(Subscription).count();
    expect(count).toBe(1);
    await ds.destroy();
  });
});
