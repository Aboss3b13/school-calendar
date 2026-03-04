'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface SchoolOverviewWidgetData {
  title: string;
  subtitle: string;
  openTasks: number;
  averageGrade: number | null;
  accent: string;
}

export function renderSchoolOverviewWidget(data: SchoolOverviewWidgetData) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'space-between',
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 16,
      }}
      clickAction="OPEN_APP"
      accessibilityLabel="SchoolFlow overview widget"
    >
      <TextWidget
        text={data.title}
        style={{
          fontSize: 20,
          color: '#F8FAFC',
          fontWeight: '700',
        }}
      />

      <TextWidget
        text={data.subtitle}
        maxLines={2}
        style={{
          fontSize: 14,
          color: '#E2E8F0',
        }}
      />

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget
          text={`Tasks: ${data.openTasks}`}
          style={{
            fontSize: 13,
            color: data.accent as any,
            fontWeight: '700',
          }}
        />
        <TextWidget
          text={data.averageGrade ? `Avg: ${data.averageGrade.toFixed(2)}` : 'Avg: -'}
          style={{
            fontSize: 13,
            color: '#F8FAFC',
            fontWeight: '700',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
