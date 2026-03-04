import { Platform } from 'react-native';
import { AccentKey } from '../types/models';

/* ── colour palettes ─────────────────────────────────────────── */

export const accentPalette: Record<AccentKey, string> = {
  blue: '#3B82F6',
  purple: '#8B5CF6',
  emerald: '#10B981',
  rose: '#F43F5E',
  amber: '#F59E0B',
};

/** Lighter tints of each accent for subtle backgrounds */
export const accentTint: Record<AccentKey, string> = {
  blue: '#DBEAFE',
  purple: '#EDE9FE',
  emerald: '#D1FAE5',
  rose: '#FFE4E6',
  amber: '#FEF3C7',
};

export const accentTintDark: Record<AccentKey, string> = {
  blue: '#1E3A5F',
  purple: '#2E1065',
  emerald: '#064E3B',
  rose: '#4C0519',
  amber: '#451A03',
};

export const neutralPalette = {
  lightBg: '#F1F5F9',
  lightCard: '#FFFFFF',
  darkBg: '#0F172A',
  darkCard: '#1E293B',
  lightText: '#0F172A',
  darkText: '#F1F5F9',
  subtleLight: '#64748B',
  subtleDark: '#94A3B8',
  borderLight: '#E2E8F0',
  borderDark: '#334155',
};

/* ── shadows ─────────────────────────────────────────────────── */

export const shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 2 },
    default: {},
  }) as Record<string, unknown>,
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    android: { elevation: 4 },
    default: {},
  }) as Record<string, unknown>,
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
    android: { elevation: 8 },
    default: {},
  }) as Record<string, unknown>,
};

/* ── spacing scale (4-point grid) ────────────────────────────── */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/* ── radii ───────────────────────────────────────────────────── */

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/* ── priority colours ────────────────────────────────────────── */

export const priorityColors: Record<string, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
};

/* ── grade colour helper (Swiss 1-6 scale) ───────────────────── */

export function gradeColor(grade: number): string {
  if (grade >= 5) return '#22C55E';
  if (grade >= 4) return '#F59E0B';
  return '#EF4444';
}
