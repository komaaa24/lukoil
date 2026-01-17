import { Bot } from 'grammy';
import { BotContext } from '../types';
import { parseAndVerify } from '../../utils/callback';
import {
  brandKeyboard,
  dashboardKeyboard,
  languageKeyboard,
  mileageModeKeyboard,
  oilKeyboard,
} from '../keyboards';
import { updateUserPreferences, findUserByTelegramId } from '../../services/user.service';
import { MileageMode } from '../../db/entities/User';
import { ensureReferralCode, getPointsAndPromos } from '../../services/referral.service';

const renderProfileText = (user: any) =>
  [
    `Til: ${user.languageCode ?? 'tanlanmagan'}`,
    `Avtomobil: ${user.vehicleBrand ?? 'tanlanmagan'}`,
    `Moy turi: ${user.oilType ?? 'tanlanmagan'}`,
    `Rejim: ${user.mileageMode === MileageMode.KM ? 'KM' : 'Oylik'}`,
    `Threshold: ${user.mileageThreshold} km`,
  ].join('\n');

export const registerProfileCallbacks = (bot: Bot<BotContext>) => {
  bot.callbackQuery(/act:lang:.+/, async (ctx): Promise<void> => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'lang', ctx.from.id);
    if (!parsed) {
      await ctx.answerCallbackQuery({ text: 'Xatolik (imzo)', show_alert: true });
      return;
    }
    const lang = parsed.payload;
    const user = await findUserByTelegramId(String(ctx.from.id));
    if (!user) return;
    await updateUserPreferences(user.id, { languageCode: lang });
    await ctx.editMessageText('Avtomobil brendini tanlang:', {
      reply_markup: brandKeyboard(ctx.from.id),
    });
  });

  bot.callbackQuery(/act:brand:.+/, async (ctx): Promise<void> => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'brand', ctx.from.id);
    if (!parsed) {
      await ctx.answerCallbackQuery({ text: 'Xatolik', show_alert: true });
      return;
    }
    const brand = parsed.payload;
    const user = await findUserByTelegramId(String(ctx.from.id));
    if (!user) return;
    await updateUserPreferences(user.id, { vehicleBrand: brand });
    await ctx.editMessageText('Moy turini tanlang:', { reply_markup: oilKeyboard(ctx.from.id) });
  });

  bot.callbackQuery(/act:oil:.+/, async (ctx): Promise<void> => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'oil', ctx.from.id);
    if (!parsed) {
      await ctx.answerCallbackQuery({ text: 'Xatolik', show_alert: true });
      return;
    }
    const oil = parsed.payload;
    const user = await findUserByTelegramId(String(ctx.from.id));
    if (!user) return;
    await updateUserPreferences(user.id, { oilType: oil });
    await ctx.editMessageText('Eslatma rejimini tanlang:', {
      reply_markup: mileageModeKeyboard(ctx.from.id),
    });
  });

  bot.callbackQuery(/act:mmode:.+/, async (ctx): Promise<void> => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'mmode', ctx.from.id);
    if (!parsed) {
      await ctx.answerCallbackQuery({ text: 'Xatolik', show_alert: true });
      return;
    }
    const mode = parsed.payload === 'KM' ? MileageMode.KM : MileageMode.MONTHLY;
    const user = await findUserByTelegramId(String(ctx.from.id));
    if (!user) return;
    await updateUserPreferences(user.id, { mileageMode: mode });
    await ctx.editMessageText('Profil yangilandi.', {
      reply_markup: dashboardKeyboard(ctx.from.id),
    });
  });

  bot.callbackQuery(/act:profile:.+/, async (ctx): Promise<void> => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'profile', ctx.from.id);
    if (!parsed) return;
    const user = await findUserByTelegramId(String(ctx.from.id));
    if (!user) return;
    await ensureReferralCode(user);
    await ctx.editMessageText(renderProfileText(user), {
      reply_markup: languageKeyboard(ctx.from.id),
    });
  });

  bot.callbackQuery(/act:points:.+/, async (ctx): Promise<void> => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'points', ctx.from.id);
    if (!parsed) return;
    const user = await findUserByTelegramId(String(ctx.from.id));
    if (!user) return;
    const { points, promos } = await getPointsAndPromos(user.id);
    const promoText = promos.length
      ? promos.map((p) => `${p.code} (${p.status})`).join('\n')
      : 'Promo yo‘q';
    await ctx.editMessageText(`Ballar: ${points}\nPromo: ${promoText}`, {
      reply_markup: dashboardKeyboard(ctx.from.id),
    });
  });
};
