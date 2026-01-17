import { z } from 'zod';

export const productTokenSchema = z
  .string()
  .trim()
  .regex(/^P[0-9]{4}-[A-Z0-9-]{3,}$/i, 'Token formati noto‘g‘ri');

export const validateProductToken = (token: string | null | undefined): string | null => {
  if (!token) return null;
  const parsed = productTokenSchema.safeParse(token.trim().toUpperCase());
  return parsed.success ? parsed.data : null;
};

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/);
