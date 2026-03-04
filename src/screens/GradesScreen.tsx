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
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import InfoWidget from '../components/InfoWidget';
import {
  computeGrade,
  pointsPercent,
  subjectAverages,
  toSubjectKey,
  weightedAverage,
  weightedSubjectAverage,
} from '../services/grades';
import { GradeItem, GradeTrack } from '../types/models';
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

  const [title, setTitle] = useState('Exam');
  const [subject, setSubject] = useState('MAT');
  const [points, setPoints] = useState('42');
  const [maxPoints, setMaxPoints] = useState('60');
  const [weight, setWeight] = useState('1');
  const [note, setNote] = useState('');
  const [targetGrade, setTargetGrade] = useState('5.0');
  const [track, setTrack] = useState<GradeTrack>('official');
  const [formOpen, setFormOpen] = useState(false);

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

  const officialGrades = useMemo(() => data.grades.filter((e) => e.track === 'official'), [data.grades]);
  const playgroundGrades = useMemo(() => data.grades.filter((e) => e.track === 'playground'), [data.grades]);

  const officialWeighted = useMemo(() => weightedAverage(officialGrades), [officialGrades]);
  const officialSubjectWeighted = useMemo(
    () => weightedSubjectAverage(officialGrades, data.gradeSubjectWeights),
    [officialGrades, data.gradeSubjectWeights],
  );
  const officialPointsRate = useMemo(() => pointsPercent(officialGrades), [officialGrades]);

  const playgroundWeighted = useMemo(() => weightedAverage(playgroundGrades), [playgroundGrades]);
  const playgroundSubjectWeighted = useMemo(
    () => weightedSubjectAverage(playgroundGrades, data.gradeSubjectWeights),
    [playgroundGrades, data.gradeSubjectWeights],
  );
  const playgroundPointsRate = useMemo(() => pointsPercent(playgroundGrades), [playgroundGrades]);

  const allSubjectsWeighted = useMemo(
    () => weightedSubjectAverage(data.grades, data.gradeSubjectWeights),
    [data.grades, data.gradeSubjectWeights],
  );

  const officialSubjectRows = useMemo(() => subjectAverages(officialGrades), [officialGrades]);
  const playgroundSubjectRows = useMemo(() => subjectAverages(playgroundGrades), [playgroundGrades]);

  const requiredPoints = useMemo(() => {
    const tgt = clamp(Number(targetGrade) || 1, 1, 6);
    const mx = Math.max(1, Number(maxPoints) || 1);
    return clamp(((tgt - 1) / 5) * mx, 0, mx);
  }, [targetGrade, maxPoints]);

  const knownSubjects = useMemo(() => {
    return Array.from(new Set(data.grades.map((g) => toSubjectKey(g.subject)))).sort();
  }, [data.grades]);

  function onSaveGrade() {
    const p = Number(points);
    const m = Number(maxPoints);
    const w = Number(weight);
    if (!title.trim() || !subject.trim() || Number.isNaN(p) || Number.isNaN(m)) return;
    addGrade({
      title: title.trim(),
      subject: subject.trim().toUpperCase(),
      track,
      points: p,
      maxPoints: Math.max(1, m),
      weight: Number.isNaN(w) ? 1 : Math.max(0.25, w),
      note: note.trim() || undefined,
    });
    setNote('');
    setPoints('');
  }

  /* ── Chip ────────────────────────────────── */
  function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.chip,
          { backgroundColor: active ? `${colors.accent}18` : 'transparent', borderColor: active ? colors.accent : borderCol },
        ]}
      >
        <Text style={{ color: active ? colors.accent : colors.text, fontWeight: active ? '800' : '600', fontSize: 13 }}>{label}</Text>
      </Pressable>
    );
  }

  /* ── Grade result card ───────────────────── */
  function renderResultRows(titleKey: string, entries: GradeItem[]) {
    const sorted = [...entries].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    return (
      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 17 * fontScaleMultiplier }]}>{t(titleKey)}</Text>
        {sorted.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={28} color={colors.subtle} />
            <Text style={{ color: colors.subtle, marginTop: 6, fontWeight: '600' }}>{t('grades.noResults')}</Text>
          </View>
        ) : (
          sorted.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.resultCard,
                shadows.sm,
                { backgroundColor: colors.card, borderLeftColor: gradeColor(entry.grade) },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{entry.subject} · {entry.title}</Text>
                <View style={[styles.metaRow, { marginTop: 3 }]}>
                  <Text style={{ color: colors.subtle, fontSize: 12 }}>{entry.points}/{entry.maxPoints}</Text>
                  <View style={styles.dotSep} />
                  <Text style={{ color: colors.subtle, fontSize: 12 }}>w:{entry.weight}</Text>
                  <View style={styles.dotSep} />
                  <Text style={{ color: colors.subtle, fontSize: 12 }}>{dayjs(entry.date).format('DD.MM.YY')}</Text>
                </View>
              </View>
              <Text style={{ color: gradeColor(entry.grade), fontWeight: '900', fontSize: 20 }}>{entry.grade.toFixed(2)}</Text>
              <Pressable onPress={() => { animate(); removeGrade(entry.id); }} style={({ pressed }) => [styles.deleteCircle, { opacity: pressed ? 0.6 : 1 }]}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </Pressable>
            </View>
          ))
        )}
      </View>
    );
  }

  /* ── Subject row ─────────────────────────── */
  function renderSubjectRows(rows: ReturnType<typeof subjectAverages>) {
    if (rows.length === 0) return <Text style={{ color: colors.subtle, fontSize: 13 }}>{t('grades.noResults')}</Text>;
    return (
      <View style={{ gap: spacing.sm }}>
        {rows.map((row) => {
          const cw = data.gradeSubjectWeights[row.subject] ?? 1;
          return (
            <View key={row.subject} style={[styles.subjectRow, shadows.sm, { backgroundColor: colors.card }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{row.subject}</Text>
                <Text style={{ color: colors.subtle, fontSize: 12 }}>{t('grades.avg')}: {row.average.toFixed(2)} · n={row.entries}</Text>
              </View>
              {/* progress bar */}
              <View style={[styles.miniBar, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                <View style={{ width: `${clamp((row.average / 6) * 100, 0, 100)}%`, height: '100%', borderRadius: 3, backgroundColor: gradeColor(row.average) }} />
              </View>
              <View style={styles.weightControl}>
                <Pressable onPress={() => { animate(); setGradeSubjectWeight(row.subject, Math.max(0.1, cw - 0.25)); }} style={[styles.weightBtn, { borderColor: borderCol }]}>
                  <Ionicons name="remove" size={14} color={colors.text} />
                </Pressable>
                <Text style={{ color: colors.text, minWidth: 36, textAlign: 'center', fontWeight: '700', fontSize: 13 }}>{cw.toFixed(2)}</Text>
                <Pressable onPress={() => { animate(); setGradeSubjectWeight(row.subject, cw + 0.25); }} style={[styles.weightBtn, { borderColor: borderCol }]}>
                  <Ionicons name="add" size={14} color={colors.text} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  /* ── Track summary card ──────────────────── */
  function TrackSummary({ label, avg, subjectAvg, pts, subjectRows: sRows }: { label: string; avg: number | null; subjectAvg: number | null; pts: number | null; subjectRows: ReturnType<typeof subjectAverages> }) {
    return (
      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 17 * fontScaleMultiplier }]}>{label}</Text>
        <View style={styles.widgetsRow}>
          <InfoWidget
            title={t('grades.averageSwiss')}
            value={avg ? avg.toFixed(2) : '-'}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
          <InfoWidget
            title={t('grades.allSubjectsWeighted')}
            value={subjectAvg ? subjectAvg.toFixed(2) : '-'}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
        </View>
        <Text style={{ color: colors.subtle, fontSize: 13, marginLeft: 2 }}>
          {t('grades.pointsRate')}: {pts ? `${pts.toFixed(1)}%` : '-'}
        </Text>
        {renderSubjectRows(sRows)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
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

        {/* ── Top widgets ────────────────── */}
        <View style={styles.widgetsRow}>
          <InfoWidget
            title={t('grades.allSubjectsWeighted')}
            value={allSubjectsWeighted ? allSubjectsWeighted.toFixed(2) : '-'}
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

            <View style={styles.segmentRow}>
              <Chip label={t('grades.official')} active={track === 'official'} onPress={() => setTrack('official')} />
              <Chip label={t('grades.playground')} active={track === 'playground'} onPress={() => setTrack('playground')} />
            </View>

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

        {/* ── Subject Weights ────────────── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 17 * fontScaleMultiplier }]}>{t('grades.subjectWeights')}</Text>
          <Text style={{ color: colors.subtle, fontSize: 13 }}>{t('grades.subjectWeightHint')}</Text>

          {knownSubjects.length === 0 ? (
            <Text style={{ color: colors.subtle, fontSize: 13 }}>{t('grades.noResults')}</Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {knownSubjects.map((subjectCode) => {
                const cw = data.gradeSubjectWeights[subjectCode] ?? 1;
                return (
                  <View key={subjectCode} style={[styles.subjectRow, shadows.sm, { backgroundColor: colors.card }]}>
                    <Text style={{ color: colors.text, fontWeight: '800', flex: 1, fontSize: 14 }}>{subjectCode}</Text>
                    <View style={styles.weightControl}>
                      <Pressable onPress={() => { animate(); setGradeSubjectWeight(subjectCode, Math.max(0.1, cw - 0.25)); }} style={[styles.weightBtn, { borderColor: borderCol }]}>
                        <Ionicons name="remove" size={14} color={colors.text} />
                      </Pressable>
                      <Text style={{ color: colors.text, minWidth: 36, textAlign: 'center', fontWeight: '700', fontSize: 13 }}>{cw.toFixed(2)}</Text>
                      <Pressable onPress={() => { animate(); setGradeSubjectWeight(subjectCode, cw + 0.25); }} style={[styles.weightBtn, { borderColor: borderCol }]}>
                        <Ionicons name="add" size={14} color={colors.text} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Official / Playground summaries ─ */}
        <TrackSummary label={t('grades.official')} avg={officialWeighted} subjectAvg={officialSubjectWeighted} pts={officialPointsRate} subjectRows={officialSubjectRows} />
        <TrackSummary label={t('grades.playground')} avg={playgroundWeighted} subjectAvg={playgroundSubjectWeighted} pts={playgroundPointsRate} subjectRows={playgroundSubjectRows} />

        {/* ── Result lists ────────────────── */}
        {renderResultRows('grades.officialResults', officialGrades)}
        {renderResultRows('grades.playgroundResults', playgroundGrades)}
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
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  resultCard: {
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderLeftWidth: 4,
    marginBottom: spacing.xs,
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
  deleteCircle: {
    padding: 6,
  },
  subjectRow: {
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniBar: {
    width: 48,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  weightControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weightBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
