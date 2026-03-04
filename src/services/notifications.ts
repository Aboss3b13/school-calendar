import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import { CalendarEvent } from '../types/models';

/* ── Configure notification behaviour ─────────────────────────── */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/* ── Permission helpers ───────────────────────────────────────── */

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('lessons', {
      name: 'Lessons',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('exams', {
      name: 'Exams & Tests',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('study', {
      name: 'Study Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/* ── Schedule notifications ───────────────────────────────────── */

export async function scheduleEventNotifications(events: CalendarEvent[]): Promise<void> {
  // Cancel all previously scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = dayjs();
  const maxFuture = now.add(14, 'day'); // Only schedule for next 14 days

  for (const event of events) {
    const start = dayjs(event.start);

    // Skip past events or events too far in the future
    if (start.isBefore(now) || start.isAfter(maxFuture)) {
      continue;
    }

    if (event.entryType === 'exam') {
      // ── Exam notifications ──────────────────────
      // 1 day before
      const dayBefore = start.subtract(1, 'day');
      if (dayBefore.isAfter(now)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📝 Exam tomorrow: ${event.title}`,
            body: `${event.subject ? event.subject + ' – ' : ''}${start.format('dddd, DD MMM · HH:mm')}`,
            data: { eventId: event.id, type: 'exam' },
            ...(Platform.OS === 'android' ? { channelId: 'exams' } : {}),
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBefore.toDate() },
        });
      }

      // 1 hour before
      const hourBefore = start.subtract(1, 'hour');
      if (hourBefore.isAfter(now)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⚠️ Exam in 1 hour: ${event.title}`,
            body: `${event.subject ? event.subject + ' – ' : ''}${start.format('HH:mm')}`,
            data: { eventId: event.id, type: 'exam' },
            ...(Platform.OS === 'android' ? { channelId: 'exams' } : {}),
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: hourBefore.toDate() },
        });
      }

      // Study reminder: 3 days before at 18:00
      const studyReminder = start.subtract(3, 'day').hour(18).minute(0).second(0);
      if (studyReminder.isAfter(now)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📚 Time to study: ${event.title}`,
            body: `Exam in 3 days! Start preparing for ${event.subject ?? event.title}.`,
            data: { eventId: event.id, type: 'study' },
            ...(Platform.OS === 'android' ? { channelId: 'study' } : {}),
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: studyReminder.toDate() },
        });
      }
    } else if (event.entryType === 'lesson') {
      // ── Lesson notification: 15 min before ──────
      const lessonReminder = start.subtract(15, 'minute');
      if (lessonReminder.isAfter(now)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📖 Lesson in 15 min: ${event.title}`,
            body: `${event.subject ? event.subject + ' – ' : ''}${start.format('HH:mm')}${event.location ? ' · ' + event.location : ''}`,
            data: { eventId: event.id, type: 'lesson' },
            ...(Platform.OS === 'android' ? { channelId: 'lessons' } : {}),
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: lessonReminder.toDate() },
        });
      }
    }
  }
}

/* ── Countdown helper ─────────────────────────────────────────── */

export interface CountdownParts {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
}

export function computeCountdown(targetDate: string): CountdownParts {
  const now = dayjs();
  const target = dayjs(targetDate);
  const totalMs = target.diff(now);

  if (totalMs <= 0) {
    return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }

  const months = target.diff(now, 'month');
  const afterMonths = now.add(months, 'month');
  const days = target.diff(afterMonths, 'day');
  const afterDays = afterMonths.add(days, 'day');
  const hours = target.diff(afterDays, 'hour');
  const afterHours = afterDays.add(hours, 'hour');
  const minutes = target.diff(afterHours, 'minute');
  const afterMinutes = afterHours.add(minutes, 'minute');
  const seconds = target.diff(afterMinutes, 'second');

  return { months, days, hours, minutes, seconds, totalMs, isPast: false };
}
