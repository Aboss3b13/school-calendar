import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
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
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function MainTabs() {
  const { t } = useTranslation();
  const { colors, isReady, data, syncCalendar } = useAppContext();

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
        <Text style={{ marginTop: 12, color: colors.text }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
        },
      }}
    >
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.subtle,
          tabBarStyle: {
            borderTopColor: colors.border,
            backgroundColor: colors.card,
          },
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          tabBarIcon: ({ color, size }) => {
            const iconName =
              route.name === 'Dashboard'
                ? 'grid-outline'
                : route.name === 'Calendar'
                  ? 'calendar-outline'
                  : route.name === 'Tasks'
                    ? 'checkmark-done-outline'
                    : route.name === 'Notes'
                      ? 'document-text-outline'
                      : 'options-outline';
            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('tabs.dashboard') }} />
        <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: t('tabs.calendar') }} />
        <Tab.Screen name="Tasks" component={TasksScreen} options={{ title: t('tabs.tasks') }} />
        <Tab.Screen name="Notes" component={NotesScreen} options={{ title: t('tabs.notes') }} />
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
