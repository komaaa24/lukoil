import { Bot } from 'grammy';
import { BotContext } from '../types';
import { registerStartHandler } from './start';
import { registerContactHandler } from './contact';
import { registerCommonCommands } from './commands';
import { registerAdminHandlers } from './admin';
import { registerTokenMessageHandler } from './tokenMessage';
import { registerProfileCallbacks } from './profile';
import { registerReminderCallbacks } from './reminders';
import { registerComplaintCallbacks } from './complaints';
import { registerDashboardCallbacks } from './dashboard';

export const registerHandlers = (bot: Bot<BotContext>) => {
  registerStartHandler(bot);
  registerContactHandler(bot);
  registerTokenMessageHandler(bot);
  registerProfileCallbacks(bot);
  registerReminderCallbacks(bot);
  registerComplaintCallbacks(bot);
  registerDashboardCallbacks(bot);
  registerCommonCommands(bot);
  registerAdminHandlers(bot);
};
