import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import SectionCard from '../components/SectionCard';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const { data, colors, syncCalendar } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [refreshing, setRefreshing] = useState(false);

  const marks = useMemo(() => {
    const mapped: Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }> = {};

    data.events.forEach((event) => {
      const key = dayjs(event.start).format('YYYY-MM-DD');
      mapped[key] = {
        marked: true,
        dotColor: event.isExam ? '#EF4444' : colors.accent,
      };
    });

    mapped[selectedDate] = {
      ...(mapped[selectedDate] ?? { marked: false, dotColor: colors.accent }),
      selected: true,
      selectedColor: colors.accent,
    };

    return mapped;
  }, [data.events, selectedDate, colors.accent]);

  const dayEvents = data.events.filter((event) => dayjs(event.start).format('YYYY-MM-DD') === selectedDate);
  const exams = data.events.filter((event) => event.isExam).slice(0, 8);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await syncCalendar();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.hint, { color: colors.subtle }]}>{t('calendar.pullToSync')}</Text>

      <View style={[styles.calendarWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={marks}
          theme={{
            backgroundColor: colors.card,
            calendarBackground: colors.card,
            dayTextColor: colors.text,
            monthTextColor: colors.text,
            textMonthFontWeight: '700',
            textDayHeaderFontWeight: '700',
            todayTextColor: colors.accent,
            arrowColor: colors.accent,
          }}
        />
      </View>

      <SectionCard
        title={dayjs(selectedDate).format('dddd, DD MMMM')}
        subtitle={t('calendar.title')}
        background={colors.card}
        textColor={colors.text}
        borderColor={colors.border}
        compact={data.settings.compactMode}
      >
        {dayEvents.length === 0 ? (
          <Text style={{ color: colors.subtle }}>{t('calendar.noEvents')}</Text>
        ) : (
          dayEvents.map((event) => (
            <View key={`${event.id}_${event.start}`} style={styles.eventRow}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: event.isExam ? '#EF4444' : colors.accent,
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{event.title}</Text>
                <Text style={{ color: colors.subtle }}>
                  {dayjs(event.start).format('HH:mm')} - {dayjs(event.end).format('HH:mm')}
                </Text>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard
        title={t('calendar.exams')}
        subtitle={`${exams.length}`}
        background={colors.card}
        textColor={colors.text}
        borderColor={colors.border}
        compact={data.settings.compactMode}
      >
        {exams.map((exam) => (
          <Text key={`${exam.id}_${exam.start}`} style={{ color: colors.text, marginBottom: 6 }}>
            • {dayjs(exam.start).format('DD.MM HH:mm')} — {exam.title}
          </Text>
        ))}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
  hint: {
    fontSize: 12,
    marginBottom: -6,
  },
  calendarWrap: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});
