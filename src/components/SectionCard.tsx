import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  background: string;
  textColor: string;
  borderColor: string;
  compact?: boolean;
  children?: React.ReactNode;
}

export default function SectionCard({
  title,
  subtitle,
  background,
  textColor,
  borderColor,
  compact,
  children,
}: SectionCardProps) {
  const { data, fontScaleMultiplier } = useAppContext();
  const radius = data.settings.cardStyle === 'soft' ? 24 : data.settings.cardStyle === 'glass' ? 20 : 18;
  const computedBackground = data.settings.cardStyle === 'glass' ? `${background}DD` : background;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: computedBackground,
          borderColor,
          padding: compact ? 12 : 16,
          borderRadius: radius,
        },
      ]}
    >
      <Text style={[styles.title, { color: textColor, fontSize: 16 * fontScaleMultiplier }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: textColor, fontSize: 13 * fontScaleMultiplier }]}>{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.72,
  },
});
