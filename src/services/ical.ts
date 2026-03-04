import ICAL from 'ical.js';
import { CalendarEntryType, CalendarEvent } from '../types/models';

/* ── Keywords for classification ──────────────────────────────── */

/** iCal CATEGORIES values from schulnetz / Swiss school systems */
const CATEGORY_LESSON = ['unterricht', 'lektion', 'class', 'lesson'];
const CATEGORY_EXAM = ['prüfung', 'prüfungen', 'exam', 'test', 'klausur', 'assessment', 'quiz', 'matura'];
const CATEGORY_EVENT = ['termin', 'termine', 'event', 'anlass', 'veranstaltung'];

/** Fallback keywords in title/description */
const examKeywords = [
  'exam', 'prüfung', 'prüfungen', 'test', 'quiz',
  'klausur', 'assessment', 'matura', 'bewertung',
];

const lessonKeywords = [
  'unterricht', 'lektion', 'stunde', 'lesson', 'class',
];

export const defaultIcalUrl =
  'https://www.schulnetz-ag.ch/aksa/cindex.php?longurl=5XKkSde4FzY2rCj37SGEwhv6b97K06tNTfocNn9FeReXWa2VQQ7PU3PuyXaKJ9dx';

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((key) => lower.includes(key));
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

/**
 * Determine the entry type from iCal CATEGORIES, then fall back to keyword matching.
 *
 * Priority:
 * 1. CATEGORIES property (Unterricht → lesson, Prüfung → exam, Termin → event)
 * 2. Keywords in title/description
 * 3. If a subject code is detected → lesson, else → event
 */
function classifyEntry(
  categories: string,
  title: string,
  description: string,
  subject: string | undefined,
): { entryType: CalendarEntryType; isExam: boolean } {
  const catLower = categories.toLowerCase();
  const textBlob = `${title} ${description}`;

  // 1) Check CATEGORIES field from the iCal
  if (matchesAny(catLower, CATEGORY_EXAM)) {
    return { entryType: 'exam', isExam: true };
  }
  if (matchesAny(catLower, CATEGORY_LESSON)) {
    return { entryType: 'lesson', isExam: false };
  }
  if (matchesAny(catLower, CATEGORY_EVENT)) {
    return { entryType: 'event', isExam: false };
  }

  // 2) Keyword matching on title + description
  if (matchesAny(textBlob, examKeywords)) {
    return { entryType: 'exam', isExam: true };
  }
  if (matchesAny(textBlob, lessonKeywords)) {
    return { entryType: 'lesson', isExam: false };
  }

  // 3) If a subject code pattern was found, treat as lesson; otherwise event
  if (subject) {
    return { entryType: 'lesson', isExam: false };
  }

  return { entryType: 'event', isExam: false };
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

      // Extract CATEGORIES property from the raw component
      const rawCategories = sub.getFirstPropertyValue('categories') ?? '';
      const categories = typeof rawCategories === 'string' ? rawCategories : String(rawCategories);

      const subject = extractSubject(`${title} ${description}`);
      const { entryType, isExam } = classifyEntry(categories, title, description, subject);

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
