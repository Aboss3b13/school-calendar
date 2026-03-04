import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { weightedSubjectAverage } from '../services/grades';
import { computeCountdown, CountdownParts } from '../services/notifications';
import { shadows, spacing, radii, gradeColor } from '../theme/theme';
import type { TabParamList } from '../../App';

type NavProp = BottomTabNavigationProp<TabParamList>;

function timeGreeting(t: (key: string) => string): string {
  const h = new Date().getHours();
  if (h < 6) return '🌙 ' + t('dashboard.goodNight');
  if (h < 12) return '☀️ ' + t('dashboard.goodMorning');
  if (h < 18) return '🌤 ' + t('dashboard.goodAfternoon');
  return '🌙 ' + t('dashboard.goodEvening');
}

/* ── Countdown digit component ────────────────────────────────── */
function CountdownUnit({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={cdStyles.unit}>
      <View style={[cdStyles.digitBox, { backgroundColor: `${color}18` }]}>
        <Text style={[cdStyles.digit, { color }]}>{String(value).padStart(2, '0')}</Text>
      </View>
      <Text style={cdStyles.unitLabel}>{label}</Text>
    </View>
  );
}

const cdStyles = StyleSheet.create({
  unit: { alignItems: 'center', gap: 4 },
  digitBox: { borderRadius: radii.sm + 2, paddingHorizontal: 10, paddingVertical: 6, minWidth: 44, alignItems: 'center' },
  digit: { fontWeight: '900', fontSize: 20, fontVariant: ['tabular-nums'] },
  unitLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});

