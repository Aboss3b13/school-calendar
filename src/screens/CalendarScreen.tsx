import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import SectionCard from '../components/SectionCard';
import { CalendarEntryType, CalendarEvent } from '../types/models';

type EntryFilter = 'all' | CalendarEntryType;
type SortMode = 'time' | 'subject';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const { data, colors, syncCalendar } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [refreshing, setRefreshing] = useState(false);
  const [entryFilter, setEntryFilter] = useState<EntryFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('time');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [showPastExams, setShowPastExams] = useState(false);

  const now = dayjs();

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

  const dayEvents = useMemo(() => {
    const allOnDate = data.events.filter((event) => dayjs(event.start).format('YYYY-MM-DD') === selectedDate);

    const filtered = allOnDate.filter((event) => {
      const entryTypeMatch = entryFilter === 'all' || event.entryType === entryFilter;
      const subjectMatch = subjectFilter === 'all' || event.subject === subjectFilter;
      return entryTypeMatch && subjectMatch;
    });

    return filtered.sort((left, right) => {
      if (sortMode === 'subject') {
        const leftSubject = left.subject ?? 'ZZZ';
        const rightSubject = right.subject ?? 'ZZZ';
        if (leftSubject !== rightSubject) {
          return leftSubject.localeCompare(rightSubject);
        }
      }

      return dayjs(left.start).valueOf() - dayjs(right.start).valueOf();
    });
  }, [data.events, selectedDate, entryFilter, subjectFilter, sortMode]);

  const subjectsForDate = useMemo(
    () =>
      Array.from(
        new Set(
          data.events
            .filter((event) => dayjs(event.start).format('YYYY-MM-DD') === selectedDate)
            .map((event) => event.subject)
            .filter((subject): subject is string => Boolean(subject)),
        ),
      ).sort(),
    [data.events, selectedDate],
  );

  const upcomingExams = useMemo(
    () =>
      data.events
        .filter((event) => event.entryType === 'exam' && dayjs(event.start).isAfter(now))
        .sort((left, right) => dayjs(left.start).valueOf() - dayjs(right.start).valueOf()),
    [data.events, now],
  );

  const pastExams = useMemo(
    () =>
      data.events
        .filter((event) => event.entryType === 'exam' && dayjs(event.start).isBefore(now))
        .sort((left, right) => dayjs(right.start).valueOf() - dayjs(left.start).valueOf()),
    [data.events, now],
  );

  function formatEntryType(entryType: CalendarEntryType) {
    if (entryType === 'exam') {
      return t('calendar.exams');
    }
    if (entryType === 'lesson') {
      return t('calendar.lessons');
    }
    return t('calendar.events');
  }

  function renderEventBubble(event: CalendarEvent) {
    return (
      <View key={`${event.id}_${event.start}`} style={[styles.eventBubble, { borderColor: colors.border }]}> 
        <View style={styles.eventTopRow}>
          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: event.entryType === 'exam' ? '#EF444422' : `${colors.accent}22` },
            ]}
          >
            <Text
              style={{
                color: event.entryType === 'exam' ? '#EF4444' : colors.accent,
                fontWeight: '700',
                fontSize: 11,
              }}
            >
              {formatEntryType(event.entryType)}
            </Text>
          </View>
        </View>

        <View style={styles.chipsRow}>
          <View style={[styles.chip, { borderColor: colors.border }]}>
            <Text style={{ color: colors.subtle, fontWeight: '700' }}>
              {dayjs(event.start).format('HH:mm')} - {dayjs(event.end).format('HH:mm')}
            </Text>
          </View>

          {event.subject ? (
            <View style={[styles.chip, { borderColor: colors.border }]}> 
              <Text style={{ color: colors.text, fontWeight: '700' }}>{event.subject}</Text>
            </View>
          ) : null}

          {event.location ? (
            <View style={[styles.chip, { borderColor: colors.border }]}> 
              <Text style={{ color: colors.subtle, fontWeight: '700' }}>{event.location}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

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
        <View style={styles.filterRows}>
          <View style={styles.rowWrap}>
            {(['all', 'lesson', 'event', 'exam'] as EntryFilter[]).map((filterValue) => (
              <Pressable
                key={filterValue}
                onPress={() => setEntryFilter(filterValue)}
                style={[
                  styles.filterChip,
                  {
                    borderColor: entryFilter === filterValue ? colors.accent : colors.border,
                    backgroundColor: entryFilter === filterValue ? `${colors.accent}22` : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {filterValue === 'all' ? t('calendar.all') : formatEntryType(filterValue)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.rowWrap}>
            <Pressable
              onPress={() => setSortMode('time')}
              style={[
                styles.filterChip,
                {
                  borderColor: sortMode === 'time' ? colors.accent : colors.border,
                  backgroundColor: sortMode === 'time' ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t('calendar.sortTime')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setSortMode('subject')}
              style={[
                styles.filterChip,
                {
                  borderColor: sortMode === 'subject' ? colors.accent : colors.border,
                  backgroundColor: sortMode === 'subject' ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t('calendar.sortSubject')}</Text>
            </Pressable>
          </View>

          <View style={styles.rowWrap}>
            <Pressable
              onPress={() => setSubjectFilter('all')}
              style={[
                styles.filterChip,
                {
                  borderColor: subjectFilter === 'all' ? colors.accent : colors.border,
                  backgroundColor: subjectFilter === 'all' ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t('calendar.allSubjects')}</Text>
            </Pressable>
            {subjectsForDate.map((subject) => (
              <Pressable
                key={subject}
                onPress={() => setSubjectFilter(subject)}
                style={[
                  styles.filterChip,
                  {
                    borderColor: subjectFilter === subject ? colors.accent : colors.border,
                    backgroundColor: subjectFilter === subject ? `${colors.accent}22` : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: colors.text }}>{subject}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {dayEvents.length === 0 ? (
          <Text style={{ color: colors.subtle }}>{t('calendar.noEvents')}</Text>
        ) : (
          dayEvents.map((event) => renderEventBubble(event))
        )}
      </SectionCard>

      <SectionCard
        title={t('calendar.nextExams')}
        subtitle={`${upcomingExams.length}`}
        background={colors.card}
        textColor={colors.text}
        borderColor={colors.border}
        compact={data.settings.compactMode}
      >
        {upcomingExams.length === 0 ? <Text style={{ color: colors.subtle }}>{t('calendar.noUpcoming')}</Text> : null}
        {upcomingExams.slice(0, 12).map((exam) => renderEventBubble(exam))}

        <Pressable
          onPress={() => setShowPastExams((previous) => !previous)}
          style={[styles.togglePastBtn, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            {showPastExams ? t('calendar.hidePastExams') : t('calendar.showPastExams')}
          </Text>
        </Pressable>

        {showPastExams ? (
          <View style={[styles.pastExamsWrap, { borderColor: colors.border }]}>
            <Text style={[styles.pastExamsTitle, { color: colors.text }]}>{t('calendar.pastExams')}</Text>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 280 }}>
              {pastExams.length === 0 ? <Text style={{ color: colors.subtle }}>{t('calendar.nonePastExams')}</Text> : null}
              {pastExams.map((exam) => renderEventBubble(exam))}
            </ScrollView>
          </View>
        ) : null}
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
  filterRows: {
    gap: 8,
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  eventBubble: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eventTitle: {
    fontWeight: '800',
    flex: 1,
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  togglePastBtn: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 2,
  },
  pastExamsWrap: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    padding: 10,
  },
  pastExamsTitle: {
    fontWeight: '800',
    marginBottom: 8,
  },
});
