import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { shadows, radii, spacing } from '../theme/theme';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  background: string;
  textColor: string;
  borderColor: string;
  compact?: boolean;
  accentLeft?: string;
  children?: React.ReactNode;
}

export default function SectionCard({
  title,
  subtitle,
  background,
  textColor,
  borderColor,
  compact,
  accentLeft,
  children,
}: SectionCardProps) {
  const { data, fontScaleMultiplier } = useAppContext();
  const radius =
    data.settings.cardStyle === 'soft' ? radii.xl : data.settings.cardStyle === 'glass' ? radii.lg : radii.md + 4;
  const computedBackground = data.settings.cardStyle === 'glass' ? `${background}E8` : background;

  return (
    <View
      style={[
        styles.card,
        shadows.md,
        {
          backgroundColor: computedBackground,
          borderColor: 'transparent',
          padding: compact ? spacing.sm + 4 : spacing.md,
          borderRadius: radius,
          borderLeftWidth: accentLeft ? 4 : 0,
          borderLeftColor: accentLeft ?? 'transparent',
        },
      ]}
    >
      <Text style={[styles.title, { color: textColor, fontSize: 17 * fontScaleMultiplier }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: textColor, fontSize: 13 * fontScaleMultiplier }]}>{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm + 4,
    gap: spacing.sm + 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
    fontWeight: '500',
  },
});
