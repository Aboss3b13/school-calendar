import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: background,
          borderColor,
          padding: compact ? 12 : 16,
        },
      ]}
    >
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: textColor }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
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
