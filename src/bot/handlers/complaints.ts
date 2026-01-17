import { Bot } from 'grammy';
import { BotContext } from '../types';
import { parseAndVerify } from '../../utils/callback';
import { complaintReasonsKeyboard } from '../keyboards';
import { findUserByTelegramId } from '../../services/user.service';
import { createComplaint } from '../../services/complaint.service';
import { ComplaintReason } from '../../db/entities/Complaint';

export const registerComplaintCallbacks = (bot: Bot<BotContext>) => {
  bot.callbackQuery(/act:complaint:.+/, async (ctx) => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'complaint', ctx.from.id);
    if (!parsed) return;
    const tokenRaw = parsed.payload;
    await ctx.editMessageText('Shikoyat sababini tanlang:', {
      reply_markup: complaintReasonsKeyboard(tokenRaw, ctx.from.id),
    });
  });

  bot.callbackQuery(/act:creason:.+/, async (ctx) => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'creason', ctx.from.id);
    if (!parsed) return;
    const [tokenRaw, reason] = parsed.payload.split('|');
    const user = await findUserByTelegramId(String(ctx.from.id));
    if (!user) return;
    await createComplaint(user, tokenRaw, reason as ComplaintReason);
    await ctx.editMessageText('Shikoyat qabul qilindi. Rahmat!');
  });

  bot.callbackQuery(/act:recheck:.+/, async (ctx) => {
    if (!ctx.from) return;
    const parsed = parseAndVerify(ctx, 'recheck', ctx.from.id);
    if (!parsed) return;
    await ctx.answerCallbackQuery({ text: 'Qayta tekshirildi. Rahmat!', show_alert: false });
  });
};
