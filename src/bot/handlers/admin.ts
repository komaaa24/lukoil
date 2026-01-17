import { Bot } from 'grammy';
import { DateTime } from 'luxon';
import { BotContext } from '../types';
import { adminMenuKeyboard } from '../../utils/telegram';
import { assertAdmin } from '../../services/auth.service';
import { BroadcastTarget } from '../../db/entities/Broadcast';
import { cancelScheduledBroadcasts, createBroadcast, getStats, lookupUser, queueBroadcast } from '../../services/broadcast.service';
import { deleteUserByTelegramId } from '../../services/user.service';
import { listRecentComplaints } from '../../services/complaint.service';

const targetKeyboard = () => ({
  inline_keyboard: [
    [
      { text: 'Hammasi', callback_data: 'admin:target:ALL_USERS' },
      { text: 'Telefonli', callback_data: 'admin:target:USERS_WITH_PHONE' },
      { text: 'Faol subs', callback_data: 'admin:target:USERS_WITH_ACTIVE_SUBS' },
    ],
    [
      { text: 'Oxirgi 30 kun', callback_data: 'admin:target:SCANNED_LAST_30_DAYS' },
      { text: 'Moy turi bo‘yicha', callback_data: 'admin:target:BY_OIL_TYPE' },
    ],
  ],
});

const sendOptionsKeyboard = () => ({
  inline_keyboard: [
    [{ text: 'Hoziroq yuborish', callback_data: 'admin:send_now' }],
    [{ text: 'Vaqt belgilash', callback_data: 'admin:schedule' }],
  ],
});

const ensureAdmin = async (ctx: BotContext) => {
  const admin = await assertAdmin(ctx.from?.id);
  return admin;
};

