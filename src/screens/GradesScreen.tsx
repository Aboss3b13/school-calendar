import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import InfoWidget from '../components/InfoWidget';

function clamp(number: number, min: number, max: number) {
  return Math.min(max, Math.max(min, number));
}

export default function GradesScreen() {
  const { t } = useTranslation();
  const { data, colors, addGrade, removeGrade } = useAppContext();

  const [title, setTitle] = useState('Exam');
  const [subject, setSubject] = useState('MAT');
  const [points, setPoints] = useState('42');
  const [maxPoints, setMaxPoints] = useState('60');
  const [weight, setWeight] = useState('1');
  const [note, setNote] = useState('');
  const [targetGrade, setTargetGrade] = useState('5.0');

  const currentGradePreview = useMemo(() => {
    const pointsNumber = Number(points) || 0;
    const maxPointsNumber = Number(maxPoints) || 1;
    return clamp(1 + (5 * pointsNumber) / Math.max(1, maxPointsNumber), 1, 6);
  }, [points, maxPoints]);

  const weightedAverage = useMemo(() => {
    if (data.grades.length === 0) {
      return null;
    }
    const totalWeight = data.grades.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight <= 0) {
      return null;
    }
    return data.grades.reduce((sum, entry) => sum + entry.grade * entry.weight, 0) / totalWeight;
  }, [data.grades]);

  const averagePointsPercent = useMemo(() => {
    if (data.grades.length === 0) {
      return null;
    }
    const totalPoints = data.grades.reduce((sum, entry) => sum + entry.points, 0);
    const totalMax = data.grades.reduce((sum, entry) => sum + entry.maxPoints, 0);
    if (totalMax <= 0) {
      return null;
    }
    return (100 * totalPoints) / totalMax;
  }, [data.grades]);

  const requiredPoints = useMemo(() => {
    const target = clamp(Number(targetGrade) || 1, 1, 6);
    const max = Math.max(1, Number(maxPoints) || 1);
    return clamp(((target - 1) / 5) * max, 0, max);
  }, [targetGrade, maxPoints]);

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
      points: pointsNumber,
      maxPoints: Math.max(1, maxPointsNumber),
      weight: Number.isNaN(weightNumber) ? 1 : Math.max(0.25, weightNumber),
      note: note.trim() || undefined,
    });

    setNote('');
    setPoints('');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.widgetsRow}>
        <InfoWidget
          title={t('grades.averageSwiss')}
          value={weightedAverage ? weightedAverage.toFixed(2) : '-'}
          accent={colors.accent}
          textColor={colors.text}
          subtleColor={colors.subtle}
          background={colors.card}
          borderColor={colors.border}
        />
        <InfoWidget
          title={t('grades.pointsRate')}
          value={averagePointsPercent ? `${averagePointsPercent.toFixed(1)}%` : '-'}
          accent={colors.accent}
          textColor={colors.text}
          subtleColor={colors.subtle}
          background={colors.card}
          borderColor={colors.border}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.heading, { color: colors.text }]}>{t('grades.addResult')}</Text>

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

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.heading, { color: colors.text }]}>{t('grades.targetCalculator')}</Text>
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

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.heading, { color: colors.text }]}>{t('grades.results')}</Text>
        {data.grades.length === 0 ? (
          <Text style={{ color: colors.subtle }}>{t('grades.noResults')}</Text>
        ) : (
          [...data.grades]
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
});
