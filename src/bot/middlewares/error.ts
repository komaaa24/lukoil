import { Bot } from 'grammy';
import { logger } from '../../config/logger';
import { BotContext } from '../types';

export const registerErrorHandling = (bot: Bot<BotContext>) => {
  bot.catch((err) => {
    logger.error({ err }, 'Bot error');
  });
};
