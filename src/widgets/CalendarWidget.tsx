'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface CalendarWidgetData {
  title: string;
  dateLabel: string;
  nextEventTitle: string;
  nextEventTime: string;
  accent: string;
}

export function renderCalendarWidget(data: CalendarWidgetData) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0B1220',
        borderRadius: 18,
        padding: 14,
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
      accessibilityLabel="SchoolFlow calendar widget"
    >
      <TextWidget
        text={`${data.title} • ${data.dateLabel}`}
        style={{
          color: '#F8FAFC',
          fontSize: 15,
          fontWeight: '700',
        }}
      />

      <TextWidget
        text={data.nextEventTitle}
        maxLines={2}
        style={{
          color: '#E2E8F0',
          fontSize: 14,
          fontWeight: '600',
        }}
      />

      <TextWidget
        text={`Next at ${data.nextEventTime}`}
        style={{
          color: data.accent as any,
          fontSize: 13,
          fontWeight: '700',
        }}
      />
    </FlexWidget>
  );
}
