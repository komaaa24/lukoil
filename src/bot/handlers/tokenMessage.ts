import { Bot } from 'grammy';
import { BotContext } from '../types';
import { validateProductToken } from '../../utils/validation';
import { buildContactRequestKeyboard, isContactOwnedByUser } from '../../utils/telegram';
import { upsertUserFromTelegram } from '../../services/user.service';
import { ensureSubscription, recordScan } from '../../services/scan.service';
import { ScanSource } from '../../db/entities/ScanEvent';
import { DEFAULT_TIMEZONE, formatDateTime } from '../../utils/time';

export const registerTokenMessageHandler = (bot: Bot<BotContext>) => {
  bot.hears(/^P[0-9]{4}-[A-Z0-9-]{3,}$/i, async (ctx) => {
    if (!ctx.from) return;
    const tokenRaw = ctx.match[0];
    const normalizedToken = validateProductToken(tokenRaw);
    if (!normalizedToken) {
      await ctx.reply('Token formati noto‘g‘ri. P2026-XXXXX ko‘rinishida yuboring.');
      return;
    }

    const now = Date.now();
    const user = await upsertUserFromTelegram(ctx.from);
    ctx.session.lastToken = normalizedToken;
    ctx.session.lastScanAt = now;

    const scannedAt = new Date();
    const { productToken, subscription } = await recordScan({
      user,
      tokenRaw: normalizedToken,
      scannedAt,
      source: ScanSource.MANUAL,
      createSubscription: Boolean(user.phoneNumber),
      timezone: DEFAULT_TIMEZONE,
    });

    ctx.session.pendingToken = normalizedToken;
    ctx.session.pendingScannedAt = scannedAt.toISOString();

    if (!user.phoneNumber) {
      ctx.session.awaitingPhone = true;
      ctx.session.phoneRequestedAt = Date.now();
      await ctx.reply('Telefon raqamingizni yuboring, shunda eslatmani yoqamiz.', {
        reply_markup: buildContactRequestKeyboard(),
      });
      return;
    }

    if (!productToken) {
      await ctx.reply('Tokenni tasdiqlay olmadik. Format: P2026-XXXXX');
      return;
    }

    const activeSub = subscription || (await ensureSubscription(user, productToken, scannedAt));
    await ctx.reply(
      `Rahmat! Eslatma yoqildi.\nKeyingi eslatma: ${formatDateTime(
        activeSub.nextRunAt,
        activeSub.timezone,
      )}`,
    );
  });
};
