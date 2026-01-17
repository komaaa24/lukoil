import { Bot } from 'grammy';
import { BotContext } from '../types';
import { parseAndVerify } from '../../utils/callback';
import { loadSubscriptionForUser, confirmReminder, snoozeReminder, stopReminder } from '../../services/subscription.service';
import { reminderActionKeyboard } from '../keyboards';
import { formatDateTime } from '../../utils/time';

export const registerReminderCallbacks = (bot: Bot<BotContext>) => {
  bot.callbackQuery(/act:ract:.+/, async (ctx): Promise<void> => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'ract', ctx.from.id);
    if (!parsed) {
      await ctx.answerCallbackQuery({ text: 'Imzo xatosi', show_alert: true });
      return;
    }
    const [action, subId] = parsed.payload.split('|');
    const subscription = await loadSubscriptionForUser(subId, String(ctx.from.id));
    if (!subscription) {
      await ctx.answerCallbackQuery({ text: 'Topilmadi', show_alert: true });
      return;
    }
    if (action === 'confirm') {
      const updated = await confirmReminder(subscription);
      await ctx.editMessageText(
        `✅ Zo‘r! Keyingi eslatma: ${formatDateTime(updated.nextRunAt, updated.timezone)}`,
        { reply_markup: reminderActionKeyboard(updated, ctx.from.id) },
      );
      return;
    }
    if (action === 'snooze') {
      const updated = await snoozeReminder(subscription);
      await ctx.editMessageText(
        `⏰ 1 haftaga surildi: ${formatDateTime(updated.nextRunAt, updated.timezone)}`,
        { reply_markup: reminderActionKeyboard(updated, ctx.from.id) },
      );
      return;
    }
    if (action === 'stop') {
      await stopReminder(subscription);
      await ctx.editMessageText(
        '🛑 Eslatmalar to‘xtatildi. Qayta yoqish uchun /start <token> yoki /status.',
      );
      return;
    }
  });
};
