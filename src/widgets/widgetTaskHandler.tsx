import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { renderSchoolOverviewWidget } from './SchoolOverviewWidget';

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
