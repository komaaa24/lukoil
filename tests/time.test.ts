import { DateTime } from 'luxon';
import { clampReminderDay, computeNextRunAt } from '../src/utils/time';

describe('computeNextRunAt', () => {
  it('schedules next month at 10:00 local time', () => {
    const now = DateTime.fromISO('2024-01-15T08:00:00', { zone: 'Asia/Tashkent' }).toJSDate();
    const next = computeNextRunAt(now, 15, 'Asia/Tashkent');
    const dt = DateTime.fromJSDate(next, { zone: 'Asia/Tashkent' });
    expect(dt.year).toBe(2024);
    expect(dt.month).toBe(2);
    expect(dt.day).toBe(15);
    expect(dt.hour).toBe(10);
    expect(dt.minute).toBe(0);
  });

  it('clamps reminder day to 28', () => {
    expect(clampReminderDay(40)).toBe(28);
    expect(clampReminderDay(0)).toBe(1);
  });
});
