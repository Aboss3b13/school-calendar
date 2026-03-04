import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { AccentKey, AppLanguage, CardStyle, FontScale, ThemeMode } from '../types/models';
import { shadows, spacing, radii } from '../theme/theme';

const accents: AccentKey[] = ['blue', 'purple', 'emerald', 'rose', 'amber'];
const accentColors: Record<AccentKey, string> = {
  blue: '#3B82F6',
  purple: '#8B5CF6',
  emerald: '#10B981',
  rose: '#F43F5E',
  amber: '#F59E0B',
};
const modes: ThemeMode[] = ['system', 'light', 'dark'];
const languages: AppLanguage[] = ['en', 'de'];
const cardStyles: CardStyle[] = ['rounded', 'soft', 'glass'];
const fontScales: FontScale[] = ['small', 'normal', 'large'];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { data, colors, isDark, updateSettings, syncCalendar, fontScaleMultiplier } = useAppContext();
  const insets = useSafeAreaInsets();

  const [iCalUrl, setICalUrl] = useState(data.settings.iCalUrl);
  const [isSavingCalendar, setIsSavingCalendar] = useState(false);

  const borderCol = isDark ? '#334155' : '#E2E8F0';

  useEffect(() => {
    setICalUrl(data.settings.iCalUrl);
  }, [data.settings.iCalUrl]);

  const cardRadius = useMemo(
    () => (data.settings.cardStyle === 'soft' ? 24 : data.settings.cardStyle === 'glass' ? 20 : 16),
    [data.settings.cardStyle],
  );
  const cardPadding = data.settings.compactMode ? 10 : 12;

  async function onSaveCalendarSettings() {
    setIsSavingCalendar(true);
    try {
      updateSettings({ iCalUrl });
      await syncCalendar(iCalUrl);
    } finally {
      setIsSavingCalendar(false);
    }
  }

  function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.chip,
          { backgroundColor: active ? `${colors.accent}18` : 'transparent', borderColor: active ? colors.accent : borderCol },
        ]}
      >
        <Text style={{ color: active ? colors.accent : colors.text, fontWeight: active ? '800' : '600', fontSize: 13 }}>{label}</Text>
      </Pressable>
    );
  }

  function SectionHeader({ icon, label }: { icon: string; label: string }) {
    return (
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={17} color={colors.accent} />
        <Text style={[styles.sectionLabel, { color: colors.text, fontSize: 15 * fontScaleMultiplier }]}>{label}</Text>
      </View>
    );
  }

  function SettingSwitch({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
    return (
      <View style={styles.switchRow}>
        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
        <Switch value={value} onValueChange={onToggle} trackColor={{ true: colors.accent }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}>
        {/* ── Header ─────────────────────── */}
        <Text style={[styles.pageTitle, { color: colors.text, fontSize: 24 * fontScaleMultiplier }]}>
          {t('settings.title')}
        </Text>

        {/* ── Appearance ─────────────────── */}
        <View style={[styles.card, shadows.md, { backgroundColor: colors.card }]}>
          <SectionHeader icon="color-palette-outline" label={t('settings.theme')} />

          <Text style={[styles.subLabel, { color: colors.subtle }]}>{t('settings.language')}</Text>
          <View style={styles.chipRow}>
            {languages.map((lang) => (
              <Chip key={lang} label={lang === 'en' ? t('settings.english') : t('settings.german')} active={data.settings.language === lang} onPress={() => updateSettings({ language: lang })} />
            ))}
          </View>

          <Text style={[styles.subLabel, { color: colors.subtle }]}>{t('settings.theme')}</Text>
          <View style={styles.chipRow}>
            {modes.map((m) => (
              <Chip key={m} label={t(`settings.${m}`)} active={data.settings.themeMode === m} onPress={() => updateSettings({ themeMode: m })} />
            ))}
          </View>

          <Text style={[styles.subLabel, { color: colors.subtle }]}>{t('settings.accent')}</Text>
          <View style={styles.chipRow}>
            {accents.map((a) => (
              <Pressable key={a} onPress={() => updateSettings({ accentKey: a })} style={[styles.colorDot, { backgroundColor: accentColors[a], borderWidth: data.settings.accentKey === a ? 3 : 0, borderColor: colors.text, transform: [{ scale: data.settings.accentKey === a ? 1.15 : 1 }] }]} />
            ))}
          </View>

          <Text style={[styles.subLabel, { color: colors.subtle }]}>{t('settings.cardStyle')}</Text>
          <View style={styles.chipRow}>
            {cardStyles.map((s) => (
              <Chip key={s} label={t(`settings.${s}`)} active={data.settings.cardStyle === s} onPress={() => updateSettings({ cardStyle: s })} />
            ))}
          </View>

          <Text style={[styles.subLabel, { color: colors.subtle }]}>{t('settings.fontScale')}</Text>
          <View style={styles.chipRow}>
            {fontScales.map((sc) => (
              <Chip key={sc} label={t(`settings.${sc}`)} active={data.settings.fontScale === sc} onPress={() => updateSettings({ fontScale: sc })} />
            ))}
          </View>
        </View>

        {/* ── Toggles ────────────────────── */}
        <View style={[styles.card, shadows.sm, { backgroundColor: colors.card }]}>
          <SectionHeader icon="toggle-outline" label={t('settings.preferences') ?? 'Preferences'} />
          <SettingSwitch label={t('settings.compactMode')} value={data.settings.compactMode} onToggle={(v) => updateSettings({ compactMode: v })} />
          <SettingSwitch label={t('settings.animations')} value={data.settings.animationsEnabled} onToggle={(v) => updateSettings({ animationsEnabled: v })} />
          <SettingSwitch label={t('settings.homescreenWidgets')} value={data.settings.homescreenWidgets} onToggle={(v) => updateSettings({ homescreenWidgets: v })} />
        </View>

        {/* ── Preview ────────────────────── */}
        <View style={[styles.card, shadows.sm, { backgroundColor: colors.card }]}>
          <SectionHeader icon="eye-outline" label={t('settings.preview')} />
          <View
            style={[
              styles.previewCard,
              {
                borderRadius: cardRadius,
                backgroundColor: data.settings.cardStyle === 'glass' ? `${colors.accent}18` : `${colors.accent}0A`,
                padding: cardPadding + 4,
              },
            ]}
          >
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 * fontScaleMultiplier }}>{t('settings.previewTitle')}</Text>
            <Text style={{ color: colors.subtle, fontSize: 13 * fontScaleMultiplier }}>{t('settings.previewHint')}</Text>
          </View>
        </View>

        {/* ── iCal Sync ──────────────────── */}
        <View style={[styles.card, shadows.sm, { backgroundColor: colors.card }]}>
          <SectionHeader icon="cloud-download-outline" label={t('settings.iCalUrl')} />
          <TextInput
            value={iCalUrl}
            onChangeText={setICalUrl}
            placeholder={t('settings.iCalUrl')}
            placeholderTextColor={colors.subtle}
            style={[styles.input, { borderColor: borderCol, color: colors.text }]}
            multiline
          />
          <Pressable
            onPress={onSaveCalendarSettings}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.accent, opacity: pressed ? 0.88 : 1 }]}
          >
            <Ionicons name="sync-outline" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 6 }}>
              {isSavingCalendar ? t('common.loading') : t('settings.saveAndSync')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  pageTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm + 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionLabel: {
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subLabel: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  previewCard: {
    borderRadius: radii.md,
    gap: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radii.sm + 4,
    minHeight: 80,
    textAlignVertical: 'top',
    padding: 14,
    fontSize: 15,
  },
  primaryBtn: {
    borderRadius: radii.sm + 4,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
