export type AppLanguage = 'en' | 'de';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AccentKey = 'blue' | 'purple' | 'emerald' | 'rose' | 'amber';

export type CardStyle = 'rounded' | 'soft' | 'glass';

export type FontScale = 'small' | 'normal' | 'large';

export type TaskPriority = 'low' | 'medium' | 'high';

export type NoteType = 'typed' | 'ink' | 'mixed';

export type CalendarEntryType = 'lesson' | 'exam' | 'event';

export interface NoteChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
  isExam: boolean;
  entryType: CalendarEntryType;
  subject?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  details?: string;
  dueDate?: string;
  subject?: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  inkDataUrl?: string;
  tags: string[];
  pinned: boolean;
  favorite?: boolean;
  color?: string;
  checklist?: NoteChecklistItem[];
  type: NoteType;
  notebook?: string;
  section?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradeItem {
  id: string;
  title: string;
  subject: string;
  points: number;
  maxPoints: number;
  weight: number;
  grade: number;
  date: string;
  note?: string;
}

export interface AppSettings {
  iCalUrl: string;
  language: AppLanguage;
  themeMode: ThemeMode;
  accentKey: AccentKey;
  compactMode: boolean;
  animationsEnabled: boolean;
  cardStyle: CardStyle;
  fontScale: FontScale;
  homescreenWidgets: boolean;
}

export interface AppStateSnapshot {
  events: CalendarEvent[];
  tasks: TaskItem[];
  notes: NoteItem[];
  grades: GradeItem[];
  gradeSubjectWeights: Record<string, number>;
  settings: AppSettings;
  lastCalendarSync?: string;
}
