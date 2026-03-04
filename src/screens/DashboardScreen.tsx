import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import SectionCard from '../components/SectionCard';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { data, colors, syncCalendar } = useAppContext();
  const [isSyncing, setIsSyncing] = useState(false);

  const nextEvent = useMemo(() => {
    const now = Date.now();
    return data.events.find((event) => new Date(event.start).getTime() >= now);
  }, [data.events]);

  const examCount = useMemo(() => {
    const now = Date.now();
    return data.events.filter((event) => event.isExam && new Date(event.start).getTime() >= now).length;
  }, [data.events]);

  const openTasks = data.tasks.filter((task) => !task.completed).length;

  async function onSync() {
    setIsSyncing(true);
    try {
      await syncCalendar();
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[colors.accent, '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>{t('dashboard.title')}</Text>
        <Text style={styles.heroText}>{t('dashboard.welcome')}</Text>
      </LinearGradient>

      <Pressable onPress={onSync} style={[styles.syncButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          {isSyncing ? t('common.loading') : t('dashboard.syncNow')}
        </Text>
      </Pressable>

      <SectionCard
        title={t('dashboard.nextEvent')}
        subtitle={nextEvent ? dayjs(nextEvent.start).format('ddd, DD MMM • HH:mm') : '-'}
        background={colors.card}
        textColor={colors.text}
        borderColor={colors.border}
        compact={data.settings.compactMode}
      >
        <Text style={{ color: colors.subtle }}>{nextEvent?.title ?? '—'}</Text>
      </SectionCard>

      <View style={styles.statsRow}>
        <View style={[styles.statTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{examCount}</Text>
          <Text style={{ color: colors.subtle }}>{t('dashboard.upcomingExams')}</Text>
        </View>
        <View style={[styles.statTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{openTasks}</Text>
          <Text style={{ color: colors.subtle }}>{t('dashboard.openTasks')}</Text>
        </View>
        <View style={[styles.statTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{data.notes.length}</Text>
          <Text style={{ color: colors.subtle }}>{t('dashboard.notesCount')}</Text>
        </View>
      </View>

      <Text style={{ color: colors.subtle, marginTop: 8 }}>
        {t('dashboard.syncedAt')}: {data.lastCalendarSync ? dayjs(data.lastCalendarSync).format('DD.MM.YYYY HH:mm') : '—'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  hero: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  heroText: {
    color: '#E0E7FF',
    marginTop: 6,
  },
  syncButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
});
