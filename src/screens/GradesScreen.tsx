import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

function clamp(number: number, min: number, max: number) {
  return Math.min(max, Math.max(min, number));
}

export default function GradesScreen() {
  const { t } = useTranslation();
  const { data, colors, addGrade, removeGrade, setGradeSubjectWeight, fontScaleMultiplier } = useAppContext();

  const [title, setTitle] = useState('Exam');
  const [subject, setSubject] = useState('MAT');
  const [points, setPoints] = useState('42');
  const [maxPoints, setMaxPoints] = useState('60');
  const [weight, setWeight] = useState('1');
  const [note, setNote] = useState('');
  const [targetGrade, setTargetGrade] = useState('5.0');
  const [track, setTrack] = useState<GradeTrack>('official');

  const cardRadius =
    data.settings.cardStyle === 'soft' ? 22 : data.settings.cardStyle === 'glass' ? 20 : 16;
  const cardPadding = data.settings.compactMode ? 10 : 13;

  const currentGradePreview = useMemo(() => {
    const pointsNumber = Number(points) || 0;
    const maxPointsNumber = Number(maxPoints) || 1;
    return clamp(computeGrade(pointsNumber, maxPointsNumber), 1, 6);
  }, [points, maxPoints]);

  const officialGrades = useMemo(
    () => data.grades.filter((entry) => entry.track === 'official'),
    [data.grades],
  );
  const playgroundGrades = useMemo(
    () => data.grades.filter((entry) => entry.track === 'playground'),
    [data.grades],
  );

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
    const target = clamp(Number(targetGrade) || 1, 1, 6);
    const max = Math.max(1, Number(maxPoints) || 1);
    return clamp(((target - 1) / 5) * max, 0, max);
  }, [targetGrade, maxPoints]);

  const knownSubjects = useMemo(() => {
    const values = Array.from(new Set(data.grades.map((grade) => toSubjectKey(grade.subject))));
    return values.sort((left, right) => left.localeCompare(right));
  }, [data.grades]);

  function onSaveGrade() {
    const pointsNumber = Number(points);
    const maxPointsNumber = Number(maxPoints);
    const weightNumber = Number(weight);

    if (!title.trim() || !subject.trim() || Number.isNaN(pointsNumber) || Number.isNaN(maxPointsNumber)) {
      return;
    }

    addGrade({
      title: title.trim(),
      subject: subject.trim().toUpperCase(),
      track,
      points: pointsNumber,
      maxPoints: Math.max(1, maxPointsNumber),
      weight: Number.isNaN(weightNumber) ? 1 : Math.max(0.25, weightNumber),
      note: note.trim() || undefined,
    });

    setNote('');
    setPoints('');
  }

  function renderResultRows(titleKey: string, entries: GradeItem[]) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: cardRadius, padding: cardPadding }]}> 
        <Text style={[styles.heading, { color: colors.text, fontSize: 16 * fontScaleMultiplier }]}>{t(titleKey)}</Text>
        {entries.length === 0 ? (
          <Text style={{ color: colors.subtle }}>{t('grades.noResults')}</Text>
        ) : (
          [...entries]
            .sort((left, right) => dayjs(right.date).valueOf() - dayjs(left.date).valueOf())
            .map((entry) => (
              <View key={entry.id} style={[styles.resultCard, { borderColor: colors.border }]}> 
                <View style={{ flex: 1 }}> 
                  <Text style={{ color: colors.text, fontWeight: '800' }}>
                    {entry.subject} • {entry.title}
                  </Text>
                  <Text style={{ color: colors.subtle }}>
                    {entry.points}/{entry.maxPoints} • w:{entry.weight} • {dayjs(entry.date).format('DD.MM.YYYY')}
                  </Text>
                </View>
                <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 18 }}>{entry.grade.toFixed(2)}</Text>
                <Pressable onPress={() => removeGrade(entry.id)} style={[styles.deleteBtn, { borderColor: colors.border }]}> 
                  <Text style={{ color: colors.text }}>✕</Text>
                </Pressable>
              </View>
            ))
        )}
      </View>
    );
  }

  function renderSubjectRows(rows: ReturnType<typeof subjectAverages>) {
    if (rows.length === 0) {
      return <Text style={{ color: colors.subtle }}>{t('grades.noResults')}</Text>;
    }

    return rows.map((row) => {
      const configuredWeight = data.gradeSubjectWeights[row.subject] ?? 1;

      return (
        <View key={row.subject} style={[styles.subjectRow, { borderColor: colors.border }]}> 
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{row.subject}</Text>
            <Text style={{ color: colors.subtle }}>
              {t('grades.avg')}: {row.average.toFixed(2)} • n={row.entries}
            </Text>
          </View>

          <View style={styles.weightControl}> 
            <Pressable
              onPress={() => setGradeSubjectWeight(row.subject, Math.max(0.1, configuredWeight - 0.25))}
              style={[styles.weightBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontWeight: '800' }}>-</Text>
            </Pressable>
            <Text style={{ color: colors.text, minWidth: 40, textAlign: 'center', fontWeight: '700' }}>
              {configuredWeight.toFixed(2)}
            </Text>
            <Pressable
              onPress={() => setGradeSubjectWeight(row.subject, configuredWeight + 0.25)}
              style={[styles.weightBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontWeight: '800' }}>+</Text>
            </Pressable>
          </View>
        </View>
      );
    });
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
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

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: cardRadius, padding: cardPadding }]}> 
        <Text style={[styles.heading, { color: colors.text, fontSize: 16 * fontScaleMultiplier }]}>{t('grades.addResult')}</Text>

        <View style={styles.segmentRow}>
          {(['official', 'playground'] as GradeTrack[]).map((value) => (
            <Pressable
              key={value}
              onPress={() => setTrack(value)}
              style={[
                styles.segment,
                {
                  borderColor: track === value ? colors.accent : colors.border,
                  backgroundColor: track === value ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {value === 'official' ? t('grades.official') : t('grades.playground')}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}> 
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('grades.examTitle')}
            placeholderTextColor={colors.subtle}
            style={[styles.input, styles.rowInput, { borderColor: colors.border, color: colors.text }]}
          />
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder={t('grades.subject')}
            placeholderTextColor={colors.subtle}
            style={[styles.input, styles.rowInput, { borderColor: colors.border, color: colors.text }]}
          />
        </View>

        <View style={styles.row}> 
          <TextInput
            value={points}
            onChangeText={setPoints}
            placeholder={t('grades.points')}
            keyboardType="numeric"
            placeholderTextColor={colors.subtle}
            style={[styles.input, styles.rowInput, { borderColor: colors.border, color: colors.text }]}
          />
          <TextInput
            value={maxPoints}
            onChangeText={setMaxPoints}
            placeholder={t('grades.maxPoints')}
            keyboardType="numeric"
            placeholderTextColor={colors.subtle}
            style={[styles.input, styles.rowInput, { borderColor: colors.border, color: colors.text }]}
          />
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder={t('grades.weight')}
            keyboardType="numeric"
            placeholderTextColor={colors.subtle}
            style={[styles.input, styles.rowInput, { borderColor: colors.border, color: colors.text }]}
          />
        </View>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('grades.note')}
          placeholderTextColor={colors.subtle}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          multiline
        />

        <View style={[styles.previewBadge, { borderColor: colors.border }]}> 
          <Text style={{ color: colors.text, fontWeight: '800' }}>{t('grades.previewSwiss')}</Text>
          <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 18 }}>{currentGradePreview.toFixed(2)}</Text>
        </View>

        <Pressable onPress={onSaveGrade} style={[styles.saveBtn, { backgroundColor: colors.accent }]}> 
          <Text style={styles.saveText}>{t('grades.saveResult')}</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: cardRadius, padding: cardPadding }]}> 
        <Text style={[styles.heading, { color: colors.text, fontSize: 16 * fontScaleMultiplier }]}>{t('grades.targetCalculator')}</Text>
        <View style={styles.row}> 
          <TextInput
            value={targetGrade}
            onChangeText={setTargetGrade}
            placeholder={t('grades.targetGrade')}
            keyboardType="numeric"
            placeholderTextColor={colors.subtle}
            style={[styles.input, styles.rowInput, { borderColor: colors.border, color: colors.text }]}
          />
          <TextInput
            value={maxPoints}
            onChangeText={setMaxPoints}
            placeholder={t('grades.maxPoints')}
            keyboardType="numeric"
            placeholderTextColor={colors.subtle}
            style={[styles.input, styles.rowInput, { borderColor: colors.border, color: colors.text }]}
          />
        </View>
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          {t('grades.needPoints')}: {requiredPoints.toFixed(2)} / {Math.max(1, Number(maxPoints) || 1)}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: cardRadius, padding: cardPadding }]}> 
        <Text style={[styles.heading, { color: colors.text, fontSize: 16 * fontScaleMultiplier }]}>{t('grades.subjectWeights')}</Text>
        <Text style={{ color: colors.subtle }}>{t('grades.subjectWeightHint')}</Text>

        {knownSubjects.length === 0 ? (
          <Text style={{ color: colors.subtle }}>{t('grades.noResults')}</Text>
        ) : (
          knownSubjects.map((subjectCode) => {
            const configuredWeight = data.gradeSubjectWeights[subjectCode] ?? 1;
            return (
              <View key={subjectCode} style={[styles.subjectRow, { borderColor: colors.border }]}> 
                <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>{subjectCode}</Text>
                <View style={styles.weightControl}> 
                  <Pressable
                    onPress={() => setGradeSubjectWeight(subjectCode, Math.max(0.1, configuredWeight - 0.25))}
                    style={[styles.weightBtn, { borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.text, fontWeight: '800' }}>-</Text>
                  </Pressable>
                  <Text style={{ color: colors.text, minWidth: 40, textAlign: 'center', fontWeight: '700' }}>
                    {configuredWeight.toFixed(2)}
                  </Text>
                  <Pressable
                    onPress={() => setGradeSubjectWeight(subjectCode, configuredWeight + 0.25)}
                    style={[styles.weightBtn, { borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.text, fontWeight: '800' }}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: cardRadius, padding: cardPadding }]}> 
        <Text style={[styles.heading, { color: colors.text, fontSize: 16 * fontScaleMultiplier }]}>{t('grades.official')}</Text>

        <View style={styles.widgetsRow}>
          <InfoWidget
            title={t('grades.averageSwiss')}
            value={officialWeighted ? officialWeighted.toFixed(2) : '-'}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
          <InfoWidget
            title={t('grades.allSubjectsWeighted')}
            value={officialSubjectWeighted ? officialSubjectWeighted.toFixed(2) : '-'}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
        </View>
        <Text style={{ color: colors.subtle }}>{t('grades.pointsRate')}: {officialPointsRate ? `${officialPointsRate.toFixed(1)}%` : '-'}</Text>
        {renderSubjectRows(officialSubjectRows)}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: cardRadius, padding: cardPadding }]}> 
        <Text style={[styles.heading, { color: colors.text, fontSize: 16 * fontScaleMultiplier }]}>{t('grades.playground')}</Text>
        <View style={styles.widgetsRow}>
          <InfoWidget
            title={t('grades.averageSwiss')}
            value={playgroundWeighted ? playgroundWeighted.toFixed(2) : '-'}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
          <InfoWidget
            title={t('grades.allSubjectsWeighted')}
            value={playgroundSubjectWeighted ? playgroundSubjectWeighted.toFixed(2) : '-'}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
        </View>
        <Text style={{ color: colors.subtle }}>{t('grades.pointsRate')}: {playgroundPointsRate ? `${playgroundPointsRate.toFixed(1)}%` : '-'}</Text>
        {renderSubjectRows(playgroundSubjectRows)}
      </View>

      {renderResultRows('grades.officialResults', officialGrades)}
      {renderResultRows('grades.playgroundResults', playgroundGrades)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  widgetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  heading: {
    fontWeight: '900',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rowInput: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewBadge: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveBtn: {
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveText: {
    color: '#fff',
    fontWeight: '900',
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    borderWidth: 1,
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weightControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
