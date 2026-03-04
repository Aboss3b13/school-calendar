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

function extractSubject(text: string): string | undefined {
  const subjectPattern = /\b([a-z]{2,4})_[a-z0-9]+\b/i;
  const simplePattern = /\b([a-z]{2,4})\d{0,2}_[a-z0-9]+\b/i;

  const subjectMatch = text.match(subjectPattern) ?? text.match(simplePattern);
  if (subjectMatch?.[1]) {
    return subjectMatch[1].toUpperCase();
  }

  return undefined;
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
      const subject = extractSubject(`${title} ${description}`);
      const entryType = isExam ? 'exam' : subject ? 'lesson' : 'event';

      return {
        id: String(event.uid ?? `${title}-${startDate.toISOString()}`),
        title,
        description,
        location,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: Boolean(event.startDate?.isDate),
        isExam,
        entryType,
        subject,
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
