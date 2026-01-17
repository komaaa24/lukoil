import { DateTime } from 'luxon';

export const DEFAULT_TIMEZONE = 'Asia/Tashkent';

export const clampReminderDay = (day: number): number => {
  if (Number.isNaN(day) || day < 1) return 1;
  if (day > 28) return 28;
  return Math.floor(day);
};

export const computeNextRunAt = (
  fromDate: Date,
  reminderDay: number,
  timezone = DEFAULT_TIMEZONE,
): Date => {
  const day = clampReminderDay(reminderDay);
  const base = DateTime.fromJSDate(fromDate, { zone: timezone })
    .plus({ months: 1 })
    .set({ day, hour: 10, minute: 0, second: 0, millisecond: 0 });
  return base.toJSDate();
};

export const computeNextAfterSend = (
  lastRunAt: Date,
  reminderDay: number,
  timezone = DEFAULT_TIMEZONE,
): Date => {
  const day = clampReminderDay(reminderDay);
  const base = DateTime.fromJSDate(lastRunAt, { zone: timezone })
    .plus({ months: 1 })
    .set({ day, hour: 10, minute: 0, second: 0, millisecond: 0 });
  return base.toJSDate();
};

export const formatDateTime = (date: Date, timezone = DEFAULT_TIMEZONE): string => {
  return DateTime.fromJSDate(date, { zone: timezone }).toFormat('yyyy-LL-dd HH:mm');
};