/* ── Main Screen ──────────────────────────────────────────────── */

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { data, colors, syncCalendar, fontScaleMultiplier, isDark } = useAppContext();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [isSyncing, setIsSyncing] = useState(false);
  const { width } = useWindowDimensions();
  const pulseValue = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  // Live countdown state
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);

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

  const nextExam = useMemo(() => {
    const now = Date.now();
    return data.events
      .filter((e) => e.entryType === 'exam' && new Date(e.start).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] ?? null;
  }, [data.events]);

  // Live countdown tick every second
  useEffect(() => {
    if (!nextExam) {
      setCountdown(null);
      return;
    }

    const tick = () => setCountdown(computeCountdown(nextExam.start));
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [nextExam]);

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

  const nextLessons = useMemo(() => {
    const now = Date.now();
    return data.events
      .filter((event) => event.entryType === 'lesson' && new Date(event.start).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 6);
  }, [data.events]);

  const todayLessonCount = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return data.events.filter(
      (event) => event.entryType === 'lesson' && dayjs(event.start).format('YYYY-MM-DD') === today,
    ).length;
  }, [data.events]);

  const highPriorityTasks = useMemo(() => {
    return data.tasks.filter((task) => !task.completed && task.priority === 'high').length;
  }, [data.tasks]);

  const openTasks = data.tasks.filter((task) => !task.completed).length;
  const totalTasks = data.tasks.length;
  const completedPct = totalTasks > 0 ? Math.round(((totalTasks - openTasks) / totalTasks) * 100) : 0;
  const isTablet = width >= 860;

  const averageGrade = useMemo(() => {
    const result = weightedSubjectAverage(data.grades, data.gradeSubjectWeights);
    return result ? result.rounded : null;
  }, [data.grades, data.gradeSubjectWeights]);

  const onSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncCalendar();
    } finally {
      setIsSyncing(false);
    }
  }, [syncCalendar]);

  const greeting = timeGreeting(t);
  const heroRadius = data.settings.cardStyle === 'soft' ? radii.xl + 4 : data.settings.cardStyle === 'glass' ? radii.xl : radii.lg;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
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
            <Pressable style={styles.heroStat} onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.heroStatVal}>{examCount}</Text>
              <Text style={styles.heroStatLabel}>{t('dashboard.upcomingExams')}</Text>
            </Pressable>
            <View style={styles.heroStatDivider} />
            <Pressable style={styles.heroStat} onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.heroStatVal}>{openTasks}</Text>
              <Text style={styles.heroStatLabel}>{t('dashboard.openTasks')}</Text>
            </Pressable>
            <View style={styles.heroStatDivider} />
            <Pressable style={styles.heroStat} onPress={() => navigation.navigate('Grades')}>
              <Text style={styles.heroStatVal}>{averageGrade ? averageGrade.toFixed(1) : '-'}</Text>
              <Text style={styles.heroStatLabel}>{t('grades.averageSwiss')}</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── Exam Countdown ────────────────────── */}
      {nextExam && countdown && !countdown.isPast ? (
        <Pressable onPress={() => navigation.navigate('Calendar')}>
          <LinearGradient
            colors={isDark ? ['#991B1B', '#7F1D1D'] : ['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.countdownCard, shadows.md, { borderRadius: heroRadius }]}
          >
            <View style={styles.countdownHeader}>
              <Ionicons name="alarm-outline" size={20} color="#fff" />
              <Text style={styles.countdownTitle} numberOfLines={1}>
                {t('dashboard.examCountdown')}
              </Text>
            </View>
            <Text style={styles.countdownExamName} numberOfLines={1}>
              {nextExam.title}{nextExam.subject ? ` · ${nextExam.subject}` : ''}
            </Text>
            <Text style={styles.countdownDate}>
              {dayjs(nextExam.start).format('dddd, DD MMMM · HH:mm')}
            </Text>
            <View style={styles.countdownRow}>
              {countdown.months > 0 && (
                <CountdownUnit value={countdown.months} label={t('countdown.months')} color="#fff" />
              )}
              <CountdownUnit value={countdown.days} label={t('countdown.days')} color="#fff" />
              <CountdownUnit value={countdown.hours} label={t('countdown.hours')} color="#fff" />
              <CountdownUnit value={countdown.minutes} label={t('countdown.min')} color="#fff" />
              <CountdownUnit value={countdown.seconds} label={t('countdown.sec')} color="#fff" />
            </View>
            <View style={styles.studyHint}>
              <Ionicons name="book-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.studyHintText}>{t('dashboard.studyReminder')}</Text>
            </View>
          </LinearGradient>
        </Pressable>
      ) : null}

      {/* ── Sync Bar ─────────────────────────── */}
      <Pressable
        onPress={onSync}
        style={({ pressed }) => [
          styles.syncButton,
          shadows.sm,
          {
            backgroundColor: colors.card,
            borderRadius: radii.md,
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
        <Pressable style={styles.statFlex} onPress={() => navigation.navigate('Calendar')}>
          <View style={[styles.statCard, shadows.sm, { backgroundColor: colors.card }]}>
            <View style={[styles.statAccent, { backgroundColor: '#EF4444' }]} />
            <View style={styles.statInner}>
              <Text style={[styles.statValue, { color: colors.text }]}>{examCount}</Text>
              <Text style={[styles.statLabel, { color: colors.subtle }]}>{t('dashboard.upcomingExams')}</Text>
            </View>
          </View>
        </Pressable>
        <Pressable style={styles.statFlex} onPress={() => navigation.navigate('Tasks')}>
          <View style={[styles.statCard, shadows.sm, { backgroundColor: colors.card }]}>
            <View style={[styles.statAccent, { backgroundColor: colors.accent }]} />
            <View style={styles.statInner}>
              <Text style={[styles.statValue, { color: colors.text }]}>{openTasks}</Text>
              <Text style={[styles.statLabel, { color: colors.subtle }]}>{t('dashboard.openTasks')}</Text>
            </View>
          </View>
        </Pressable>
        <Pressable style={styles.statFlex} onPress={() => navigation.navigate('Notes')}>
          <View style={[styles.statCard, shadows.sm, { backgroundColor: colors.card }]}>
            <View style={[styles.statAccent, { backgroundColor: '#10B981' }]} />
            <View style={styles.statInner}>
              <Text style={[styles.statValue, { color: colors.text }]}>{data.notes.length}</Text>
              <Text style={[styles.statLabel, { color: colors.subtle }]}>{t('dashboard.notesCount')}</Text>
            </View>
          </View>
        </Pressable>
        <Pressable style={styles.statFlex} onPress={() => navigation.navigate('Calendar')}>
          <View style={[styles.statCard, shadows.sm, { backgroundColor: colors.card }]}>
            <View style={[styles.statAccent, { backgroundColor: '#8B5CF6' }]} />
            <View style={styles.statInner}>
              <Text style={[styles.statValue, { color: colors.text }]}>{lessonCount}</Text>
              <Text style={[styles.statLabel, { color: colors.subtle }]}>{t('calendar.lessons')}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* ── Task Progress ────────────────────── */}
      {totalTasks > 0 ? (
        <Pressable onPress={() => navigation.navigate('Tasks')}>
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
        </Pressable>
      ) : null}

      {/* ── Quick Insights ───────────────────── */}
      <View style={[styles.insightCard, shadows.sm, { backgroundColor: colors.card }]}>
        <Pressable style={styles.insightRow} onPress={() => navigation.navigate('Calendar')}>
          <Ionicons name="today-outline" size={18} color={colors.accent} />
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 * fontScaleMultiplier, flex: 1 }}>
            {t('dashboard.todayLessons')}: {todayLessonCount}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
        </Pressable>
        {highPriorityTasks > 0 ? (
          <Pressable style={styles.insightRow} onPress={() => navigation.navigate('Tasks')}>
            <Ionicons name="warning-outline" size={18} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 * fontScaleMultiplier, flex: 1 }}>
              {highPriorityTasks} {t('dashboard.urgentTasks')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
          </Pressable>
        ) : null}
        {averageGrade ? (
          <Pressable style={styles.insightRow} onPress={() => navigation.navigate('Grades')}>
            <Ionicons name="trending-up-outline" size={18} color={gradeColor(averageGrade)} />
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 * fontScaleMultiplier, flex: 1 }}>
              {t('grades.roundedAvg')}: <Text style={{ color: gradeColor(averageGrade) }}>{averageGrade.toFixed(1)}</Text>
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
          </Pressable>
        ) : null}
      </View>

      {/* ── Next Lessons ────────────────────── */}
      {nextLessons.length > 0 ? (
        <View style={styles.timelineSection}>
          <Pressable
            style={styles.sectionHeaderRow}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={[styles.sectionHeading, { color: colors.text, fontSize: 18 * fontScaleMultiplier }]}>
              {t('dashboard.nextLessons')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
          </Pressable>
          {nextLessons.map((lesson, idx) => (
            <View key={`lesson_${lesson.id}_${idx}`} style={styles.timelineRow}>
              <View style={styles.timelineDotCol}>
                <View style={[styles.timelineDot, { backgroundColor: colors.accent, borderColor: colors.card }]} />
                {idx < nextLessons.length - 1 ? (
                  <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                ) : null}
              </View>
              <View style={[styles.timelineCard, shadows.sm, { backgroundColor: colors.card }]}>
                <View style={styles.timelineCardHeader}>
                  <Ionicons name="book" size={14} color={colors.accent} />
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 * fontScaleMultiplier, flex: 1 }} numberOfLines={1}>
                    {lesson.title}
                  </Text>
                </View>
                <Text style={{ color: colors.subtle, fontSize: 12 }}>
                  {dayjs(lesson.start).format('ddd, DD MMM • HH:mm')} – {dayjs(lesson.end).format('HH:mm')}
                  {lesson.subject ? ` • ${lesson.subject}` : ''}
                  {lesson.location ? ` • ${lesson.location}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Upcoming Events ──────────────────── */}
      {upcomingEvents.length > 0 ? (
        <View style={styles.timelineSection}>
          <Pressable
            style={styles.sectionHeaderRow}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={[styles.sectionHeading, { color: colors.text, fontSize: 18 * fontScaleMultiplier }]}>
              {t('dashboard.nextEvent')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
          </Pressable>
          {upcomingEvents.map((event, idx) => (
            <Pressable key={`${event.id}_${idx}`} onPress={() => navigation.navigate('Calendar')}>
              <View style={styles.timelineRow}>
                <View style={styles.timelineDotCol}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: event.isExam ? '#EF4444' : event.entryType === 'event' ? '#F59E0B' : colors.accent,
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
                    <Ionicons
                      name={event.isExam ? 'alert-circle' : event.entryType === 'lesson' ? 'book' : 'calendar'}
                      size={14}
                      color={event.isExam ? '#EF4444' : event.entryType === 'event' ? '#F59E0B' : colors.accent}
                    />
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
                    ) : event.entryType === 'event' ? (
                      <View style={[styles.examBadge, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.examBadgeText, { color: '#D97706' }]}>{t('calendar.events')}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.subtle, fontSize: 12 }}>
                    {dayjs(event.start).format('ddd, DD MMM • HH:mm')}
                    {event.subject ? ` • ${event.subject}` : ''}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
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

  /* ── Countdown ────────────── */
  countdownCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  countdownExamName: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: 14,
  },
  countdownDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm + 4,
    marginTop: spacing.xs,
  },
  studyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  studyHintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },

  /* ── Sync ─────────────────── */
  syncButton: {
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* ── Stats ────────────────── */
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  statsRowTablet: {
    gap: spacing.md,
  },
  statFlex: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 130,
  },
  statCard: {
    borderRadius: radii.md,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 80,
  },
  statAccent: {
    width: 4,
  },
  statInner: {
    flex: 1,
    padding: spacing.sm + 4,
    justifyContent: 'space-between',
  },
  statValue: {
    fontWeight: '900',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  /* ── Progress ─────────────── */
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

  /* ── Insight ──────────────── */
  insightCard: {
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm + 2,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  /* ── Timeline ─────────────── */
  timelineSection: {
    gap: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 4,
  },
  sectionHeading: {
    fontWeight: '900',
    letterSpacing: -0.3,
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
