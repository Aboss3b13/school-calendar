import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

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
  const { data, fontScaleMultiplier } = useAppContext();
  const radius = data.settings.cardStyle === 'soft' ? 20 : data.settings.cardStyle === 'glass' ? 18 : 14;

  return (
    <View style={[styles.widget, { backgroundColor: background, borderColor, borderRadius: radius }]}>
      <Text style={[styles.value, { color: textColor, fontSize: 24 * fontScaleMultiplier }]}>{value}</Text>
      <Text style={[styles.title, { color: subtleColor, fontSize: 12 * fontScaleMultiplier }]}>{title}</Text>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    flex: 1,
    minWidth: 140,
    minHeight: 94,
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
