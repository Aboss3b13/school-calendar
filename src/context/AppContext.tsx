import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import i18n from '../i18n';
import { fetchCalendarEvents } from '../services/ical';
import { loadSnapshot, saveSnapshot } from '../services/storage';
import { accentPalette, neutralPalette } from '../theme/theme';
import {
  AppSettings,
  AppStateSnapshot,
  CalendarEvent,
  NoteItem,
  TaskItem,
  ThemeMode,
} from '../types/models';
import { defaultIcalUrl } from '../services/ical';

const defaultSettings: AppSettings = {
  iCalUrl: defaultIcalUrl,
  language: 'en',
  themeMode: 'system',
  accentKey: 'blue',
  compactMode: false,
};

const defaultState: AppStateSnapshot = {
  events: [],
  tasks: [],
  notes: [],
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
  syncCalendar: (urlOverride?: string) => Promise<void>;
  updateSettings: (changes: Partial<AppSettings>) => void;
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'completed'>) => void;
  toggleTask: (taskId: string) => void;
  addNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  togglePinNote: (noteId: string) => void;
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
          notes: (snapshot.notes ?? []).map((note) => ({
            ...note,
            notebook: note.notebook ?? 'School',
            section: note.section ?? 'General',
          })),
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
        {
          ...note,
          notebook: note.notebook ?? 'School',
          section: note.section ?? 'General',
          id: createId('note'),
          createdAt: timestamp,
          updatedAt: timestamp,
        },
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

  return (
    <AppContext.Provider
      value={{
        data,
        colors,
        isDark,
        isReady,
        syncCalendar,
        updateSettings,
        addTask,
        toggleTask,
        addNote,
        togglePinNote,
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