export const registerAdminHandlers = (bot: Bot<BotContext>) => {
  bot.command('admin', async (ctx) => {
    try {
      await ensureAdmin(ctx);
      await ctx.reply('Admin paneli', { reply_markup: adminMenuKeyboard() });
    } catch (err) {
      await ctx.reply((err as Error).message);
    }
  });

  bot.command('udalit', async (ctx) => {
    try {
      await ensureAdmin(ctx);
      const arg = (ctx.match || '').trim();
      if (!arg) {
        await ctx.reply('Foydalanish: /udalit <telegram_id>');
        return;
      }
      if (!/^[0-9]+$/.test(arg)) {
        await ctx.reply('Faqat telegram_id ni raqam sifatida kiriting.');
        return;
      }
      const deleted = await deleteUserByTelegramId(arg);
      if (deleted) {
        await ctx.reply(`Foydalanuvchi ${arg} uchun ma’lumotlar o‘chirildi.`);
      } else {
        await ctx.reply('Foydalanuvchi topilmadi.');
      }
    } catch (err) {
      await ctx.reply((err as Error).message);
    }
  });

  bot.callbackQuery('admin:broadcast', async (ctx) => {
    try {
      await ensureAdmin(ctx);
      ctx.session.adminFlow = { step: 'BROADCAST_MESSAGE', draft: {} };
      await ctx.editMessageText('Broadcast matnini yuboring:');
    } catch (err) {
      await ctx.answerCallbackQuery({ text: (err as Error).message, show_alert: true });
    }
  });

  bot.callbackQuery(/admin:target:(.+)/, async (ctx) => {
    try {
      await ensureAdmin(ctx);
      const target = ctx.match![1] as BroadcastTarget;
      if (!ctx.session.adminFlow) return;
      ctx.session.adminFlow.draft = { ...(ctx.session.adminFlow.draft || {}), target };
      if (target === BroadcastTarget.BY_OIL_TYPE) {
        ctx.session.adminFlow.step = 'BROADCAST_FILTER';
        await ctx.editMessageText('Qaysi moy turi? (masalan 5W-30)');
      } else {
        ctx.session.adminFlow.step = 'BROADCAST_SCHEDULE';
        await ctx.editMessageText('Qanday yuboramiz?', { reply_markup: sendOptionsKeyboard() });
      }
    } catch (err) {
      await ctx.answerCallbackQuery({ text: (err as Error).message, show_alert: true });
    }
  });

  bot.callbackQuery('admin:send_now', async (ctx) => {
    try {
      const admin = await ensureAdmin(ctx);
      const draft = ctx.session.adminFlow?.draft;
      if (!draft?.messageText || !draft.target) {
        await ctx.answerCallbackQuery({ text: 'Draft topilmadi', show_alert: true });
        return;
      }
      const broadcast = await createBroadcast({
        admin,
        messageText: draft.messageText,
        target: draft.target,
        filterValue: draft.filterValue,
        scheduledAt: new Date(),
      });
      await queueBroadcast(broadcast);
      ctx.session.adminFlow = undefined;
      await ctx.editMessageText('Broadcast yuborish boshlandi.');
    } catch (err) {
      await ctx.answerCallbackQuery({ text: (err as Error).message, show_alert: true });
    }
  });

  bot.callbackQuery('admin:schedule', async (ctx) => {
    try {
      await ensureAdmin(ctx);
      if (!ctx.session.adminFlow) return;
      ctx.session.adminFlow.step = 'BROADCAST_SCHEDULE';
      await ctx.editMessageText(
        'Qachon yuboramiz? Format: 2026-05-01 10:00 (Asia/Tashkent)',
      );
    } catch (err) {
      await ctx.answerCallbackQuery({ text: (err as Error).message, show_alert: true });
    }
  });

  bot.callbackQuery('admin:stats', async (ctx) => {
    try {
      await ensureAdmin(ctx);
      const stats = await getStats();
      const text = [
        `Foydalanuvchilar: ${stats.totalUsers}`,
        `Telefonli: ${stats.usersWithPhone}`,
        `Faol eslatmalar: ${stats.activeSubs}`,
        `Oxirgi 7 kunda skanlar: ${stats.scansLast7Days}`,
        `Broadcastlar (yakunlandi/xatolik): ${stats.broadcastsDone}/${stats.broadcastsFailed}`,
      ].join('\n');
      await ctx.editMessageText(text);
    } catch (err) {
      await ctx.answerCallbackQuery({ text: (err as Error).message, show_alert: true });
    }
  });

  bot.callbackQuery('admin:stop', async (ctx) => {
    try {
      await ensureAdmin(ctx);
      const stopped = await cancelScheduledBroadcasts();
      await ctx.editMessageText(`Bekor qilindi: ${stopped} ta rejalashtirilgan broadcast`);
    } catch (err) {
      await ctx.answerCallbackQuery({ text: (err as Error).message, show_alert: true });
    }
  });

  bot.callbackQuery('admin:lookup', async (ctx) => {
    try {
      await ensureAdmin(ctx);
      ctx.session.adminFlow = { step: 'USER_LOOKUP' };
      await ctx.editMessageText('Telefon yoki telegramId kiriting:');
    } catch (err) {
      await ctx.answerCallbackQuery({ text: (err as Error).message, show_alert: true });
    }
  });

  bot.callbackQuery('admin:complaints', async (ctx) => {
    try {
      await ensureAdmin(ctx);
      const list = await listRecentComplaints();
      if (list.length === 0) {
        await ctx.editMessageText('Shikoyatlar yo‘q');
        return;
      }
      const text = list
        .map(
          (c) =>
            `${c.id.slice(0, 6)} | ${c.reason} | ${c.status} | ${c.tokenRaw} | ${c.user?.telegramId}`,
        )
        .join('\n');
      await ctx.editMessageText(text);
    } catch (err) {
      await ctx.answerCallbackQuery({ text: (err as Error).message, show_alert: true });
    }
  });

  bot.callbackQuery('admin:tokens', async (ctx) => {
    try {
      await ensureAdmin(ctx);
      await ctx.editMessageText('Tokenlar boshqaruvi: hozircha qo‘lda DB orqali.');
    } catch (err) {
      await ctx.answerCallbackQuery({ text: (err as Error).message, show_alert: true });
    }
  });

  bot.on('message:text', async (ctx, next) => {
    const flow = ctx.session.adminFlow;
    if (!flow) {
      await next();
      return;
    }
    try {
      const admin = await ensureAdmin(ctx);
      if (flow.step === 'BROADCAST_MESSAGE') {
        const messageText = ctx.message.text.trim();
        ctx.session.adminFlow = {
          step: 'BROADCAST_TARGET',
          draft: { messageText },
        };
        await ctx.reply('Targetni tanlang:', { reply_markup: targetKeyboard() });
        return;
      }
      if (flow.step === 'BROADCAST_FILTER') {
        ctx.session.adminFlow = {
          step: 'BROADCAST_SCHEDULE',
          draft: { ...(flow.draft || {}), filterValue: ctx.message.text.trim() },
        };
        await ctx.reply('Qanday yuboramiz?', { reply_markup: sendOptionsKeyboard() });
        return;
      }
      if (flow.step === 'BROADCAST_SCHEDULE') {
        const draft = ctx.session.adminFlow?.draft || flow.draft;
        if (!draft?.messageText || !draft.target) {
          await ctx.reply('Draft topilmadi, boshidan /admin ni bosing.');
          ctx.session.adminFlow = undefined;
          return;
        }
        const parsedDate = DateTime.fromFormat(ctx.message.text.trim(), 'yyyy-LL-dd HH:mm', {
          zone: 'Asia/Tashkent',
        });
        if (!parsedDate.isValid) {
          await ctx.reply('Vaqt formati noto‘g‘ri. 2026-05-01 10:00 ko‘rinishida yozing.');
          return;
        }
        const scheduledAt = parsedDate.toJSDate();
        const broadcast = await createBroadcast({
          admin,
          messageText: draft.messageText,
          target: draft.target,
          scheduledAt,
          filterValue: draft.filterValue,
        });
        ctx.session.adminFlow = undefined;
        await ctx.reply(
          `Broadcast saqlandi. Holat: ${broadcast.status}. Rejalashtirilgan vaqt: ${scheduledAt.toISOString()}`,
        );
        return;
      }
      if (flow.step === 'USER_LOOKUP') {
        const users = await lookupUser(ctx.message.text.trim());
        if (users.length === 0) {
          await ctx.reply('Topilmadi');
        } else {
          const lines = users.map((u) => {
            const subs = (u.subscriptions || [])
              .filter((s) => s.isActive)
              .map((s) => s.productToken?.token)
              .join(', ');
            return `ID: ${u.telegramId} | Tel: ${u.phoneNumber ?? 'yo‘q'} | Subs: ${subs || 'yo‘q'}`;
          });
          await ctx.reply(lines.join('\n'));
        }
        ctx.session.adminFlow = undefined;
        return;
      }
    } catch (err) {
      await ctx.reply((err as Error).message);
    }
    await next();
  });
};
