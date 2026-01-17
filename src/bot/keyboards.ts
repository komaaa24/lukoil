import { InlineKeyboard } from 'grammy';
import { makeAction } from '../utils/callback';
import { Subscription } from '../db/entities/Subscription';
import { Keyboard } from 'grammy';

export const dashboardKeyboard = (userId: string | number) =>
  new InlineKeyboard()
    .text('🧾 Profil', makeAction('profile', 'open', userId))
    .text('⏰ Eslatmalar', makeAction('reminders', 'list', userId))
    .row()
    .text('🎁 Ballar', makeAction('points', 'open', userId))
    .text('ℹ️ Yordam', makeAction('help', 'open', userId));

export const languageKeyboard = (userId: string | number) =>
  new InlineKeyboard()
    .text('🇺🇿 O‘zbekcha', makeAction('lang', 'uz', userId))
    .text('🇷🇺 Русский', makeAction('lang', 'ru', userId));

export const brandKeyboard = (userId: string | number) =>
  new InlineKeyboard()
    .text('Chevrolet', makeAction('brand', 'Chevrolet', userId))
    .text('Kia', makeAction('brand', 'Kia', userId))
    .row()
    .text('Toyota', makeAction('brand', 'Toyota', userId))
    .text('Hyundai', makeAction('brand', 'Hyundai', userId))
    .row()
    .text('Other', makeAction('brand', 'Other', userId));

export const oilKeyboard = (userId: string | number) =>
  new InlineKeyboard()
    .text('5W-30', makeAction('oil', '5W-30', userId))
    .text('5W-40', makeAction('oil', '5W-40', userId))
    .row()
    .text('10W-40', makeAction('oil', '10W-40', userId))
    .text('ATF', makeAction('oil', 'ATF', userId))
    .row()
    .text('Antifreeze', makeAction('oil', 'Antifreeze', userId))
    .text('Other', makeAction('oil', 'Other', userId));

export const mileageModeKeyboard = (userId: string | number) =>
  new InlineKeyboard()
    .text('📅 Oylik', makeAction('mmode', 'MONTHLY', userId))
    .text('🧮 KM bo‘yicha', makeAction('mmode', 'KM', userId));

export const reminderActionKeyboard = (subscription: Subscription, userId: string | number) =>
  new InlineKeyboard()
    .text('✅ Almashtirdim', makeAction('ract', `confirm|${subscription.id}`, userId))
    .row()
    .text('⏰ 1 haftadan keyin eslat', makeAction('ract', `snooze|${subscription.id}`, userId))
    .row()
    .text('🛑 To‘xtatish', makeAction('ract', `stop|${subscription.id}`, userId));

export const complaintKeyboard = (tokenRaw: string, userId: string | number) =>
  new InlineKeyboard()
    .text('📩 Shikoyat yuborish', makeAction('complaint', tokenRaw, userId))
    .row()
    .text('🔁 Qayta tekshirish', makeAction('recheck', tokenRaw, userId));

export const complaintReasonsKeyboard = (tokenRaw: string, userId: string | number) =>
  new InlineKeyboard()
    .text('Kod topilmadi', makeAction('creason', `${tokenRaw}|UNKNOWN_TOKEN`, userId))
    .row()
    .text('Nusxa/duplikat', makeAction('creason', `${tokenRaw}|DUPLICATE`, userId))
    .row()
    .text('Shikastlangan', makeAction('creason', `${tokenRaw}|DAMAGED`, userId))
    .row()
    .text('Boshqa', makeAction('creason', `${tokenRaw}|OTHER`, userId));

export const replyMenuKeyboard = () =>
  new Keyboard()
    .text('🧾 Profil')
    .text('⏰ Eslatmalar')
    .row()
    .text('🎁 Ballar')
    .text('ℹ️ Yordam')
    .resized();
