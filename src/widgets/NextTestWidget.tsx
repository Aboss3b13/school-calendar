'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface NextTestWidgetData {
  title: string;
  testTitle: string;
  subject: string;
  dateLabel: string;
  accent: string;
}

export function renderNextTestWidget(data: NextTestWidgetData) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#111827',
        borderRadius: 18,
        padding: 14,
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
      accessibilityLabel="SchoolFlow next test widget"
    >
      <TextWidget
        text={data.title}
        style={{
          color: '#F9FAFB',
          fontSize: 14,
          fontWeight: '700',
        }}
      />

      <TextWidget
        text={data.testTitle}
        maxLines={2}
        style={{
          color: '#F3F4F6',
          fontSize: 16,
          fontWeight: '700',
        }}
      />

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TextWidget
          text={data.subject}
          style={{
            color: data.accent as any,
            fontSize: 12,
            fontWeight: '700',
          }}
        />
        <TextWidget
          text={data.dateLabel}
          style={{
            color: '#D1D5DB',
            fontSize: 12,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
