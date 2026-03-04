import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import InfoWidget from '../components/InfoWidget';
import { weightedSubjectAverage } from '../services/grades';
import { shadows, spacing, radii, gradeColor } from '../theme/theme';

function timeGreeting(t: (key: string) => string): string {
  const h = new Date().getHours();
  if (h < 6) return '🌙 ' + t('dashboard.goodNight');
  if (h < 12) return '☀️ ' + t('dashboard.goodMorning');
  if (h < 18) return '🌤 ' + t('dashboard.goodAfternoon');
  return '🌙 ' + t('dashboard.goodEvening');
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { data, colors, syncCalendar, fontScaleMultiplier, isDark } = useAppContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const { width } = useWindowDimensions();
  const pulseValue = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeIn]);

  useEffect(() => {
    if (!data.settings.animationsEnabled) {
      pulseValue.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseValue, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [data.settings.animationsEnabled, pulseValue]);

  const nextEvent = useMemo(() => {
    const now = Date.now();
    return data.events.find((event) => new Date(event.start).getTime() >= now);
  }, [data.events]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return data.events
      .filter((event) => new Date(event.start).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
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
  const totalTasks = data.tasks.length;
  const completedPct = totalTasks > 0 ? Math.round(((totalTasks - openTasks) / totalTasks) * 100) : 0;
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

  const greeting = timeGreeting(t);
  const heroRadius = data.settings.cardStyle === 'soft' ? radii.xl + 4 : data.settings.cardStyle === 'glass' ? radii.xl : radii.lg;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      {/* ── Hero Card ─────────────────────────── */}
      <Animated.View
        style={{
          opacity: fadeIn,
          transform: [
            {
              scale: pulseValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.012],
              }),
            },
          ],
        }}
      >
        <LinearGradient
          colors={isDark ? [colors.accent, '#312E81'] : [colors.accent, '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.hero,
            shadows.lg,
            {
              borderRadius: heroRadius,
              padding: data.settings.compactMode ? spacing.md : spacing.lg,
            },
          ]}
        >
          <Text style={[styles.greeting, { fontSize: 14 * fontScaleMultiplier }]}>{greeting}</Text>
          <Text style={[styles.heroTitle, { fontSize: 26 * fontScaleMultiplier }]}>{t('dashboard.title')}</Text>
          <Text style={[styles.heroText, { fontSize: 14 * fontScaleMultiplier }]}>{t('dashboard.welcome')}</Text>

          <View style={styles.heroFooter}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{examCount}</Text>
              <Text style={styles.heroStatLabel}>{t('dashboard.upcomingExams')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{openTasks}</Text>
              <Text style={styles.heroStatLabel}>{t('dashboard.openTasks')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{averageGrade ? averageGrade.toFixed(1) : '-'}</Text>
              <Text style={styles.heroStatLabel}>{t('grades.averageSwiss')}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── Sync Bar ─────────────────────────── */}
      <Pressable
        onPress={onSync}
        style={({ pressed }) => [
          styles.syncButton,
          shadows.sm,
          {
            backgroundColor: colors.card,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <Ionicons name="sync-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 * fontScaleMultiplier }}>
          {isSyncing ? t('common.loading') : t('dashboard.syncNow')}
        </Text>
        {data.lastCalendarSync ? (
          <Text style={{ color: colors.subtle, fontSize: 11, marginLeft: 'auto' }}>
            {dayjs(data.lastCalendarSync).format('HH:mm')}
          </Text>
        ) : null}
      </Pressable>

      {/* ── Stats Grid ───────────────────────── */}
      <Animated.View style={[styles.statsRow, isTablet ? styles.statsRowTablet : undefined, { opacity: fadeIn }]}>
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
      </Animated.View>

      {/* ── Task Progress ────────────────────── */}
      {totalTasks > 0 ? (
        <View style={[styles.progressCard, shadows.sm, { backgroundColor: colors.card }]}>
          <View style={styles.progressHeader}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 * fontScaleMultiplier }}>
              {t('tasks.title')}
            </Text>
            <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 15 }}>
              {completedPct}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <View
              style={[styles.progressFill, { width: `${completedPct}%`, backgroundColor: colors.accent }]}
            />
          </View>
        </View>
      ) : null}

      {/* ── Upcoming Timeline ────────────────── */}
      {upcomingEvents.length > 0 ? (
        <View style={styles.timelineSection}>
          <Text style={[styles.sectionHeading, { color: colors.text, fontSize: 18 * fontScaleMultiplier }]}>
            {t('dashboard.nextEvent')}
          </Text>
          {upcomingEvents.map((event, idx) => (
            <View key={`${event.id}_${idx}`} style={styles.timelineRow}>
              <View style={styles.timelineDotCol}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: event.isExam ? '#EF4444' : colors.accent,
                      borderColor: colors.card,
                    },
                  ]}
                />
                {idx < upcomingEvents.length - 1 ? (
                  <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                ) : null}
              </View>
              <View style={[styles.timelineCard, shadows.sm, { backgroundColor: colors.card }]}>
                <View style={styles.timelineCardHeader}>
                  <Text
                    style={{ color: colors.text, fontWeight: '700', fontSize: 14 * fontScaleMultiplier, flex: 1 }}
                    numberOfLines={1}
                  >
                    {event.title}
                  </Text>
                  {event.isExam ? (
                    <View style={styles.examBadge}>
                      <Text style={styles.examBadgeText}>{t('calendar.exams')}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: colors.subtle, fontSize: 12 }}>
                  {dayjs(event.start).format('ddd, DD MMM • HH:mm')}
                  {event.subject ? ` • ${event.subject}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  hero: {
    padding: spacing.lg,
    marginBottom: 4,
  },
  greeting: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 2,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroText: {
    color: '#E0E7FF',
    marginTop: 4,
    fontWeight: '500',
  },
  heroFooter: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatVal: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
    textAlign: 'center',
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  syncButton: {
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  statsRowTablet: {
    gap: spacing.md,
  },
  progressCard: {
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timelineSection: {
    gap: 0,
  },
  sectionHeading: {
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: spacing.sm + 4,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineDotCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 2,
  },
  timelineCard: {
    flex: 1,
    marginLeft: spacing.sm,
    marginBottom: spacing.sm + 2,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    gap: 4,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  examBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  examBadgeText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
});
