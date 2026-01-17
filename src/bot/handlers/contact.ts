import { Bot } from 'grammy';
import { BotContext } from '../types';
import { findUserByTelegramId, updateUserPhone, upsertUserFromTelegram } from '../../services/user.service';
import { ensureSubscription } from '../../services/scan.service';
import { isContactOwnedByUser } from '../../utils/telegram';
import { phoneSchema } from '../../utils/validation';
import { ProductToken } from '../../db/entities/ProductToken';
import { AppDataSource } from '../../db/data-source';
import { DEFAULT_TIMEZONE, formatDateTime } from '../../utils/time';

const finishContactFlow = async (ctx: BotContext, phoneNumber: string) => {
  const user =
    (await findUserByTelegramId(String(ctx.from!.id))) || (await upsertUserFromTelegram(ctx.from!));
  const updated = await updateUserPhone(user.id, phoneNumber);
  ctx.session.awaitingPhone = false;
  ctx.session.phoneRequestedAt = null;

  let subscriptionInfo = '';
  if (ctx.session.pendingToken) {
    const productTokenRepo = AppDataSource.getRepository(ProductToken);
    const productToken = await productTokenRepo.findOne({
      where: { token: ctx.session.pendingToken },
    });
    if (productToken) {
      const scannedAt = ctx.session.pendingScannedAt
        ? new Date(ctx.session.pendingScannedAt)
        : new Date();
      const subscription = await ensureSubscription(updated, productToken, scannedAt, DEFAULT_TIMEZONE);
      subscriptionInfo = `\nEslatma yoqildi: ${formatDateTime(
        subscription.nextRunAt,
        subscription.timezone,
      )}`;
    }
  }

  ctx.session.pendingToken = null;
  ctx.session.pendingScannedAt = null;

  await ctx.reply(`Rahmat! Telefon raqamingiz saqlandi.${subscriptionInfo}`, {
    reply_markup: { remove_keyboard: true },
  });
};

export const registerContactHandler = (bot: Bot<BotContext>) => {
  bot.on('message:contact', async (ctx) => {
    if (!ctx.from) return;
    const contact = ctx.message.contact;
    if (!isContactOwnedByUser(contact, ctx.from.id)) {
      await ctx.reply('Faqat o‘zingizning raqamingizni yuboring.');
      return;
    }
    await finishContactFlow(ctx, contact.phone_number);
  });

  bot.hears(/^\+?[0-9]{7,15}$/, async (ctx) => {
    if (!ctx.session.awaitingPhone) return;
    const phone = ctx.match;
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      await ctx.reply('Raqam formati noto‘g‘ri. Iltimos, +998xx... ko‘rinishida yuboring.');
      return;
    }
    await finishContactFlow(ctx, parsed.data);
  });

  bot.hears('Bekor qilish', async (ctx) => {
    if (!ctx.session.awaitingPhone) return;
    ctx.session.awaitingPhone = false;
    ctx.session.pendingToken = null;
    ctx.session.pendingScannedAt = null;
    await ctx.reply('Bekor qilindi.', { reply_markup: { remove_keyboard: true } });
  });
};
