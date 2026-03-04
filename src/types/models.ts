export type AppLanguage = 'en' | 'de';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AccentKey = 'blue' | 'purple' | 'emerald' | 'rose' | 'amber';

export type TaskPriority = 'low' | 'medium' | 'high';

export type NoteType = 'typed' | 'ink' | 'mixed';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
  isExam: boolean;
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
  type: NoteType;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  iCalUrl: string;
  language: AppLanguage;
  themeMode: ThemeMode;
  accentKey: AccentKey;
  compactMode: boolean;
}

export interface AppStateSnapshot {
  events: CalendarEvent[];
  tasks: TaskItem[];
  notes: NoteItem[];
  settings: AppSettings;
  lastCalendarSync?: string;
}
