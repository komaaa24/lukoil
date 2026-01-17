import { Bot, Keyboard } from 'grammy';
import { BotContext } from '../types';
import { parseAndVerify } from '../../utils/callback';
import { getActiveSubscriptionsForUser } from '../../services/scan.service';
import { formatDateTime } from '../../utils/time';
import { dashboardKeyboard } from '../keyboards';

export const registerDashboardCallbacks = (bot: Bot<BotContext>) => {
  bot.callbackQuery(/act:reminders:.+/, async (ctx): Promise<void> => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'reminders', ctx.from.id);
    if (!parsed) {
      await ctx.answerCallbackQuery({ text: 'Xatolik', show_alert: true });
      return;
    }
    const subs = await getActiveSubscriptionsForUser(String(ctx.from.id));
    const text =
      subs.length === 0
        ? 'Faol eslatmalar yo‘q.'
        : subs
            .map(
              (s) =>
                `${s.productToken.token} → ${formatDateTime(s.nextRunAt, s.timezone)} (${s.mode})`,
            )
            .join('\n');
    await ctx.editMessageText(text, { reply_markup: dashboardKeyboard(ctx.from.id) });
  });

  bot.callbackQuery(/act:help:.+/, async (ctx): Promise<void> => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'help', ctx.from.id);
    if (!parsed) return;
    await ctx.editMessageText(
      'Kod skan qiling → telefon jo‘nating → eslatma yoqiladi. /status orqali holatni ko‘ring.',
      { reply_markup: dashboardKeyboard(ctx.from.id) },
    );
  });
};
