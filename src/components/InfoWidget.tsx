import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { shadows, radii, spacing } from '../theme/theme';

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
  const radius =
    data.settings.cardStyle === 'soft' ? radii.lg : data.settings.cardStyle === 'glass' ? radii.md + 4 : radii.md;

  return (
    <View
      style={[
        styles.widget,
        shadows.sm,
        {
          backgroundColor: background,
          borderColor: 'transparent',
          borderRadius: radius,
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.inner}>
        <Text style={[styles.value, { color: textColor, fontSize: 26 * fontScaleMultiplier }]}>{value}</Text>
        <Text
          style={[styles.title, { color: subtleColor, fontSize: 11 * fontScaleMultiplier }]}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    flex: 1,
    minWidth: 130,
    minHeight: 92,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
  },
  inner: {
    flex: 1,
    padding: spacing.sm + 4,
    justifyContent: 'space-between',
  },
  value: {
    fontWeight: '900',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  title: {
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.xs,
  },
});
