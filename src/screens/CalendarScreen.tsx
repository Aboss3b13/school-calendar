import React, { useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { CalendarEntryType, CalendarEvent } from '../types/models';
import { shadows, spacing, radii } from '../theme/theme';

type EntryFilter = 'all' | CalendarEntryType;
type SortMode = 'time' | 'subject';

const ENTRY_ICON: Record<CalendarEntryType, string> = {
  exam: 'alert-circle',
  lesson: 'book',
  event: 'calendar',
};

export default function CalendarScreen() {
  const { t } = useTranslation();
  const { data, colors, isDark, syncCalendar, fontScaleMultiplier } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [refreshing, setRefreshing] = useState(false);
  const [entryFilter, setEntryFilter] = useState<EntryFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('time');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [showPastExams, setShowPastExams] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

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
    if (entryType === 'exam') return t('calendar.exams');
    if (entryType === 'lesson') return t('calendar.lessons');
    return t('calendar.events');
  }

  function Chip({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.chip,
          {
            backgroundColor: active ? `${colors.accent}18` : 'transparent',
            borderColor: active ? colors.accent : isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <Text
          style={{
            color: active ? colors.accent : colors.text,
            fontWeight: active ? '800' : '600',
            fontSize: 13,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  function renderEventCard(event: CalendarEvent) {
    const isExam = event.entryType === 'exam';
    const accentColor = isExam ? '#EF4444' : colors.accent;

    return (
      <Pressable
        key={`${event.id}_${event.start}`}
        onPress={() => setDetailEvent(event)}
        style={({ pressed }) => [
          styles.eventCard,
          shadows.sm,
          {
            backgroundColor: colors.card,
            borderLeftColor: accentColor,
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <View style={styles.eventHeader}>
          <Ionicons
            name={(ENTRY_ICON[event.entryType] ?? 'calendar') as any}
            size={18}
            color={accentColor}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.eventTitle, { color: colors.text, fontSize: 15 * fontScaleMultiplier }]} numberOfLines={1}>
            {event.title}
          </Text>
          {isExam ? (
            <View style={styles.examPill}>
              <Text style={styles.examPillText}>{t('calendar.exams')}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.eventMeta}>
          <Ionicons name="time-outline" size={13} color={colors.subtle} />
          <Text style={[styles.eventMetaText, { color: colors.subtle }]}>
            {dayjs(event.start).format('HH:mm')} – {dayjs(event.end).format('HH:mm')}
          </Text>
          {event.subject ? (
            <>
              <View style={[styles.metaDot, { backgroundColor: colors.subtle }]} />
              <Text style={[styles.eventMetaText, { color: colors.text, fontWeight: '700' }]}>{event.subject}</Text>
            </>
          ) : null}
          {event.location ? (
            <>
              <View style={[styles.metaDot, { backgroundColor: colors.subtle }]} />
              <Ionicons name="location-outline" size={13} color={colors.subtle} />
              <Text style={[styles.eventMetaText, { color: colors.subtle }]}>{event.location}</Text>
            </>
          ) : null}
        </View>
      </Pressable>
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
      {/* ── Calendar ───────────────────────────── */}
      <View style={[styles.calendarWrap, shadows.md, { backgroundColor: colors.card }]}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={marks}
          theme={{
            backgroundColor: colors.card,
            calendarBackground: colors.card,
            dayTextColor: colors.text,
            monthTextColor: colors.text,
            textMonthFontWeight: '800',
            textMonthFontSize: 16,
            textDayHeaderFontWeight: '700',
            todayTextColor: colors.accent,
            arrowColor: colors.accent,
            textDayFontWeight: '500',
          }}
        />
      </View>

      {/* ── Date heading ──────────────────────── */}
      <Text style={[styles.dateHeading, { color: colors.text, fontSize: 20 * fontScaleMultiplier }]}>
        {dayjs(selectedDate).format('dddd, DD MMMM')}
      </Text>

      {/* ── Filters ────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
        {(['all', 'lesson', 'event', 'exam'] as EntryFilter[]).map((f) => (
          <Chip
            key={f}
            label={f === 'all' ? t('calendar.all') : formatEntryType(f)}
            active={entryFilter === f}
            onPress={() => setEntryFilter(f)}
          />
        ))}
        <View style={styles.chipDivider} />
        <Chip label={t('calendar.sortTime')} active={sortMode === 'time'} onPress={() => setSortMode('time')} />
        <Chip label={t('calendar.sortSubject')} active={sortMode === 'subject'} onPress={() => setSortMode('subject')} />
      </ScrollView>

      {subjectsForDate.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <Chip label={t('calendar.allSubjects')} active={subjectFilter === 'all'} onPress={() => setSubjectFilter('all')} />
          {subjectsForDate.map((subject) => (
            <Chip key={subject} label={subject} active={subjectFilter === subject} onPress={() => setSubjectFilter(subject)} />
          ))}
        </ScrollView>
      ) : null}

      {/* ── Day Events ────────────────────────── */}
      {dayEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={32} color={colors.subtle} />
          <Text style={{ color: colors.subtle, marginTop: 8, fontWeight: '600' }}>{t('calendar.noEvents')}</Text>
        </View>
      ) : (
        dayEvents.map((event) => renderEventCard(event))
      )}

      {/* ── Upcoming Exams ────────────────────── */}
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18 * fontScaleMultiplier }]}>
        {t('calendar.nextExams')} ({upcomingExams.length})
      </Text>
      {upcomingExams.length === 0 ? (
        <Text style={{ color: colors.subtle, paddingHorizontal: 4 }}>{t('calendar.noUpcoming')}</Text>
      ) : (
        upcomingExams.slice(0, 12).map((exam) => renderEventCard(exam))
      )}

      {/* ── Past exams toggle ─────────────────── */}
      <Pressable
        onPress={() => setShowPastExams((prev) => !prev)}
        style={({ pressed }) => [
          styles.toggleBtn,
          shadows.sm,
          {
            backgroundColor: colors.card,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons
          name={showPastExams ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={18}
          color={colors.accent}
        />
        <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>
          {showPastExams ? t('calendar.hidePastExams') : t('calendar.showPastExams')}
        </Text>
      </Pressable>

      {showPastExams ? (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 16 * fontScaleMultiplier }]}>
            {t('calendar.pastExams')}
          </Text>
          {pastExams.length === 0 ? (
            <Text style={{ color: colors.subtle }}>{t('calendar.nonePastExams')}</Text>
          ) : (
            pastExams.map((exam) => renderEventCard(exam))
          )}
        </View>
      ) : null}

      {/* ── Event Detail Modal ────────────── */}
      <Modal
        visible={detailEvent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailEvent(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDetailEvent(null)}>
          <Pressable style={[styles.modalCard, shadows.lg, { backgroundColor: colors.card }]} onPress={() => {}}>
            {detailEvent && (
              <>
                <View style={styles.modalHeader}>
                  <Ionicons
                    name={(ENTRY_ICON[detailEvent.entryType] ?? 'calendar') as any}
                    size={22}
                    color={detailEvent.entryType === 'exam' ? '#EF4444' : colors.accent}
                  />
                  <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={3}>
                    {detailEvent.title}
                  </Text>
                  <Pressable onPress={() => setDetailEvent(null)}>
                    <Ionicons name="close" size={22} color={colors.subtle} />
                  </Pressable>
                </View>

                <View style={styles.modalBody}>
                  {detailEvent.entryType === 'exam' && (
                    <View style={[styles.detailPill, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="alert-circle" size={14} color="#EF4444" />
                      <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 12 }}>{t('calendar.exams')}</Text>
                    </View>
                  )}

                  <DetailRow icon="time-outline" label={t('calendar.detailTime')} value={
                    detailEvent.allDay
                      ? t('calendar.allDay')
                      : `${dayjs(detailEvent.start).format('ddd, DD MMM YYYY · HH:mm')} – ${dayjs(detailEvent.end).format('HH:mm')}`
                  } colors={colors} />

                  {detailEvent.subject ? (
                    <DetailRow icon="book-outline" label={t('grades.subject')} value={detailEvent.subject} colors={colors} />
                  ) : null}

                  {detailEvent.location ? (
                    <DetailRow icon="location-outline" label={t('calendar.detailLocation')} value={detailEvent.location} colors={colors} />
                  ) : null}

                  <DetailRow icon="pricetag-outline" label={t('calendar.detailType')} value={
                    detailEvent.entryType === 'exam' ? t('calendar.exams') :
                    detailEvent.entryType === 'lesson' ? t('calendar.lessons') :
                    t('calendar.events')
                  } colors={colors} />

                  {detailEvent.description ? (
                    <View style={styles.descriptionBlock}>
                      <Text style={{ color: colors.subtle, fontWeight: '700', fontSize: 12, marginBottom: 4 }}>{t('calendar.detailDescription')}</Text>
                      <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{detailEvent.description}</Text>
                    </View>
                  ) : null}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: { text: string; subtle: string; accent: string } }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={16} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.subtle, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</Text>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.sm + 4,
  },
  calendarWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  dateHeading: {
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  chipScroll: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipDivider: {
    width: 1,
    backgroundColor: '#94A3B8',
    opacity: 0.3,
    marginHorizontal: 2,
  },
  eventCard: {
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    borderLeftWidth: 4,
    gap: 6,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTitle: {
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.2,
  },
  examPill: {
    backgroundColor: '#FEE2E2',
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginLeft: 6,
  },
  examPillText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  eventMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: spacing.md,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    flex: 1,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  modalBody: {
    gap: spacing.sm + 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  descriptionBlock: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.2)',
    paddingTop: spacing.sm,
  },
});
