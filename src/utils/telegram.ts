import { GrammyError, InlineKeyboard, Keyboard } from 'grammy';
import { Contact } from 'grammy/types';

export const buildContactRequestKeyboard = () => {
  return new Keyboard()
    .requestContact('📞 Telefon raqamni yuborish')
    .text('Bekor qilish')
    .oneTime()
    .resized();
};

export const isContactOwnedByUser = (contact: Contact, fromId: number | undefined): boolean => {
  if (!fromId) return false;
  return contact.user_id === fromId;
};

export const isTelegramBlockError = (error: unknown): boolean => {
  if (error instanceof GrammyError) {
    return [403, 400].includes(error.error_code);
  }
  return false;
};

export const adminMenuKeyboard = () =>
  new InlineKeyboard()
    .text('📢 Broadcast yaratish', 'admin:broadcast')
    .row()
    .text('📊 Statistikalar', 'admin:stats')
    .row()
    .text('👤 Foydalanuvchi qidirish', 'admin:lookup')
    .row()
    .text('🏷 Tokenlar', 'admin:tokens')
    .row()
    .text('🧾 Shikoyatlar', 'admin:complaints')
    .row()
    .text('🛑 Broadcastni to‘xtatish', 'admin:stop');
