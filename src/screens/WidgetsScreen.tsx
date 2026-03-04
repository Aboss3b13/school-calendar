import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { WidgetPreview } from 'react-native-android-widget';
import { useAppContext } from '../context/AppContext';
import { renderSchoolOverviewWidget } from '../widgets/SchoolOverviewWidget';
import { weightedSubjectAverage } from '../services/grades';
import { shadows, spacing, radii, gradeColor } from '../theme/theme';

export default function WidgetsScreen() {
  const { t } = useTranslation();
  const { data, colors, isDark, updateSettings, fontScaleMultiplier } = useAppContext();

  const nextExam = useMemo(() => {
    const now = Date.now();
    return data.events
      .filter((e) => e.entryType === 'exam' && new Date(e.start).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  }, [data.events]);

  const nextLessons = useMemo(() => {
    const now = Date.now();
    return data.events
      .filter((e) => e.entryType === 'lesson' && new Date(e.start).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 4);
  }, [data.events]);

  const openTasks = data.tasks.filter((t) => !t.completed).length;
  const avgResult = weightedSubjectAverage(data.grades, data.gradeSubjectWeights);
  const averageGrade = avgResult ? avgResult.rounded : null;

  const quickStats = [
    { icon: 'list-outline' as const, value: openTasks, label: t('dashboard.openTasks'), color: '#3B82F6' },
    { icon: 'school-outline' as const, value: data.grades.length, label: t('grades.results'), color: '#8B5CF6' },
    { icon: 'document-text-outline' as const, value: data.notes.length, label: t('dashboard.notesCount'), color: '#10B981' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Header ─────────────────────── */}
        <Text style={[styles.pageTitle, { color: colors.text, fontSize: 24 * fontScaleMultiplier }]}>
          {t('widgets.homeWidgets')}
        </Text>

        {/* ── Enable toggle ──────────────── */}
        <View style={[styles.card, shadows.md, { backgroundColor: colors.card }]}>
          <View style={styles.switchRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.accent} />
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{t('widgets.enableSync')}</Text>
            </View>
            <Switch
              value={data.settings.homescreenWidgets}
              onValueChange={(v) => updateSettings({ homescreenWidgets: v })}
              trackColor={{ true: colors.accent }}
            />
          </View>
          <Text style={{ color: colors.subtle, fontSize: 13, lineHeight: 19 }}>{t('widgets.hint')}</Text>
        </View>

        {/* ── Widget Preview ─────────────── */}
        <View style={[styles.card, shadows.sm, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Ionicons name="eye-outline" size={17} color={colors.accent} />
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Preview</Text>
          </View>
          <View style={styles.previewWrap}>
            <WidgetPreview
              width={320}
              height={160}
              renderWidget={() =>
                renderSchoolOverviewWidget({
                  title: 'SchoolFlow',
                  subtitle: nextExam
                    ? `${nextExam.title} · ${dayjs(nextExam.start).format('DD.MM HH:mm')}`
                    : t('widgets.noExam'),
                  openTasks,
                  averageGrade,
                  accent: colors.accent,
                })
              }
            />
          </View>
          <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 18 }}>{t('widgets.installSteps')}</Text>
        </View>

        {/* ── Next Lessons List ──────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.xs }}>
          <Ionicons name="book-outline" size={17} color={colors.accent} />
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 * fontScaleMultiplier }}>{t('dashboard.nextLessons')}</Text>
        </View>
        {nextLessons.length === 0 ? (
          <Text style={{ color: colors.subtle, fontSize: 13 }}>{t('widgets.noLessons')}</Text>
        ) : (
          nextLessons.map((lesson, idx) => (
            <View key={`wl_${lesson.id}_${idx}`} style={[styles.lessonCard, shadows.sm, { backgroundColor: colors.card }]}>
              <Ionicons name="book" size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{lesson.title}</Text>
                <Text style={{ color: colors.subtle, fontSize: 12 }}>
                  {dayjs(lesson.start).format('ddd, DD MMM · HH:mm')} – {dayjs(lesson.end).format('HH:mm')}
                  {lesson.subject ? ` · ${lesson.subject}` : ''}
                  {lesson.location ? ` · ${lesson.location}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* ── Quick Stat Tiles ───────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.xs }}>
          <Ionicons name="stats-chart-outline" size={17} color={colors.accent} />
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 * fontScaleMultiplier }}>{t('widgets.quickWidgets')}</Text>
        </View>

        <View style={styles.quickRow}>
          {quickStats.map((s) => (
            <View key={s.label} style={[styles.quickTile, shadows.sm, { backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: s.color }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 22, marginTop: 6 }}>{s.value}</Text>
              <Text style={{ color: colors.subtle, fontWeight: '600', fontSize: 11, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Grade average tile ─────────── */}
        {averageGrade ? (
          <View style={[styles.gradeAvgTile, shadows.sm, { backgroundColor: colors.card }]}>
            <Ionicons name="ribbon-outline" size={22} color={gradeColor(averageGrade)} />
            <View>
              <Text style={{ color: colors.subtle, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{t('grades.roundedAvg')}</Text>
              <Text style={{ color: gradeColor(averageGrade), fontWeight: '900', fontSize: 28 }}>{averageGrade.toFixed(2)}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  pageTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm + 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewWrap: {
    borderRadius: radii.md,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickTile: {
    flex: 1,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    minHeight: 100,
  },
  lessonCard: {
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gradeAvgTile: {
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
