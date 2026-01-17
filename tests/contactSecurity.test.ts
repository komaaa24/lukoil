import { isContactOwnedByUser } from '../src/utils/telegram';

describe('isContactOwnedByUser', () => {
  it('accepts contact from same user', () => {
    expect(isContactOwnedByUser({ user_id: 123, phone_number: '+998901234567' } as any, 123)).toBe(
      true,
    );
  });

  it('rejects mismatched contact', () => {
    expect(isContactOwnedByUser({ user_id: 999, phone_number: '+998901234567' } as any, 123)).toBe(
      false,
    );
  });
});
