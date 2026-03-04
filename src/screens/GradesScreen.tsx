import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import InfoWidget from '../components/InfoWidget';
import {
  computeGrade,
  pointsPercent,
  roundToHalf,
  subjectAverages,
  toSubjectKey,
  weightedAverage,
  weightedSubjectAverage,
} from '../services/grades';
import { GradeItem } from '../types/models';
import { gradeColor, shadows, spacing, radii } from '../theme/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function GradesScreen() {
  const { t } = useTranslation();
  const { data, colors, isDark, addGrade, removeGrade, setGradeSubjectWeight, fontScaleMultiplier } = useAppContext();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('Exam');
  const [subject, setSubject] = useState('MAT');
  const [points, setPoints] = useState('42');
  const [maxPoints, setMaxPoints] = useState('60');
  const [weight, setWeight] = useState('1');
  const [note, setNote] = useState('');
  const [targetGrade, setTargetGrade] = useState('5.0');
  const [formOpen, setFormOpen] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const borderCol = isDark ? '#334155' : '#E2E8F0';

  function animate() {
    if (data.settings.animationsEnabled)
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  const currentGradePreview = useMemo(() => {
    const p = Number(points) || 0;
    const m = Number(maxPoints) || 1;
    return clamp(computeGrade(p, m), 1, 6);
  }, [points, maxPoints]);

  /* ── Summary data  ──────────────────────── */
  const overallAvg = useMemo(
    () => weightedSubjectAverage(data.grades, data.gradeSubjectWeights),
    [data.grades, data.gradeSubjectWeights],
  );

  const subjectRows = useMemo(() => subjectAverages(data.grades), [data.grades]);
  const overallPointsPct = useMemo(() => pointsPercent(data.grades), [data.grades]);
  const simpleAvg = useMemo(() => weightedAverage(data.grades), [data.grades]);

  const requiredPoints = useMemo(() => {
    const tgt = clamp(Number(targetGrade) || 1, 1, 6);
    const mx = Math.max(1, Number(maxPoints) || 1);
    return clamp(((tgt - 1) / 5) * mx, 0, mx);
  }, [targetGrade, maxPoints]);

  const knownSubjects = useMemo(() => {
    return Array.from(new Set(data.grades.map((g) => toSubjectKey(g.subject)))).sort();
  }, [data.grades]);

  const gradesBySubject = useMemo(() => {
    const map = new Map<string, GradeItem[]>();
    data.grades.forEach((g) => {
      const key = toSubjectKey(g.subject);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    });
    map.forEach((list) => list.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()));
    return map;
  }, [data.grades]);

  function onSaveGrade() {
    const p = Number(points);
    const m = Number(maxPoints);
    const w = Number(weight);
    if (!title.trim() || !subject.trim() || Number.isNaN(p) || Number.isNaN(m)) return;
    addGrade({
      title: title.trim(),
      subject: subject.trim().toUpperCase(),
      points: p,
      maxPoints: Math.max(1, m),
      weight: Number.isNaN(w) ? 1 : Math.max(0.25, w),
      note: note.trim() || undefined,
    });
    setNote('');
    setPoints('');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}>
        {/* ── Header ─────────────────────── */}
        <View style={styles.screenHeader}>
          <Text style={[styles.pageTitle, { color: colors.text, fontSize: 24 * fontScaleMultiplier }]}>{t('grades.title')}</Text>
          <Pressable
            onPress={() => { animate(); setFormOpen((v) => !v); }}
            style={({ pressed }) => [styles.fabBtn, { backgroundColor: colors.accent, opacity: pressed ? 0.88 : 1 }]}
          >
            <Ionicons name={formOpen ? 'chevron-up' : 'add'} size={22} color="#fff" />
          </Pressable>
        </View>

        {/* ── Top Summary Widgets ────────── */}
        <View style={styles.widgetsRow}>
          <InfoWidget
            title={t('grades.roundedAvg')}
            value={overallAvg ? overallAvg.rounded.toFixed(2) : '-'}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
          <InfoWidget
            title={t('grades.unroundedAvg')}
            value={overallAvg ? overallAvg.unrounded.toFixed(2) : '-'}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
        </View>
        <View style={styles.widgetsRow}>
          <InfoWidget
            title={t('grades.pointsRate')}
            value={overallPointsPct ? `${overallPointsPct.toFixed(1)}%` : '-'}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
          <InfoWidget
            title={t('grades.results')}
            value={data.grades.length}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
        </View>

        {/* ── Collapsible Add Form ───────── */}
        {formOpen && (
          <View style={[styles.formCard, shadows.md, { backgroundColor: colors.card }]}>
            <Text style={[styles.formHeading, { color: colors.text }]}>{t('grades.addResult')}</Text>

            <View style={styles.row}>
              <TextInput value={title} onChangeText={setTitle} placeholder={t('grades.examTitle')} placeholderTextColor={colors.subtle} style={[styles.input, styles.flex1, { borderColor: borderCol, color: colors.text }]} />
              <TextInput value={subject} onChangeText={setSubject} placeholder={t('grades.subject')} placeholderTextColor={colors.subtle} style={[styles.input, styles.flex1, { borderColor: borderCol, color: colors.text }]} />
            </View>

            <View style={styles.row}>
              <TextInput value={points} onChangeText={setPoints} placeholder={t('grades.points')} keyboardType="numeric" placeholderTextColor={colors.subtle} style={[styles.input, styles.flex1, { borderColor: borderCol, color: colors.text }]} />
              <TextInput value={maxPoints} onChangeText={setMaxPoints} placeholder={t('grades.maxPoints')} keyboardType="numeric" placeholderTextColor={colors.subtle} style={[styles.input, styles.flex1, { borderColor: borderCol, color: colors.text }]} />
              <TextInput value={weight} onChangeText={setWeight} placeholder={t('grades.weight')} keyboardType="numeric" placeholderTextColor={colors.subtle} style={[styles.input, styles.flex1, { borderColor: borderCol, color: colors.text }]} />
            </View>

            <TextInput value={note} onChangeText={setNote} placeholder={t('grades.note')} placeholderTextColor={colors.subtle} multiline style={[styles.input, { borderColor: borderCol, color: colors.text }]} />

            {/* Preview badge */}
            <View style={[styles.previewBadge, shadows.sm, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
              <View>
                <Text style={{ color: colors.subtle, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>{t('grades.previewSwiss')}</Text>
                <Text style={{ color: colors.subtle, fontSize: 11 }}>
                  {t('grades.roundedLabel')}: {roundToHalf(currentGradePreview).toFixed(1)}
                </Text>
              </View>
              <Text style={{ color: gradeColor(currentGradePreview), fontWeight: '900', fontSize: 24 }}>{currentGradePreview.toFixed(2)}</Text>
            </View>

            <Pressable
              onPress={onSaveGrade}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.accent, opacity: pressed ? 0.88 : 1 }]}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 6 }}>{t('grades.saveResult')}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Target Calculator ──────────── */}
        <View style={[styles.formCard, shadows.sm, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calculator-outline" size={18} color={colors.accent} />
            <Text style={[styles.formHeading, { color: colors.text }]}>{t('grades.targetCalculator')}</Text>
          </View>
          <View style={styles.row}>
            <TextInput value={targetGrade} onChangeText={setTargetGrade} placeholder={t('grades.targetGrade')} keyboardType="numeric" placeholderTextColor={colors.subtle} style={[styles.input, styles.flex1, { borderColor: borderCol, color: colors.text }]} />
            <TextInput value={maxPoints} onChangeText={setMaxPoints} placeholder={t('grades.maxPoints')} keyboardType="numeric" placeholderTextColor={colors.subtle} style={[styles.input, styles.flex1, { borderColor: borderCol, color: colors.text }]} />
          </View>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
            {t('grades.needPoints')}: <Text style={{ color: colors.accent }}>{requiredPoints.toFixed(2)}</Text> / {Math.max(1, Number(maxPoints) || 1)}
          </Text>
        </View>

        {/* ── Subjects with expandable grades ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18 * fontScaleMultiplier }]}>{t('grades.subjectOverview')}</Text>
          {subjectRows.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={28} color={colors.subtle} />
              <Text style={{ color: colors.subtle, marginTop: 6, fontWeight: '600' }}>{t('grades.noResults')}</Text>
            </View>
          ) : (
            subjectRows.map((row) => {
              const cw = data.gradeSubjectWeights[row.subject] ?? 1;
              const isExpanded = expandedSubject === row.subject;
              const entries = gradesBySubject.get(row.subject) ?? [];
              return (
                <View key={row.subject}>
                  <Pressable
                    onPress={() => { animate(); setExpandedSubject(isExpanded ? null : row.subject); }}
                    style={({ pressed }) => [
                      styles.subjectCard,
                      shadows.sm,
                      {
                        backgroundColor: colors.card,
                        borderLeftColor: gradeColor(row.average),
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>{row.subject}</Text>
                      <View style={[styles.metaRow, { marginTop: 3 }]}>
                        <Text style={{ color: colors.subtle, fontSize: 12 }}>
                          {t('grades.avg')}: {row.average.toFixed(2)}
                        </Text>
                        <View style={styles.dotSep} />
                        <Text style={{ color: gradeColor(row.roundedAverage), fontSize: 12, fontWeight: '700' }}>
                          ≈ {row.roundedAverage.toFixed(1)}
                        </Text>
                        <View style={styles.dotSep} />
                        <Text style={{ color: colors.subtle, fontSize: 12 }}>n={row.entries}</Text>
                      </View>
                    </View>
                    {/* progress bar */}
                    <View style={[styles.miniBar, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                      <View style={{ width: `${clamp((row.average / 6) * 100, 0, 100)}%`, height: '100%', borderRadius: 3, backgroundColor: gradeColor(row.average) }} />
                    </View>
                    {/* subject weight control */}
                    <View style={styles.weightControl}>
                      <Pressable onPress={(e) => { e.stopPropagation?.(); animate(); setGradeSubjectWeight(row.subject, Math.max(0.1, cw - 0.25)); }} style={[styles.weightBtn, { borderColor: borderCol }]}>
                        <Ionicons name="remove" size={14} color={colors.text} />
                      </Pressable>
                      <Text style={{ color: colors.text, minWidth: 28, textAlign: 'center', fontWeight: '700', fontSize: 12 }}>{cw.toFixed(1)}</Text>
                      <Pressable onPress={(e) => { e.stopPropagation?.(); animate(); setGradeSubjectWeight(row.subject, cw + 0.25); }} style={[styles.weightBtn, { borderColor: borderCol }]}>
                        <Ionicons name="add" size={14} color={colors.text} />
                      </Pressable>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.subtle} />
                  </Pressable>

                  {/* Expanded grade entries */}
                  {isExpanded && (
                    <View style={styles.expandedGrades}>
                      {entries.map((entry) => (
                        <View
                          key={entry.id}
                          style={[styles.gradeEntry, shadows.sm, { backgroundColor: colors.card, borderLeftColor: gradeColor(entry.grade) }]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{entry.title}</Text>
                            <View style={[styles.metaRow, { marginTop: 2 }]}>
                              <Text style={{ color: colors.subtle, fontSize: 11 }}>{entry.points}/{entry.maxPoints}</Text>
                              <View style={styles.dotSep} />
                              <Text style={{ color: colors.subtle, fontSize: 11 }}>w:{entry.weight}</Text>
                              <View style={styles.dotSep} />
                              <Text style={{ color: colors.subtle, fontSize: 11 }}>{dayjs(entry.date).format('DD.MM.YY')}</Text>
                            </View>
                            {entry.note ? <Text style={{ color: colors.subtle, fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>{entry.note}</Text> : null}
                          </View>
                          <Text style={{ color: gradeColor(entry.grade), fontWeight: '900', fontSize: 18 }}>{entry.grade.toFixed(2)}</Text>
                          <Pressable onPress={() => { animate(); removeGrade(entry.id); }} style={({ pressed }) => [styles.deleteCircle, { opacity: pressed ? 0.6 : 1 }]}>
                            <Ionicons name="trash-outline" size={15} color="#EF4444" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  fabBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...((shadows.md) as any),
  },
  widgetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formCard: {
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm + 2,
  },
  formHeading: {
    fontWeight: '900',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex1: { flex: 1 },
  input: {
    borderWidth: 1.5,
    borderRadius: radii.sm + 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  previewBadge: {
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryBtn: {
    borderRadius: radii.sm + 4,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  subjectCard: {
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderLeftWidth: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94A3B8',
  },
  miniBar: {
    width: 40,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  weightControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  weightBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedGrades: {
    paddingLeft: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  gradeEntry: {
    borderRadius: radii.sm + 4,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderLeftWidth: 3,
  },
  deleteCircle: {
    padding: 5,
  },
});
