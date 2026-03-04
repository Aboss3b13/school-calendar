import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { WidgetPreview } from 'react-native-android-widget';
import { useAppContext } from '../context/AppContext';
import { renderSchoolOverviewWidget } from '../widgets/SchoolOverviewWidget';

export default function WidgetsScreen() {
  const { t } = useTranslation();
  const { data, colors, updateSettings } = useAppContext();

  const nextExam = useMemo(() => {
    const now = Date.now();
    return data.events
      .filter((event) => event.entryType === 'exam' && new Date(event.start).getTime() >= now)
      .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime())[0];
  }, [data.events]);

  const openTasks = data.tasks.filter((task) => !task.completed).length;
  const averageGrade =
    data.grades.length > 0
      ? data.grades.reduce((sum, entry) => sum + entry.grade * entry.weight, 0) /
        data.grades.reduce((sum, entry) => sum + entry.weight, 0)
      : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.heading, { color: colors.text }]}>{t('widgets.homeWidgets')}</Text>

        <View style={styles.switchRow}> 
          <Text style={{ color: colors.text }}>{t('widgets.enableSync')}</Text>
          <Switch
            value={data.settings.homescreenWidgets}
            onValueChange={(value) => updateSettings({ homescreenWidgets: value })}
            trackColor={{ true: colors.accent }}
          />
        </View>

        <Text style={{ color: colors.subtle }}>{t('widgets.hint')}</Text>

        <View style={styles.previewWrap}> 
          <WidgetPreview
            width={320}
            height={160}
            renderWidget={() =>
              renderSchoolOverviewWidget({
                title: 'SchoolFlow',
                subtitle: nextExam
                  ? `${nextExam.title} • ${dayjs(nextExam.start).format('DD.MM HH:mm')}`
                  : t('widgets.noExam'),
                openTasks,
                averageGrade,
                accent: colors.accent,
              })
            }
          />
        </View>

        <Text style={{ color: colors.subtle }}>{t('widgets.installSteps')}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.heading, { color: colors.text }]}>{t('widgets.quickWidgets')}</Text>

        <View style={styles.quickRow}> 
          <Pressable style={[styles.quickTile, { borderColor: colors.border }]}> 
            <Text style={{ color: colors.text, fontWeight: '900' }}>{openTasks}</Text>
            <Text style={{ color: colors.subtle }}>{t('dashboard.openTasks')}</Text>
          </Pressable>
          <Pressable style={[styles.quickTile, { borderColor: colors.border }]}> 
            <Text style={{ color: colors.text, fontWeight: '900' }}>{data.grades.length}</Text>
            <Text style={{ color: colors.subtle }}>{t('grades.results')}</Text>
          </Pressable>
          <Pressable style={[styles.quickTile, { borderColor: colors.border }]}> 
            <Text style={{ color: colors.text, fontWeight: '900' }}>{data.notes.length}</Text>
            <Text style={{ color: colors.subtle }}>{t('dashboard.notesCount')}</Text>
          </Pressable>
        </View>
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 88,
    padding: 10,
    justifyContent: 'space-between',
  },
});
