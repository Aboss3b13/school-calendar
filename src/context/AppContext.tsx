import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import i18n from '../i18n';
import { fetchCalendarEvents } from '../services/ical';
import { loadSnapshot, saveSnapshot } from '../services/storage';
import { accentPalette, neutralPalette } from '../theme/theme';
import {
  AppSettings,
  AppStateSnapshot,
  CalendarEvent,
  GradeItem,
  NoteChecklistItem,
  NoteItem,
  TaskItem,
  ThemeMode,
} from '../types/models';
import { defaultIcalUrl } from '../services/ical';
import { renderSchoolOverviewWidget } from '../widgets/SchoolOverviewWidget';

const defaultSettings: AppSettings = {
  iCalUrl: defaultIcalUrl,
  language: 'en',
  themeMode: 'system',
  accentKey: 'blue',
  compactMode: false,
  animationsEnabled: true,
  cardStyle: 'rounded',
  fontScale: 'normal',
  homescreenWidgets: true,
};

const defaultState: AppStateSnapshot = {
  events: [],
  tasks: [],
  notes: [],
  grades: [],
  settings: defaultSettings,
};

function normalizeEvent(event: CalendarEvent): CalendarEvent {
  const subject = event.subject;
  const entryType = event.entryType ?? (event.isExam ? 'exam' : subject ? 'lesson' : 'event');
  return {
    ...event,
    entryType,
    subject,
  };
}

function normalizeChecklist(items?: NoteChecklistItem[]): NoteChecklistItem[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    text: item.text,
    done: Boolean(item.done),
  }));
}

function normalizeNote(note: NoteItem): NoteItem {
  return {
    ...note,
    notebook: note.notebook ?? 'School',
    section: note.section ?? 'General',
    favorite: Boolean(note.favorite),
    color: note.color ?? '#60A5FA',
    checklist: normalizeChecklist(note.checklist),
  };
}

interface AppColors {
  background: string;
  card: string;
  text: string;
  subtle: string;
  border: string;
  accent: string;
}

