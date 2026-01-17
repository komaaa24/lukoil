import { BotContext } from '../bot/types';
import { buildCallbackData, parseCallbackData, verifyCallbackData } from './hmac';

export const makeAction = (action: string, payload: string, userId?: string | number) =>
  buildCallbackData(action, payload, userId);

export const parseAndVerify = (
  ctx: BotContext,
  expectedAction: string,
  expectedUserId?: string | number,
): { payload: string } | null => {
  const data = ctx.callbackQuery?.data;
  if (!data) return null;
  const parsed = parseCallbackData(data);
  if (!parsed) return null;
  if (parsed.action !== expectedAction) return null;
  const ok = verifyCallbackData(parsed.action, parsed.payload, parsed.sig, expectedUserId);
  if (!ok) return null;
  return { payload: parsed.payload };
};
