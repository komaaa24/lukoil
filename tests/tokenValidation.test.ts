import { validateProductToken } from '../src/utils/validation';

describe('validateProductToken', () => {
  it('accepts valid tokens', () => {
    expect(validateProductToken('P2026-ABCDE')).toBe('P2026-ABCDE');
    expect(validateProductToken('p2026-abc123')).toBe('P2026-ABC123');
  });

  it('rejects invalid tokens', () => {
    expect(validateProductToken('invalid')).toBeNull();
    expect(validateProductToken('P20-AB')).toBeNull();
    expect(validateProductToken('')).toBeNull();
  });
});
