'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface QuickGradeWidgetData {
  title: string;
  average: number | null;
  openTasks: number;
  accent: string;
}

export function renderQuickGradeWidget(data: QuickGradeWidgetData) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 14,
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
      accessibilityLabel="SchoolFlow grade widget"
    >
      <TextWidget
        text={data.title}
        style={{
          color: '#F8FAFC',
          fontSize: 14,
          fontWeight: '700',
        }}
      />

      <TextWidget
        text={data.average ? data.average.toFixed(2) : '-'}
        style={{
          color: data.accent as any,
          fontSize: 28,
          fontWeight: '900',
        }}
      />

      <TextWidget
        text={`Open tasks: ${data.openTasks}`}
        style={{
          color: '#CBD5E1',
          fontSize: 12,
          fontWeight: '600',
        }}
      />
    </FlexWidget>
  );
}
