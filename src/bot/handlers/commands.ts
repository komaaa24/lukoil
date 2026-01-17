import { Bot } from 'grammy';
import { BotContext } from '../types';
import { findUserByTelegramId, upsertUserFromTelegram } from '../../services/user.service';
import { deactivateAllSubscriptions, getActiveSubscriptionsForUser } from '../../services/scan.service';
import { formatDateTime } from '../../utils/time';
import { dashboardKeyboard, replyMenuKeyboard } from '../keyboards';
import { ensureReferralCode } from '../../services/referral.service';

export const registerCommonCommands = (bot: Bot<BotContext>) => {
  bot.command('help', async (ctx) => {
    await ctx.reply(
      [
        'Botga xush kelibsiz!',
        'Kodlangan tokenni skanerlang va telefon raqamingizni yuboring.',
        'Biz oyiga bir marta moy almashtirish eslatmasini yuboramiz.',
        'Maxfiylik: telefon raqamingiz faqat eslatma va admin analitikasi uchun ishlatiladi. Hech kim bilan ulashilmaydi.',
      ].join('\n'),
    );
  });

  bot.command('menu', async (ctx) => {
    if (!ctx.from) return;
    await ctx.reply('Menyu:', { reply_markup: replyMenuKeyboard() });
  });

  bot.command('profile', async (ctx) => {
    if (!ctx.from) return;
    const user = await findUserByTelegramId(String(ctx.from.id));
    if (!user) {
      await ctx.reply('Foydalanuvchi topilmadi. /start ni bosing.');
      return;
    }
    await ctx.reply('Profil', { reply_markup: dashboardKeyboard(ctx.from.id) });
  });

  bot.command('status', async (ctx) => {
    if (!ctx.from) return;
    const user = await findUserByTelegramId(String(ctx.from.id));
    if (!user) {
      await ctx.reply('Foydalanuvchi topilmadi. Iltimos, /start ni bosing.');
      return;
    }
    const subs = await getActiveSubscriptionsForUser(user.id);
    const subsText =
      subs.length === 0
        ? 'Faol eslatmalar yo‘q.'
        : subs
            .map(
              (s) =>
                `${s.productToken.token} → keyingi: ${formatDateTime(s.nextRunAt, s.timezone)}`,
            )
            .join('\n');
    await ctx.reply(
      [
        `Telefon: ${user.phoneNumber ?? 'yo‘q'}`,
        `Faol eslatmalar: ${subs.length}`,
        subsText,
      ].join('\n'),
    );
  });

  bot.command('stop', async (ctx) => {
    if (!ctx.from) return;
    const user = await findUserByTelegramId(String(ctx.from.id));
    if (!user) {
      await ctx.reply('Foydalanuvchi topilmadi. /start ni bosing.');
      return;
    }
    await deactivateAllSubscriptions(user.id);
    await ctx.reply('Barcha eslatmalar o‘chirildi. Qayta yoqish uchun tokenni qayta skanerlang.');
  });

  bot.command('invite', async (ctx) => {
    if (!ctx.from) return;
    const user = await upsertUserFromTelegram(ctx.from);
    const updated = await ensureReferralCode(user);
    const link = `https://t.me/${ctx.me.username}?start=ref_${updated.referralCode}`;
    await ctx.reply(`Do‘stingizni taklif qiling:\n${link}`);
  });
};
