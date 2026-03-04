import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { AccentKey, AppLanguage, CardStyle, FontScale, ThemeMode } from '../types/models';

const accents: AccentKey[] = ['blue', 'purple', 'emerald', 'rose', 'amber'];
const modes: ThemeMode[] = ['system', 'light', 'dark'];
const languages: AppLanguage[] = ['en', 'de'];
const cardStyles: CardStyle[] = ['rounded', 'soft', 'glass'];
const fontScales: FontScale[] = ['small', 'normal', 'large'];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { data, colors, updateSettings, syncCalendar, fontScaleMultiplier } = useAppContext();

  const [iCalUrl, setICalUrl] = useState(data.settings.iCalUrl);
  const [isSavingCalendar, setIsSavingCalendar] = useState(false);

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: cardRadius, padding: cardPadding }]}> 
        <Text style={[styles.heading, { color: colors.text, fontSize: 15 * fontScaleMultiplier }]}>{t('settings.language')}</Text>
        <View style={styles.rowWrap}>
          {languages.map((lang) => (
            <Pressable
              key={lang}
              onPress={() => updateSettings({ language: lang })}
              style={[
                styles.chip,
                {
                  borderColor: data.settings.language === lang ? colors.accent : colors.border,
                  backgroundColor: data.settings.language === lang ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{lang === 'en' ? t('settings.english') : t('settings.german')}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.heading, { color: colors.text, fontSize: 15 * fontScaleMultiplier }]}>{t('settings.theme')}</Text>
        <View style={styles.rowWrap}>
          {modes.map((mode) => (
            <Pressable
              key={mode}
              onPress={() => updateSettings({ themeMode: mode })}
              style={[
                styles.chip,
                {
                  borderColor: data.settings.themeMode === mode ? colors.accent : colors.border,
                  backgroundColor: data.settings.themeMode === mode ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t(`settings.${mode}`)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.heading, { color: colors.text, fontSize: 15 * fontScaleMultiplier }]}>{t('settings.accent')}</Text>
        <View style={styles.rowWrap}>
          {accents.map((accent) => (
            <Pressable
              key={accent}
              onPress={() => updateSettings({ accentKey: accent })}
              style={[
                styles.colorCircle,
                {
                  backgroundColor:
                    accent === 'blue'
                      ? '#3B82F6'
                      : accent === 'purple'
                        ? '#8B5CF6'
                        : accent === 'emerald'
                          ? '#10B981'
                          : accent === 'rose'
                            ? '#F43F5E'
                            : '#F59E0B',
                  borderWidth: data.settings.accentKey === accent ? 3 : 0,
                  borderColor: colors.text,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={{ color: colors.text }}>{t('settings.compactMode')}</Text>
          <Switch
            value={data.settings.compactMode}
            onValueChange={(value) => updateSettings({ compactMode: value })}
            trackColor={{ true: colors.accent }}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={{ color: colors.text }}>{t('settings.animations')}</Text>
          <Switch
            value={data.settings.animationsEnabled}
            onValueChange={(value) => updateSettings({ animationsEnabled: value })}
            trackColor={{ true: colors.accent }}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={{ color: colors.text }}>{t('settings.homescreenWidgets')}</Text>
          <Switch
            value={data.settings.homescreenWidgets}
            onValueChange={(value) => updateSettings({ homescreenWidgets: value })}
            trackColor={{ true: colors.accent }}
          />
        </View>

        <Text style={[styles.heading, { color: colors.text, fontSize: 15 * fontScaleMultiplier }]}>{t('settings.cardStyle')}</Text>
        <View style={styles.rowWrap}>
          {cardStyles.map((style) => (
            <Pressable
              key={style}
              onPress={() => updateSettings({ cardStyle: style })}
              style={[
                styles.chip,
                {
                  borderColor: data.settings.cardStyle === style ? colors.accent : colors.border,
                  backgroundColor: data.settings.cardStyle === style ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t(`settings.${style}`)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.heading, { color: colors.text, fontSize: 15 * fontScaleMultiplier }]}>{t('settings.fontScale')}</Text>
        <View style={styles.rowWrap}>
          {fontScales.map((scale) => (
            <Pressable
              key={scale}
              onPress={() => updateSettings({ fontScale: scale })}
              style={[
                styles.chip,
                {
                  borderColor: data.settings.fontScale === scale ? colors.accent : colors.border,
                  backgroundColor: data.settings.fontScale === scale ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t(`settings.${scale}`)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.heading, { color: colors.text, fontSize: 15 * fontScaleMultiplier }]}>{t('settings.preview')}</Text>
        <View
          style={[
            styles.previewCard,
            {
              borderColor: colors.border,
              borderRadius: cardRadius,
              backgroundColor: data.settings.cardStyle === 'glass' ? `${colors.accent}18` : `${colors.accent}12`,
              padding: cardPadding,
            },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 * fontScaleMultiplier }}>
            {t('settings.previewTitle')}
          </Text>
          <Text style={{ color: colors.subtle, fontSize: 13 * fontScaleMultiplier }}>{t('settings.previewHint')}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: cardRadius, padding: cardPadding }]}> 
        <Text style={[styles.heading, { color: colors.text, fontSize: 15 * fontScaleMultiplier }]}>{t('settings.iCalUrl')}</Text>
        <TextInput
          value={iCalUrl}
          onChangeText={setICalUrl}
          placeholder={t('settings.iCalUrl')}
          placeholderTextColor={colors.subtle}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          multiline
        />
        <Pressable onPress={onSaveCalendarSettings} style={[styles.saveBtn, { backgroundColor: colors.accent }]}> 
          <Text style={{ color: '#fff', fontWeight: '800' }}>
            {isSavingCalendar ? t('common.loading') : t('settings.saveAndSync')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  heading: {
    fontSize: 15,
    fontWeight: '800',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    padding: 12,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  previewCard: {
    borderWidth: 1,
    gap: 6,
  },
});
