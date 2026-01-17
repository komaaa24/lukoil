import { Bot } from 'grammy';
import { BotContext } from '../types';
import { validateProductToken } from '../../utils/validation';
import { buildContactRequestKeyboard } from '../../utils/telegram';
import { upsertUserFromTelegram } from '../../services/user.service';
import { ensureSubscription, recordScan } from '../../services/scan.service';
import { ScanSource } from '../../db/entities/ScanEvent';
import { DEFAULT_TIMEZONE, formatDateTime } from '../../utils/time';
import { dashboardKeyboard, complaintKeyboard, languageKeyboard, replyMenuKeyboard } from '../keyboards';
import { ensureReferralCode, handleReferralStart } from '../../services/referral.service';

const shouldThrottlePhoneRequest = (lastRequested: number | null): boolean => {
  if (!lastRequested) return false;
  return Date.now() - lastRequested < 45_000;
};

export const registerStartHandler = (bot: Bot<BotContext>) => {
  bot.command('start', async (ctx) => {
    if (!ctx.from) return;
    const payload = (ctx.match || '').trim();
    let tokenRaw = payload;
    if (payload.startsWith('ref_')) {
      tokenRaw = '';
    }
    const scannedAt = new Date();
    const normalizedToken = validateProductToken(tokenRaw);
    const now = Date.now();
    const isRapidRepeat =
      normalizedToken &&
      ctx.session.lastToken === normalizedToken &&
      ctx.session.lastScanAt !== null &&
      now - ctx.session.lastScanAt < 10_000;

    let user = await upsertUserFromTelegram(ctx.from);
    user = await ensureReferralCode(user);
    if (payload.startsWith('ref_')) {
      const refCode = payload.replace('ref_', '');
      await handleReferralStart(refCode, user);
    }
    ctx.session.lastToken = normalizedToken ?? null;
    ctx.session.lastScanAt = now;

    const { tokenValid, productToken, subscription } = await recordScan({
      user,
      tokenRaw: tokenRaw || normalizedToken || 'UNKNOWN',
      scannedAt,
      source: ScanSource.DEEPLINK,
      createSubscription: Boolean(user.phoneNumber),
      timezone: DEFAULT_TIMEZONE,
    });

    if (isRapidRepeat) {
      return;
    }

    if (normalizedToken) {
      ctx.session.pendingToken = normalizedToken;
      ctx.session.pendingScannedAt = scannedAt.toISOString();
    } else {
      ctx.session.pendingToken = null;
      ctx.session.pendingScannedAt = null;
    }

    if (!user.phoneNumber) {
      if (!shouldThrottlePhoneRequest(ctx.session.phoneRequestedAt)) {
        ctx.session.phoneRequestedAt = Date.now();
        ctx.session.awaitingPhone = true;
        await ctx.reply(
          tokenValid
            ? 'Rahmat! Telefon raqamingizni yuboring, shunda eslatmalarni yoqamiz.'
            : 'Token topilmadi yoki noto‘g‘ri. Baribir telefon raqamingizni yuboring.',
          { reply_markup: buildContactRequestKeyboard() },
        );
      } else {
        await ctx.reply('Telefon raqamingizni yuboring.', {
          reply_markup: buildContactRequestKeyboard(),
        });
      }
      return;
    }

    if (productToken) {
      const activeSub = subscription || (await ensureSubscription(user, productToken, scannedAt));
      await ctx.reply(
        `✅ Original mahsulot. Eslatma yoqildi.\nKeyingi eslatma: ${formatDateTime(
          activeSub.nextRunAt,
          activeSub.timezone,
        )}`,
        { reply_markup: replyMenuKeyboard() },
      );
    } else if (tokenRaw) {
      await ctx.reply('⚠️ Tokenni tasdiqlay olmadik.', {
        reply_markup: complaintKeyboard(tokenRaw, ctx.from.id),
      });
    } else {
      await ctx.reply(
        'Xush kelibsiz! Telefon raqamingiz saqlangan.\nEslatma uchun QR tokenni skanerlang yoki tokenni shu chatga yuboring (masalan: P2026-ABCDE).',
        { reply_markup: replyMenuKeyboard() },
      );
    }

    if (!user.languageCode || !user.vehicleBrand || !user.oilType) {
      ctx.session.onboarding = { step: 'LANG' };
      await ctx.reply('Tilni tanlang:', { reply_markup: languageKeyboard(ctx.from.id) });
    }

    if (productToken) {
      const isActive = productToken.isActive !== false;
      if (!isActive) {
        await ctx.reply('⚠️ Kod topilmadi / shubhali', {
          reply_markup: complaintKeyboard(productToken.token, ctx.from.id),
        });
      }
    }
  });
};
