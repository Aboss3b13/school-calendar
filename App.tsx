import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import './src/i18n';
import { AppProvider, useAppContext } from './src/context/AppContext';
import DashboardScreen from './src/screens/DashboardScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import TasksScreen from './src/screens/TasksScreen';
import NotesScreen from './src/screens/NotesScreen';
import GradesScreen from './src/screens/GradesScreen';
import WidgetsScreen from './src/screens/WidgetsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Dashboard: 'grid',
  Calendar: 'calendar',
  Tasks: 'checkmark-done',
  Notes: 'document-text',
  Grades: 'calculator',
  Widgets: 'apps',
  Settings: 'options',
};

function MainTabs() {
  const { t } = useTranslation();
  const { colors, isDark, isReady, data, syncCalendar } = useAppContext();

  useEffect(() => {
    if (!isReady || data.events.length > 0) {
      return;
    }

    void syncCalendar();
  }, [isReady, data.events.length, syncCalendar]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ marginTop: 12, color: colors.text, fontWeight: '600' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        dark: isDark,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: 'transparent',
          primary: colors.accent,
        },
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.subtle,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.2,
            marginBottom: Platform.OS === 'android' ? 6 : 0,
          },
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 0,
            height: Platform.OS === 'android' ? 64 : 84,
            paddingTop: 6,
            ...(Platform.OS === 'ios'
              ? { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 }
              : { elevation: 12 }),
          },
          tabBarIcon: ({ color, size, focused }) => {
            const baseName = TAB_ICONS[route.name] ?? 'ellipse';
            const iconName = focused ? baseName : `${baseName}-outline`;
            return <Ionicons name={iconName as any} size={focused ? size + 1 : size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('tabs.dashboard') }} />
        <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: t('tabs.calendar') }} />
        <Tab.Screen name="Tasks" component={TasksScreen} options={{ title: t('tabs.tasks') }} />
        <Tab.Screen name="Notes" component={NotesScreen} options={{ title: t('tabs.notes') }} />
        <Tab.Screen name="Grades" component={GradesScreen} options={{ title: t('tabs.grades') }} />
        <Tab.Screen name="Widgets" component={WidgetsScreen} options={{ title: t('tabs.widgets') }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('tabs.settings') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainTabs />
    </AppProvider>
  );
}
