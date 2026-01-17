import { buildCallbackData, parseCallbackData, verifyCallbackData } from '../src/utils/hmac';

describe('HMAC callback', () => {
  it('signs and verifies payload', () => {
    const data = buildCallbackData('test', '123', '42');
    const parsed = parseCallbackData(data)!;
    expect(verifyCallbackData(parsed.action, parsed.payload, parsed.sig, '42')).toBe(true);
    expect(verifyCallbackData(parsed.action, parsed.payload, parsed.sig, '43')).toBe(false);
  });
});
