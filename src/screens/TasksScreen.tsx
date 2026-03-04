import React, { useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAppContext } from '../context/AppContext';
import { TaskPriority } from '../types/models';
import { shadows, spacing, radii, priorityColors } from '../theme/theme';

export default function TasksScreen() {
  const { t } = useTranslation();
  const { data, colors, isDark, addTask, toggleTask, fontScaleMultiplier } = useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const priorities: TaskPriority[] = ['low', 'medium', 'high'];
  const PRIORITY_ICON: Record<TaskPriority, string> = { low: 'arrow-down', medium: 'remove', high: 'arrow-up' };

  function toggleForm() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowForm((v) => !v);
  }

  function saveTask() {
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      details: details.trim(),
      dueDate,
      subject: subject.trim(),
      priority,
    });

    setTitle('');
    setDetails('');
    setSubject('');
    setPriority('medium');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowForm(false);
  }

  const sortedTasks = [...data.tasks].sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    const prioOrder = { high: 0, medium: 1, low: 2 };
    return (prioOrder[a.priority] ?? 1) - (prioOrder[b.priority] ?? 1);
  });

  const openCount = data.tasks.filter((t2) => !t2.completed).length;
  const doneCount = data.tasks.length - openCount;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Header ──────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text, fontSize: 24 * fontScaleMultiplier }]}>
              {t('tasks.title')}
            </Text>
            <Text style={{ color: colors.subtle, fontSize: 13 }}>
              {openCount} {t('dashboard.openTasks').toLowerCase()} · {doneCount} {t('tasks.complete').toLowerCase()}
            </Text>
          </View>
        </View>

        {/* ── Progress ────────────────────────── */}
        {data.tasks.length > 0 ? (
          <View style={[styles.progressWrap, shadows.sm, { backgroundColor: colors.card }]}>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${data.tasks.length > 0 ? Math.round((doneCount / data.tasks.length) * 100) : 0}%`,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}

        {/* ── Collapsible Form ────────────────── */}
        <Pressable
          onPress={toggleForm}
          style={({ pressed }) => [
            styles.addBar,
            shadows.sm,
            {
              backgroundColor: showForm ? `${colors.accent}12` : colors.card,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name={showForm ? 'close' : 'add-circle-outline'} size={22} color={colors.accent} />
          <Text style={{ color: colors.accent, fontWeight: '700', marginLeft: 8, fontSize: 15 * fontScaleMultiplier }}>
            {showForm ? t('common.cancel') : t('tasks.addTask')}
          </Text>
        </Pressable>

        {showForm ? (
          <View style={[styles.formCard, shadows.md, { backgroundColor: colors.card }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('tasks.taskTitle')}
              placeholderTextColor={colors.subtle}
              style={[styles.input, { borderColor: isDark ? '#334155' : '#E2E8F0', color: colors.text }]}
            />
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder={t('tasks.details')}
              placeholderTextColor={colors.subtle}
              style={[styles.input, { borderColor: isDark ? '#334155' : '#E2E8F0', color: colors.text }]}
              multiline
            />
            <View style={styles.rowInputs}>
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                placeholder={t('tasks.dueDate')}
                placeholderTextColor={colors.subtle}
                style={[styles.input, styles.flex1, { borderColor: isDark ? '#334155' : '#E2E8F0', color: colors.text }]}
              />
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder={t('tasks.subject')}
                placeholderTextColor={colors.subtle}
                style={[styles.input, styles.flex1, { borderColor: isDark ? '#334155' : '#E2E8F0', color: colors.text }]}
              />
            </View>

            <View style={styles.priorityRow}>
              {priorities.map((p) => {
                const active = priority === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.priorityBtn,
                      {
                        borderColor: active ? priorityColors[p] : isDark ? '#334155' : '#E2E8F0',
                        backgroundColor: active ? `${priorityColors[p]}18` : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons name={PRIORITY_ICON[p] as any} size={14} color={active ? priorityColors[p] : colors.subtle} />
                    <Text
                      style={{
                        color: active ? priorityColors[p] : colors.text,
                        fontWeight: '700',
                        marginLeft: 4,
                        fontSize: 13,
                      }}
                    >
                      {t(`tasks.${p}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={saveTask}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: colors.accent, opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <Text style={styles.saveText}>{t('tasks.save')}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ── Task List ───────────────────────── */}
        {sortedTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-outline" size={40} color={colors.subtle} />
            <Text style={{ color: colors.subtle, marginTop: 10, fontWeight: '600' }}>{t('tasks.noTasks')}</Text>
          </View>
        ) : (
          sortedTasks.map((task) => {
            const pc = priorityColors[task.priority] ?? colors.accent;
            return (
              <Pressable
                key={task.id}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  toggleTask(task.id);
                }}
                style={({ pressed }) => [
                  styles.taskCard,
                  shadows.sm,
                  {
                    backgroundColor: colors.card,
                    borderLeftColor: pc,
                    opacity: pressed ? 0.9 : task.completed ? 0.6 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: task.completed ? colors.accent : isDark ? '#475569' : '#CBD5E1',
                      backgroundColor: task.completed ? colors.accent : 'transparent',
                    },
                  ]}
                >
                  {task.completed ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.taskTitle,
                      {
                        color: colors.text,
                        textDecorationLine: task.completed ? 'line-through' : 'none',
                        fontSize: 15 * fontScaleMultiplier,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    {task.subject ? (
                      <View style={[styles.taskChip, { backgroundColor: `${pc}15` }]}>
                        <Text style={{ color: pc, fontWeight: '700', fontSize: 11 }}>{task.subject}</Text>
                      </View>
                    ) : null}
                    {task.dueDate ? (
                      <Text style={{ color: colors.subtle, fontSize: 12 }}>
                        {dayjs(task.dueDate).format('DD MMM')}
                      </Text>
                    ) : null}
                    <View style={[styles.prioDot, { backgroundColor: pc }]} />
                    <Text style={{ color: pc, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                      {t(`tasks.${task.priority}`)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.sm + 2,
  },
  header: {
    marginBottom: spacing.sm,
  },
  pageTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  progressWrap: {
    borderRadius: radii.md,
    padding: spacing.sm + 4,
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
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  formCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm + 2,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radii.sm + 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex1: { flex: 1 },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radii.sm + 4,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    borderRadius: radii.sm + 4,
    alignItems: 'center',
    paddingVertical: 14,
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  taskCard: {
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    borderLeftWidth: 4,
    flexDirection: 'row',
    gap: spacing.sm + 2,
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  taskChip: {
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  prioDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