interface AppContextValue {
  data: AppStateSnapshot;
  colors: AppColors;
  isDark: boolean;
  isReady: boolean;
  fontScaleMultiplier: number;
  syncCalendar: (urlOverride?: string) => Promise<void>;
  updateSettings: (changes: Partial<AppSettings>) => void;
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'completed'>) => void;
  toggleTask: (taskId: string) => void;
  addNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  togglePinNote: (noteId: string) => void;
  toggleFavoriteNote: (noteId: string) => void;
  toggleChecklistItem: (noteId: string, checklistItemId: string) => void;
  deleteNote: (noteId: string) => void;
  addGrade: (grade: Omit<GradeItem, 'id' | 'grade' | 'date'> & { date?: string }) => void;
  removeGrade: (gradeId: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppStateSnapshot>(defaultState);
  const [isReady, setIsReady] = useState(false);
  const systemScheme = useColorScheme();

  useEffect(() => {
    async function bootstrap() {
      const snapshot = await loadSnapshot();
      if (snapshot) {
        setData({
          ...snapshot,
          events: (snapshot.events ?? []).map((event) => normalizeEvent(event)),
          notes: (snapshot.notes ?? []).map((note) => normalizeNote(note)),
          grades: snapshot.grades ?? [],
          settings: {
            ...defaultSettings,
            ...snapshot.settings,
          },
        });
      }

      const language = snapshot?.settings?.language ?? defaultSettings.language;
      await i18n.changeLanguage(language);
      setIsReady(true);
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void saveSnapshot(data);
  }, [data, isReady]);

  useEffect(() => {
    if (!isReady || Platform.OS !== 'android' || !data.settings.homescreenWidgets) {
      return;
    }

    const now = Date.now();
    const nextExam = data.events
      .filter((event) => event.entryType === 'exam' && new Date(event.start).getTime() >= now)
      .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime())[0];

    const openTasks = data.tasks.filter((task) => !task.completed).length;
    const avgGrade =
      data.grades.length > 0
        ? data.grades.reduce((sum, item) => sum + item.grade * item.weight, 0) /
          data.grades.reduce((sum, item) => sum + item.weight, 0)
        : null;

    void requestWidgetUpdate({
      widgetName: 'SchoolOverview',
      renderWidget: () =>
        renderSchoolOverviewWidget({
          title: 'SchoolFlow',
          subtitle: nextExam ? nextExam.title : 'No upcoming exam',
          openTasks,
          averageGrade: avgGrade,
          accent: accentPalette[data.settings.accentKey],
        }),
    }).catch(() => undefined);
  }, [
    data.events,
    data.tasks,
    data.grades,
    data.settings.homescreenWidgets,
    data.settings.accentKey,
    isReady,
  ]);

  const isDark =
    data.settings.themeMode === 'dark' ||
    (data.settings.themeMode === 'system' && systemScheme === 'dark');

  const colors = useMemo<AppColors>(
    () => ({
      background: isDark ? neutralPalette.darkBg : neutralPalette.lightBg,
      card: isDark ? neutralPalette.darkCard : neutralPalette.lightCard,
      text: isDark ? neutralPalette.darkText : neutralPalette.lightText,
      subtle: isDark ? neutralPalette.subtleDark : neutralPalette.subtleLight,
      border: isDark ? neutralPalette.borderDark : neutralPalette.borderLight,
      accent: accentPalette[data.settings.accentKey],
    }),
    [isDark, data.settings.accentKey],
  );

  const syncCalendar = async (urlOverride?: string) => {
    const url = (urlOverride ?? data.settings.iCalUrl).trim();
    const events = (await fetchCalendarEvents(url)).map((event) => normalizeEvent(event));

    setData((prev) => ({
      ...prev,
      events,
      lastCalendarSync: new Date().toISOString(),
      settings: {
        ...prev.settings,
        iCalUrl: url,
      },
    }));
  };

  const updateSettings = (changes: Partial<AppSettings>) => {
    setData((prev) => {
      const updated: AppStateSnapshot = {
        ...prev,
        settings: {
          ...prev.settings,
          ...changes,
        },
      };

      if (changes.language && changes.language !== prev.settings.language) {
        void i18n.changeLanguage(changes.language);
      }

      return updated;
    });
  };

  const addTask: AppContextValue['addTask'] = (task) => {
    setData((prev) => ({
      ...prev,
      tasks: [
        {
          ...task,
          id: createId('task'),
          completed: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.tasks,
      ],
    }));
  };

  const toggleTask: AppContextValue['toggleTask'] = (taskId) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
            }
          : task,
      ),
    }));
  };

  const addNote: AppContextValue['addNote'] = (note) => {
    const timestamp = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      notes: [
        normalizeNote({
          ...note,
          id: createId('note'),
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
        ...prev.notes,
      ],
    }));
  };

  const togglePinNote: AppContextValue['togglePinNote'] = (noteId) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes
        .map((note) =>
          note.id === noteId
            ? {
                ...note,
                pinned: !note.pinned,
                updatedAt: new Date().toISOString(),
              }
            : note,
        )
        .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    }));
  };

  const toggleFavoriteNote: AppContextValue['toggleFavoriteNote'] = (noteId) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              favorite: !note.favorite,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    }));
  };

  const toggleChecklistItem: AppContextValue['toggleChecklistItem'] = (noteId, checklistItemId) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              checklist: (note.checklist ?? []).map((item) =>
                item.id === checklistItemId
                  ? {
                      ...item,
                      done: !item.done,
                    }
                  : item,
              ),
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    }));
  };

  const deleteNote: AppContextValue['deleteNote'] = (noteId) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.filter((note) => note.id !== noteId),
    }));
  };

  const addGrade: AppContextValue['addGrade'] = (gradeInput) => {
    const points = Math.max(0, gradeInput.points);
    const maxPoints = Math.max(1, gradeInput.maxPoints);
    const grade = Math.min(6, Math.max(1, 1 + (5 * points) / maxPoints));

    setData((prev) => ({
      ...prev,
      grades: [
        {
          ...gradeInput,
          points,
          maxPoints,
          grade,
          id: createId('grade'),
          date: gradeInput.date ?? new Date().toISOString(),
        },
        ...prev.grades,
      ],
    }));
  };

  const removeGrade: AppContextValue['removeGrade'] = (gradeId) => {
    setData((prev) => ({
      ...prev,
      grades: prev.grades.filter((grade) => grade.id !== gradeId),
    }));
  };

  const fontScaleMultiplier =
    data.settings.fontScale === 'small' ? 0.92 : data.settings.fontScale === 'large' ? 1.1 : 1;

  return (
    <AppContext.Provider
      value={{
        data,
        colors,
        isDark,
        isReady,
        fontScaleMultiplier,
        syncCalendar,
        updateSettings,
        addTask,
        toggleTask,
        addNote,
        togglePinNote,
        toggleFavoriteNote,
        toggleChecklistItem,
        deleteNote,
        addGrade,
        removeGrade,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }

  return context;
}

export function themeModeLabel(mode: ThemeMode) {
  return mode;
}
