import ICAL from 'ical.js';
import { CalendarEvent } from '../types/models';

const examKeywords = [
  'exam',
  'prüfung',
  'test',
  'quiz',
  'klausur',
  'assessment',
  'matura',
];

export const defaultIcalUrl =
  'https://www.schulnetz-ag.ch/aksa/cindex.php?longurl=5XKkSde4FzY2rCj37SGEwhv6b97K06tNTfocNn9FeReXWa2VQQ7PU3PuyXaKJ9dx';

function looksLikeExam(text: string): boolean {
  const lower = text.toLowerCase();
  return examKeywords.some((key) => lower.includes(key));
}

export function parseIcsToEvents(icsText: string): CalendarEvent[] {
  const parsed = ICAL.parse(icsText);
  const comp = new ICAL.Component(parsed);
  const vevents = comp.getAllSubcomponents('vevent') ?? [];

  const events = vevents
    .map((sub: any) => {
      const event = new ICAL.Event(sub);
      const title = event.summary ?? 'Untitled Event';
      const description = event.description ?? '';
      const location = event.location ?? '';
      const startDate = event.startDate?.toJSDate?.();
      const endDate = event.endDate?.toJSDate?.();

      if (!startDate || !endDate) {
        return null;
      }

      const isExam = looksLikeExam(`${title} ${description}`);

      return {
        id: String(event.uid ?? `${title}-${startDate.toISOString()}`),
        title,
        description,
        location,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: Boolean(event.startDate?.isDate),
        isExam,
      } satisfies CalendarEvent;
    })
    .filter((event: CalendarEvent | null): event is CalendarEvent => Boolean(event));

  return events.sort(
    (left: CalendarEvent, right: CalendarEvent) =>
      new Date(left.start).getTime() - new Date(right.start).getTime(),
  );
}

export async function fetchCalendarEvents(url: string): Promise<CalendarEvent[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load iCal feed: ${response.status}`);
  }

  const text = await response.text();
  return parseIcsToEvents(text);
}
