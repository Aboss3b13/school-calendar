import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { renderSchoolOverviewWidget } from './SchoolOverviewWidget';
import { renderCalendarWidget } from './CalendarWidget';
import { renderNextTestWidget } from './NextTestWidget';
import { renderQuickGradeWidget } from './QuickGradeWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetMap = {
    SchoolOverview: () =>
      renderSchoolOverviewWidget({
        title: 'SchoolFlow',
        subtitle: 'Open SchoolFlow to sync latest data',
        openTasks: 0,
        averageGrade: null,
        accent: '#60A5FA',
      }),
    CalendarWidget: () =>
      renderCalendarWidget({
        title: 'Today',
        dateLabel: new Date().toLocaleDateString(),
        nextEventTitle: 'Open SchoolFlow to load calendar',
        nextEventTime: '--:--',
        accent: '#60A5FA',
      }),
    NextTestWidget: () =>
      renderNextTestWidget({
        title: 'Next Test',
        testTitle: 'Open SchoolFlow to load tests',
        subject: '—',
        dateLabel: '—',
        accent: '#60A5FA',
      }),
    QuickGradeWidget: () =>
      renderQuickGradeWidget({
        title: 'Official Avg',
        average: null,
        openTasks: 0,
        accent: '#60A5FA',
      }),
  };

  const render = widgetMap[props.widgetInfo.widgetName as keyof typeof widgetMap];

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
      if (render) {
        props.renderWidget(render());
      }
      break;
    case 'WIDGET_CLICK':
    case 'WIDGET_RESIZED':
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
