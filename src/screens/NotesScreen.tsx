import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import SignatureScreen from 'react-native-signature-canvas';
import dayjs from 'dayjs';
import { useAppContext } from '../context/AppContext';
import { NoteChecklistItem, NoteType } from '../types/models';
import InfoWidget from '../components/InfoWidget';
import { shadows, spacing, radii } from '../theme/theme';

type NotesSortMode = 'recent' | 'title';
type NoteTypeFilter = 'all' | NoteType;

const noteColors = ['#60A5FA', '#A78BFA', '#10B981', '#F59E0B', '#F43F5E'];

function createChecklistItem(text: string): NoteChecklistItem {
  return {
    id: `check_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
    text,
    done: false,
  };
}

export default function NotesScreen() {
  const { t } = useTranslation();
  const {
    data,
    colors,
    isDark,
    addNote,
    togglePinNote,
    toggleFavoriteNote,
    toggleChecklistItem,
    deleteNote,
    fontScaleMultiplier,
  } = useAppContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [pinned, setPinned] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [inkData, setInkData] = useState<string | undefined>();
  const [notebook, setNotebook] = useState('School');
  const [section, setSection] = useState('General');
  const [noteColor, setNoteColor] = useState(noteColors[0]);
  const [checklistInput, setChecklistInput] = useState('');
  const [draftChecklist, setDraftChecklist] = useState<NoteChecklistItem[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotebook, setSelectedNotebook] = useState('all');
  const [sortMode, setSortMode] = useState<NotesSortMode>('recent');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<NoteTypeFilter>('all');

  const signatureRef = useRef<any>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  const borderCol = isDark ? '#334155' : '#E2E8F0';
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  function animate() {
    if (data.settings.animationsEnabled) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }

  const notebooks = useMemo(
    () =>
      Array.from(new Set(data.notes.map((note) => note.notebook ?? 'School')))
        .filter(Boolean)
        .sort(),
    [data.notes],
  );

  const sections = useMemo(
    () =>
      Array.from(new Set(data.notes.map((note) => note.section ?? 'General')))
        .filter(Boolean)
        .sort(),
    [data.notes],
  );

  const filteredNotes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const notes = data.notes.filter((note) => {
      const notebookMatch = selectedNotebook === 'all' || (note.notebook ?? 'School') === selectedNotebook;
      const pinnedMatch = !pinnedOnly || note.pinned;
      const favMatch = !favoriteOnly || note.favorite;
      const typeMatch = typeFilter === 'all' || note.type === typeFilter;
      const queryMatch =
        !q ||
        [note.title, note.content, note.tags.join(' '), note.notebook ?? '', note.section ?? '', (note.checklist ?? []).map((i) => i.text).join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(q);
      return notebookMatch && pinnedMatch && favMatch && typeMatch && queryMatch;
    });

    return notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
      if (sortMode === 'title') return a.title.localeCompare(b.title);
      return dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf();
    });
  }, [data.notes, selectedNotebook, searchTerm, sortMode, pinnedOnly, favoriteOnly, typeFilter]);

  const notesBySection = useMemo(() => {
    return filteredNotes.reduce<Record<string, typeof filteredNotes>>((acc, note) => {
      const key = note.section ?? 'General';
      if (!acc[key]) acc[key] = [];
      acc[key].push(note);
      return acc;
    }, {});
  }, [filteredNotes]);

  const columns = width >= 1200 ? 3 : width >= 740 ? 2 : 1;

  function resetForm() {
    setTitle('');
    setContent('');
    setTags('');
    setPinned(false);
    setFavorite(false);
    setNotebook('School');
    setSection('General');
    setNoteColor(noteColors[0]);
    setChecklistInput('');
    setDraftChecklist([]);
    setInkData(undefined);
  }

  function applyTemplate(template: 'lecture' | 'exam' | 'brainstorm') {
    animate();

    if (template === 'lecture') {
      setNotebook('School');
      setSection('Lecture');
      setTitle('Lecture Summary');
      setContent('Key concepts:\n-\n\nQuestions:\n-\n\nAction items:\n-');
      setDraftChecklist([createChecklistItem('Review key terms'), createChecklistItem('Rewrite summary')]);
      return;
    }

    if (template === 'exam') {
      setNotebook('School');
      setSection('Exam Prep');
      setTitle('Exam Preparation');
      setContent('Topics to master:\n-\n\nWeak areas:\n-\n\nPlan:');
      setDraftChecklist([
        createChecklistItem('Solve 10 practice questions'),
        createChecklistItem('Memorize formulas'),
      ]);
      return;
    }

    setNotebook('Personal');
    setSection('Ideas');
    setTitle('Brainstorm');
    setContent('Idea dump:\n-\n\nNext experiments:\n-');
    setDraftChecklist([createChecklistItem('Cluster similar ideas')]);
  }

  function addDraftChecklistItem() {
    if (!checklistInput.trim()) return;
    animate();
    setDraftChecklist((prev) => [createChecklistItem(checklistInput.trim()), ...prev]);
    setChecklistInput('');
  }

  function removeDraftChecklistItem(itemId: string) {
    animate();
    setDraftChecklist((prev) => prev.filter((item) => item.id !== itemId));
  }

  function save() {
    if (!title.trim()) return;

    const type: NoteType = inkData && content.trim() ? 'mixed' : inkData ? 'ink' : 'typed';

    addNote({
      title: title.trim(),
      content: content.trim(),
      inkDataUrl: inkData,
      tags: tags.split(',').map((i) => i.trim()).filter(Boolean),
      pinned,
      favorite,
      type,
      notebook: notebook.trim() || 'School',
      section: section.trim() || 'General',
      color: noteColor,
      checklist: draftChecklist,
    });

    resetForm();
    setModalVisible(false);
  }

  /* ── Chip helper ─────────────────────────────── */
  function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.chip,
          {
            backgroundColor: active ? `${colors.accent}18` : 'transparent',
            borderColor: active ? colors.accent : borderCol,
          },
        ]}
      >
        <Text style={{ color: active ? colors.accent : colors.text, fontWeight: active ? '800' : '600', fontSize: 13 }}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}>
        {/* ── Header ──────────────────────────── */}
        <View style={styles.screenHeader}>
          <Text style={[styles.pageTitle, { color: colors.text, fontSize: 24 * fontScaleMultiplier }]}>
            {t('notes.title')}
          </Text>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [
              styles.fabBtn,
              { backgroundColor: colors.accent, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* ── Stat Widgets ────────────────────── */}
        <Animated.View style={[styles.widgetsRow, { opacity: fadeIn }]}>
          <InfoWidget
            title={t('notes.notebooksCount')}
            value={notebooks.length}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
          <InfoWidget
            title={t('notes.sectionsCount')}
            value={sections.length}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
          <InfoWidget
            title={t('notes.pinnedCount')}
            value={data.notes.filter((n) => n.pinned).length}
            accent={colors.accent}
            textColor={colors.text}
            subtleColor={colors.subtle}
            background={colors.card}
            borderColor={colors.border}
          />
        </Animated.View>

        {/* ── Search + Filters ────────────────── */}
        <View style={[styles.searchWrap, shadows.sm, { backgroundColor: colors.card }]}>
          <Ionicons name="search-outline" size={18} color={colors.subtle} style={{ marginRight: 8 }} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={t('notes.search')}
            placeholderTextColor={colors.subtle}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label={t('notes.sortRecent')} active={sortMode === 'recent'} onPress={() => { animate(); setSortMode('recent'); }} />
          <Chip label={t('notes.sortTitle')} active={sortMode === 'title'} onPress={() => { animate(); setSortMode('title'); }} />
          <View style={styles.chipDivider} />
          <Chip label={t('notes.pinnedOnly')} active={pinnedOnly} onPress={() => { animate(); setPinnedOnly((v) => !v); }} />
          <Chip label={t('notes.favorite')} active={favoriteOnly} onPress={() => { animate(); setFavoriteOnly((v) => !v); }} />
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(['all', 'typed', 'ink', 'mixed'] as NoteTypeFilter[]).map((tp) => (
            <Chip key={tp} label={tp === 'all' ? 'All' : tp} active={typeFilter === tp} onPress={() => { animate(); setTypeFilter(tp); }} />
          ))}
          <View style={styles.chipDivider} />
          <Chip label={t('notes.allNotebooks')} active={selectedNotebook === 'all'} onPress={() => { animate(); setSelectedNotebook('all'); }} />
          {notebooks.map((nb) => (
            <Chip key={nb} label={nb} active={selectedNotebook === nb} onPress={() => { animate(); setSelectedNotebook(nb); }} />
          ))}
        </ScrollView>

        {/* ── Notes Grid ──────────────────────── */}
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color={colors.subtle} />
            <Text style={{ color: colors.subtle, marginTop: 10, fontWeight: '600' }}>{t('notes.noNotes')}</Text>
          </View>
        ) : (
          Object.entries(notesBySection).map(([sectionName, sectionNotes]) => (
            <View key={sectionName} style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 17 * fontScaleMultiplier }]}>
                {sectionName}
              </Text>
              <View style={styles.notesGrid}>
                {sectionNotes.map((note) => (
                  <View
                    key={note.id}
                    style={[
                      styles.noteCard,
                      shadows.sm,
                      {
                        backgroundColor: colors.card,
                        width: `${100 / columns - (columns === 1 ? 0 : 2)}%`,
                        borderLeftWidth: 4,
                        borderLeftColor: note.color ?? colors.accent,
                      },
                    ]}
                  >
                    <View style={styles.noteHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.noteTitle, { color: colors.text, fontSize: 15 * fontScaleMultiplier }]} numberOfLines={1}>
                          {note.title}
                        </Text>
                        <Text style={{ color: colors.subtle, fontSize: 11 }}>
                          {dayjs(note.updatedAt).format('DD.MM.YY HH:mm')} · {note.type}
                        </Text>
                      </View>
                      <View style={styles.noteActionRow}>
                        <Pressable onPress={() => { animate(); toggleFavoriteNote(note.id); }} style={styles.iconBtn}>
                          <Ionicons name={note.favorite ? 'star' : 'star-outline'} size={18} color={note.favorite ? '#F59E0B' : colors.subtle} />
                        </Pressable>
                        <Pressable onPress={() => { animate(); togglePinNote(note.id); }} style={styles.iconBtn}>
                          <Ionicons name={note.pinned ? 'pin' : 'pin-outline'} size={18} color={note.pinned ? colors.accent : colors.subtle} />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={[styles.metaChip, { backgroundColor: `${note.color ?? colors.accent}15` }]}>
                        <Text style={{ color: note.color ?? colors.accent, fontSize: 11, fontWeight: '700' }}>
                          {note.notebook ?? 'School'}
                        </Text>
                      </View>
                      <View style={[styles.metaChip, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Text style={{ color: colors.subtle, fontSize: 11, fontWeight: '600' }}>{note.section ?? 'General'}</Text>
                      </View>
                    </View>

                    {note.content ? (
                      <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }} numberOfLines={4}>
                        {note.content}
                      </Text>
                    ) : null}

                    {(note.checklist ?? []).length > 0 ? (
                      <View style={styles.checklistWrap}>
                        {(note.checklist ?? []).map((item) => (
                          <Pressable key={item.id} onPress={() => { animate(); toggleChecklistItem(note.id, item.id); }} style={styles.checkRow}>
                            <Ionicons name={item.done ? 'checkbox' : 'square-outline'} size={18} color={item.done ? colors.accent : colors.subtle} />
                            <Text style={{ color: colors.text, textDecorationLine: item.done ? 'line-through' : 'none', fontSize: 13, marginLeft: 6 }}>
                              {item.text}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}

                    {note.inkDataUrl ? (
                      <View style={styles.inkBadge}>
                        <Ionicons name="brush-outline" size={14} color={colors.subtle} />
                        <Text style={{ color: colors.subtle, fontSize: 12, marginLeft: 4 }}>Handwriting</Text>
                      </View>
                    ) : null}

                    {note.tags.length > 0 ? (
                      <Text style={{ color: colors.subtle, fontSize: 12 }}>#{note.tags.join(' #')}</Text>
                    ) : null}

                    <Pressable
                      onPress={() => { animate(); deleteNote(note.id); }}
                      style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.6 : 1 }]}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>{t('common.delete')}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Modal ──────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: 22 * fontScaleMultiplier }]}>
                {t('notes.addNote')}
              </Text>
              <Pressable onPress={() => { resetForm(); setModalVisible(false); }}>
                <Ionicons name="close-circle" size={28} color={colors.subtle} />
              </Pressable>
            </View>

            {/* Templates */}
            <Text style={[styles.label, { color: colors.text }]}>{t('notes.templates')}</Text>
            <View style={styles.chipRow}>
              <Pressable onPress={() => applyTemplate('lecture')} style={[styles.templateBtn, shadows.sm, { backgroundColor: colors.card }]}>
                <Ionicons name="school-outline" size={16} color={colors.accent} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 6, fontSize: 13 }}>{t('notes.templateLecture')}</Text>
              </Pressable>
              <Pressable onPress={() => applyTemplate('exam')} style={[styles.templateBtn, shadows.sm, { backgroundColor: colors.card }]}>
                <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 6, fontSize: 13 }}>{t('notes.templateExam')}</Text>
              </Pressable>
              <Pressable onPress={() => applyTemplate('brainstorm')} style={[styles.templateBtn, shadows.sm, { backgroundColor: colors.card }]}>
                <Ionicons name="bulb-outline" size={16} color={colors.accent} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 6, fontSize: 13 }}>{t('notes.templateBrainstorm')}</Text>
              </Pressable>
            </View>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('notes.noteTitle')}
              placeholderTextColor={colors.subtle}
              style={[styles.input, { borderColor: borderCol, color: colors.text, fontSize: 17, fontWeight: '700' }]}
            />

            <View style={styles.row}>
              <TextInput
                value={notebook}
                onChangeText={setNotebook}
                placeholder={t('notes.notebook')}
                placeholderTextColor={colors.subtle}
                style={[styles.input, styles.flex1, { borderColor: borderCol, color: colors.text }]}
              />
              <TextInput
                value={section}
                onChangeText={setSection}
                placeholder={t('notes.section')}
                placeholderTextColor={colors.subtle}
                style={[styles.input, styles.flex1, { borderColor: borderCol, color: colors.text }]}
              />
            </View>

            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={t('notes.typedText')}
              placeholderTextColor={colors.subtle}
              style={[styles.input, styles.bigInput, { borderColor: borderCol, color: colors.text }]}
              multiline
            />

            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder={t('notes.tags')}
              placeholderTextColor={colors.subtle}
              style={[styles.input, { borderColor: borderCol, color: colors.text }]}
            />

            {/* Color dots */}
            <Text style={[styles.label, { color: colors.text }]}>{t('notes.color')}</Text>
            <View style={styles.colorRow}>
              {noteColors.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNoteColor(c)}
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor: c,
                      borderWidth: noteColor === c ? 3 : 0,
                      borderColor: colors.text,
                      transform: [{ scale: noteColor === c ? 1.15 : 1 }],
                    },
                  ]}
                />
              ))}
            </View>

            {/* Switches */}
            <View style={styles.switchRow}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{t('notes.pin')}</Text>
              <Switch value={pinned} onValueChange={setPinned} trackColor={{ true: colors.accent }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{t('notes.favorite')}</Text>
              <Switch value={favorite} onValueChange={setFavorite} trackColor={{ true: colors.accent }} />
            </View>

            {/* Checklist */}
            <Text style={[styles.label, { color: colors.text }]}>{t('notes.checklist')}</Text>
            <View style={styles.row}>
              <TextInput
                value={checklistInput}
                onChangeText={setChecklistInput}
                placeholder={t('notes.newChecklistItem')}
                placeholderTextColor={colors.subtle}
                style={[styles.input, styles.flex1, { borderColor: borderCol, color: colors.text }]}
              />
              <Pressable onPress={addDraftChecklistItem} style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
                <Ionicons name="add" size={20} color="#fff" />
              </Pressable>
            </View>

            {draftChecklist.map((item) => (
              <View key={item.id} style={[styles.draftRow, shadows.sm, { backgroundColor: colors.card }]}>
                <Ionicons name="checkbox-outline" size={18} color={colors.accent} />
                <Text style={{ color: colors.text, flex: 1, marginLeft: 8, fontSize: 14 }}>{item.text}</Text>
                <Pressable onPress={() => removeDraftChecklistItem(item.id)}>
                  <Ionicons name="close" size={18} color="#EF4444" />
                </Pressable>
              </View>
            ))}

            {/* Handwriting */}
            <Text style={[styles.label, { color: colors.text }]}>{t('notes.handwriting')}</Text>
            <View style={[styles.signatureWrap, shadows.sm, { backgroundColor: colors.card }]}>
              <SignatureScreen
                ref={signatureRef}
                onOK={(value) => setInkData(value)}
                onEmpty={() => setInkData(undefined)}
                autoClear={false}
                webStyle={`
                  .m-signature-pad--footer { display: none; }
                  body,html { height: 100%; }
                  .m-signature-pad { box-shadow: none; border: none; height: 100%; }
                `}
              />
            </View>

            <View style={styles.row}>
              <Pressable onPress={() => signatureRef.current?.clearSignature()} style={[styles.outlineBtn, { borderColor: borderCol }]}>
                <Ionicons name="refresh-outline" size={16} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 6 }}>{t('notes.clearInk')}</Text>
              </Pressable>
              <Pressable onPress={() => signatureRef.current?.readSignature()} style={[styles.outlineBtn, { borderColor: borderCol }]}>
                <Ionicons name="camera-outline" size={16} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 6 }}>Capture</Text>
              </Pressable>
            </View>

            {/* Save / Cancel */}
            <View style={[styles.row, { marginTop: spacing.sm }]}>
              <Pressable
                onPress={() => { resetForm(); setModalVisible(false); }}
                style={[styles.outlineBtn, { borderColor: borderCol, flex: 1 }]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={save}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: colors.accent, flex: 1, opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>{t('notes.save')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.sm + 2,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pageTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  fabBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...((shadows.md) as any),
  },
  widgetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipDivider: {
    width: 1,
    backgroundColor: '#94A3B8',
    opacity: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  sectionBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  noteCard: {
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    gap: spacing.sm,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noteActionRow: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 4,
  },
  noteTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  checklistWrap: {
    gap: 5,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  /* Modal */
  modalContent: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
    gap: spacing.sm + 4,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  label: {
    fontWeight: '800',
    fontSize: 14,
    marginTop: spacing.xs,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radii.sm + 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  bigInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  flex1: { flex: 1 },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.sm + 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  signatureWrap: {
    height: 240,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderRadius: radii.sm + 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    borderRadius: radii.sm + 4,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
