'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface LessonEntry {
  title: string;
  time: string;
  subject?: string;
}

interface UpcomingLessonsWidgetData {
  title: string;
  lessons: LessonEntry[];
  accent: string;
}

export function renderUpcomingLessonsWidget(data: UpcomingLessonsWidgetData) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#111827',
        borderRadius: 18,
        padding: 14,
      }}
      clickAction="OPEN_APP"
      accessibilityLabel="SchoolFlow upcoming lessons widget"
    >
      <TextWidget
        text={data.title}
        style={{
          color: '#F9FAFB',
          fontSize: 14,
          fontWeight: '700',
        }}
      />

      {data.lessons.length === 0 ? (
        <TextWidget
          text="No upcoming lessons"
          style={{
            color: '#9CA3AF',
            fontSize: 12,
          }}
        />
      ) : (
        data.lessons.slice(0, 3).map((lesson, idx) => (
          <FlexWidget
            key={`lesson_${idx}`}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 'match_parent',
              paddingVertical: 3,
            }}
          >
            <FlexWidget style={{ flexDirection: 'row', flex: 1 }}>
              <TextWidget
                text={lesson.subject ?? '—'}
                style={{
                  color: data.accent as any,
                  fontSize: 11,
                  fontWeight: '700',
                  marginRight: 6,
                }}
              />
              <TextWidget
                text={lesson.title}
                maxLines={1}
                style={{
                  color: '#E5E7EB',
                  fontSize: 11,
                }}
              />
            </FlexWidget>
            <TextWidget
              text={lesson.time}
              style={{
                color: '#9CA3AF',
                fontSize: 10,
              }}
            />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
