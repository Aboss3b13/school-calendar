import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface InfoWidgetProps {
  title: string;
  value: string | number;
  accent: string;
  textColor: string;
  subtleColor: string;
  background: string;
  borderColor: string;
}

export default function InfoWidget({
  title,
  value,
  accent,
  textColor,
  subtleColor,
  background,
  borderColor,
}: InfoWidgetProps) {
  return (
    <View style={[styles.widget, { backgroundColor: background, borderColor }]}>
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
      <Text style={[styles.title, { color: subtleColor }]}>{title}</Text>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    flex: 1,
    minWidth: 140,
    minHeight: 94,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  value: {
    fontWeight: '900',
    fontSize: 24,
  },
  title: {
    fontWeight: '700',
    fontSize: 12,
  },
  accentBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 4,
    height: '100%',
  },
});
