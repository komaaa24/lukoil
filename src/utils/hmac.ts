import crypto from 'crypto';
import { env } from '../config/env';

const secret = env.HMAC_SECRET;

export const signPayload = (action: string, payload: string, userId?: string | number): string => {
  const data = userId ? `${action}:${payload}:${userId}` : `${action}:${payload}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex').slice(0, 16);
};

export const buildCallbackData = (
  action: string,
  payload: string,
  userId?: string | number,
): string => {
  const sig = signPayload(action, payload, userId);
  return `act:${action}:${payload}:${sig}`;
};

export const verifyCallbackData = (
  action: string,
  payload: string,
  sig: string,
  userId?: string | number,
): boolean => {
  const expected = signPayload(action, payload, userId);
  return expected === sig;
};

export const parseCallbackData = (
  data: string,
): { action: string; payload: string; sig: string } | null => {
  if (!data.startsWith('act:')) return null;
  const parts = data.split(':');
  if (parts.length < 4) return null;
  const [, action, payload, sig] = parts;
  return { action, payload, sig };
};
