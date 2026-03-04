import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAppContext } from '../context/AppContext';
import { TaskPriority } from '../types/models';

export default function TasksScreen() {
  const { t } = useTranslation();
  const { data, colors, addTask, toggleTask } = useAppContext();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const priorities: TaskPriority[] = ['low', 'medium', 'high'];

  function saveTask() {
    if (!title.trim()) {
      return;
    }

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
  }

  const sortedTasks = [...data.tasks].sort((a, b) => Number(a.completed) - Number(b.completed));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('tasks.addTask')}</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('tasks.taskTitle')}
          placeholderTextColor={colors.subtle}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder={t('tasks.details')}
          placeholderTextColor={colors.subtle}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          multiline
        />
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          placeholder={t('tasks.dueDate')}
          placeholderTextColor={colors.subtle}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder={t('tasks.subject')}
          placeholderTextColor={colors.subtle}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />

        <View style={styles.priorityRow}>
          {priorities.map((item) => (
            <Pressable
              key={item}
              onPress={() => setPriority(item)}
              style={[
                styles.priorityBtn,
                {
                  borderColor: priority === item ? colors.accent : colors.border,
                  backgroundColor: priority === item ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t(`tasks.${item}`)}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={saveTask} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.saveText}>{t('tasks.save')}</Text>
        </Pressable>
      </View>

      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('tasks.title')}</Text>
        {sortedTasks.length === 0 ? (
          <Text style={{ color: colors.subtle }}>{t('tasks.noTasks')}</Text>
        ) : (
          sortedTasks.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => toggleTask(task.id)}
              style={[styles.taskRow, { borderColor: colors.border }]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: task.completed ? colors.accent : colors.border,
                    backgroundColor: task.completed ? colors.accent : 'transparent',
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: '700',
                    textDecorationLine: task.completed ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </Text>
                <Text style={{ color: colors.subtle }}>
                  {task.subject || '-'} • {task.dueDate || '-'} • {t(`tasks.${task.priority}`)}
                </Text>
              </View>
            </Pressable>
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
  formCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  saveBtn: {
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
  },
  taskRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderRadius: 6,
  },
});
