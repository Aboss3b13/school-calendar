import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import SectionCard from '../components/SectionCard';
import InfoWidget from '../components/InfoWidget';
import { weightedSubjectAverage } from '../services/grades';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { data, colors, syncCalendar, fontScaleMultiplier } = useAppContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const { width } = useWindowDimensions();
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data.settings.animationsEnabled) {
      pulseValue.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(pulseValue, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [data.settings.animationsEnabled, pulseValue]);

  const nextEvent = useMemo(() => {
    const now = Date.now();
    return data.events.find((event) => new Date(event.start).getTime() >= now);
  }, [data.events]);

  const examCount = useMemo(() => {
    const now = Date.now();
    return data.events.filter((event) => event.isExam && new Date(event.start).getTime() >= now).length;
  }, [data.events]);

  const lessonCount = useMemo(() => {
    const now = Date.now();
    return data.events.filter((event) => event.entryType === 'lesson' && new Date(event.start).getTime() >= now).length;
  }, [data.events]);

  const openTasks = data.tasks.filter((task) => !task.completed).length;
  const isTablet = width >= 860;

  const averageGrade = useMemo(() => {
    const officialGrades = data.grades.filter((grade) => grade.track === 'official');
    return weightedSubjectAverage(officialGrades, data.gradeSubjectWeights);
  }, [data.grades, data.gradeSubjectWeights]);

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
      <Animated.View
        style={{
          transform: [
            {
              scale: pulseValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              }),
            },
          ],
        }}
      >
        <LinearGradient
          colors={[colors.accent, '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.hero,
            {
              borderRadius:
                data.settings.cardStyle === 'soft' ? 26 : data.settings.cardStyle === 'glass' ? 22 : 18,
              padding: data.settings.compactMode ? 14 : 18,
            },
          ]}
        >
          <Text style={[styles.heroTitle, { fontSize: 22 * fontScaleMultiplier }]}>{t('dashboard.title')}</Text>
          <Text style={[styles.heroText, { fontSize: 14 * fontScaleMultiplier }]}>{t('dashboard.welcome')}</Text>
        </LinearGradient>
      </Animated.View>

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

      <View style={[styles.statsRow, isTablet ? styles.statsRowTablet : undefined]}>
        <InfoWidget
          title={t('dashboard.upcomingExams')}
          value={examCount}
          accent={colors.accent}
          textColor={colors.text}
          subtleColor={colors.subtle}
          background={colors.card}
          borderColor={colors.border}
        />
        <InfoWidget
          title={t('dashboard.openTasks')}
          value={openTasks}
          accent={colors.accent}
          textColor={colors.text}
          subtleColor={colors.subtle}
          background={colors.card}
          borderColor={colors.border}
        />
        <InfoWidget
          title={t('dashboard.notesCount')}
          value={data.notes.length}
          accent={colors.accent}
          textColor={colors.text}
          subtleColor={colors.subtle}
          background={colors.card}
          borderColor={colors.border}
        />
        <InfoWidget
          title={t('calendar.lessons')}
          value={lessonCount}
          accent={colors.accent}
          textColor={colors.text}
          subtleColor={colors.subtle}
          background={colors.card}
          borderColor={colors.border}
        />
        <InfoWidget
          title={t('grades.averageSwiss')}
          value={averageGrade ? averageGrade.toFixed(2) : '-'}
          accent={colors.accent}
          textColor={colors.text}
          subtleColor={colors.subtle}
          background={colors.card}
          borderColor={colors.border}
        />
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
    flexWrap: 'wrap',
    gap: 8,
  },
  statsRowTablet: {
    gap: 12,
  },
});
