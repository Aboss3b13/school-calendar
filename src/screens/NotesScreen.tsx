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
import { useTranslation } from 'react-i18next';
import SignatureScreen from 'react-native-signature-canvas';
import dayjs from 'dayjs';
import { useAppContext } from '../context/AppContext';
import { NoteChecklistItem, NoteType } from '../types/models';
import InfoWidget from '../components/InfoWidget';

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
  const panelFade = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    Animated.timing(panelFade, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [panelFade]);

  function animateLayout() {
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
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const notes = data.notes.filter((note) => {
      const notebookMatch = selectedNotebook === 'all' || (note.notebook ?? 'School') === selectedNotebook;
      const pinnedMatch = !pinnedOnly || note.pinned;
      const favoriteMatch = !favoriteOnly || note.favorite;
      const typeMatch = typeFilter === 'all' || note.type === typeFilter;
      const queryMatch =
        !normalizedQuery ||
        [
          note.title,
          note.content,
          note.tags.join(' '),
          note.notebook ?? '',
          note.section ?? '',
          (note.checklist ?? []).map((item) => item.text).join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return notebookMatch && pinnedMatch && favoriteMatch && typeMatch && queryMatch;
    });

    return notes.sort((left, right) => {
      if (left.pinned !== right.pinned) {
        return Number(right.pinned) - Number(left.pinned);
      }
      if (sortMode === 'title') {
        return left.title.localeCompare(right.title);
      }
      return dayjs(right.updatedAt).valueOf() - dayjs(left.updatedAt).valueOf();
    });
  }, [data.notes, selectedNotebook, searchTerm, sortMode, pinnedOnly, favoriteOnly, typeFilter]);

  const notesBySection = useMemo(() => {
    return filteredNotes.reduce<Record<string, typeof filteredNotes>>((acc, note) => {
      const key = note.section ?? 'General';
      if (!acc[key]) {
        acc[key] = [];
      }
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
    animateLayout();

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
    if (!checklistInput.trim()) {
      return;
    }
    animateLayout();
    setDraftChecklist((prev) => [createChecklistItem(checklistInput.trim()), ...prev]);
    setChecklistInput('');
  }

  function removeDraftChecklistItem(itemId: string) {
    animateLayout();
    setDraftChecklist((prev) => prev.filter((item) => item.id !== itemId));
  }

  function save() {
    if (!title.trim()) {
      return;
    }

    const type: NoteType = inkData && content.trim() ? 'mixed' : inkData ? 'ink' : 'typed';

    addNote({
      title: title.trim(),
      content: content.trim(),
      inkDataUrl: inkData,
      tags: tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => setModalVisible(true)} style={[styles.addBtn, { backgroundColor: colors.accent }]}> 
          <Text style={styles.addText}>{t('notes.addNote')}</Text>
        </Pressable>

        <Animated.View style={{ opacity: panelFade }}>
          <View style={styles.widgetsHeader}>
            <Text style={[styles.widgetsTitle, { color: colors.text, fontSize: 16 * fontScaleMultiplier }]}>
              {t('notes.widgets')}
            </Text>
          </View>
          <View style={styles.widgetsRow}>
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
              value={data.notes.filter((note) => note.pinned).length}
              accent={colors.accent}
              textColor={colors.text}
              subtleColor={colors.subtle}
              background={colors.card}
              borderColor={colors.border}
            />
          </View>
        </Animated.View>

        <View style={[styles.controlsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={t('notes.search')}
            placeholderTextColor={colors.subtle}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />

          <View style={styles.filterRowWrap}>
            <Pressable
              onPress={() => {
                animateLayout();
                setSortMode('recent');
              }}
              style={[
                styles.filterChip,
                {
                  borderColor: sortMode === 'recent' ? colors.accent : colors.border,
                  backgroundColor: sortMode === 'recent' ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t('notes.sortRecent')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                animateLayout();
                setSortMode('title');
              }}
              style={[
                styles.filterChip,
                {
                  borderColor: sortMode === 'title' ? colors.accent : colors.border,
                  backgroundColor: sortMode === 'title' ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t('notes.sortTitle')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                animateLayout();
                setPinnedOnly((value) => !value);
              }}
              style={[
                styles.filterChip,
                {
                  borderColor: pinnedOnly ? colors.accent : colors.border,
                  backgroundColor: pinnedOnly ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t('notes.pinnedOnly')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                animateLayout();
                setFavoriteOnly((value) => !value);
              }}
              style={[
                styles.filterChip,
                {
                  borderColor: favoriteOnly ? colors.accent : colors.border,
                  backgroundColor: favoriteOnly ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t('notes.favorite')}</Text>
            </Pressable>
          </View>

          <View style={styles.filterRowWrap}>
            {(['all', 'typed', 'ink', 'mixed'] as NoteTypeFilter[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  animateLayout();
                  setTypeFilter(type);
                }}
                style={[
                  styles.filterChip,
                  {
                    borderColor: typeFilter === type ? colors.accent : colors.border,
                    backgroundColor: typeFilter === type ? `${colors.accent}22` : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: colors.text }}>{type}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notebookChipRow}>
            <Pressable
              onPress={() => {
                animateLayout();
                setSelectedNotebook('all');
              }}
              style={[
                styles.filterChip,
                {
                  borderColor: selectedNotebook === 'all' ? colors.accent : colors.border,
                  backgroundColor: selectedNotebook === 'all' ? `${colors.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{t('notes.allNotebooks')}</Text>
            </Pressable>
            {notebooks.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  animateLayout();
                  setSelectedNotebook(item);
                }}
                style={[
                  styles.filterChip,
                  {
                    borderColor: selectedNotebook === item ? colors.accent : colors.border,
                    backgroundColor: selectedNotebook === item ? `${colors.accent}22` : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: colors.text }}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {filteredNotes.length === 0 ? (
          <Text style={{ color: colors.subtle, paddingHorizontal: 4 }}>{t('notes.noNotes')}</Text>
        ) : (
          Object.entries(notesBySection).map(([sectionName, sectionNotes]) => (
            <View key={sectionName} style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 16 * fontScaleMultiplier }]}>
                {sectionName}
              </Text>
              <View style={styles.notesGrid}>
                {sectionNotes.map((note) => (
                  <View
                    key={note.id}
                    style={[
                      styles.noteCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        width: `${100 / columns - (columns === 1 ? 0 : 2)}%`,
                        borderLeftWidth: 5,
                        borderLeftColor: note.color ?? colors.accent,
                      },
                    ]}
                  >
                    <View style={styles.noteHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.noteTitle, { color: colors.text, fontSize: 16 * fontScaleMultiplier }]}>
                          {note.title}
                        </Text>
                        <Text style={{ color: colors.subtle, fontSize: 12 * fontScaleMultiplier }}>
                          {dayjs(note.updatedAt).format('DD.MM.YYYY HH:mm')} • {note.type}
                        </Text>
                      </View>
                      <View style={styles.noteActionRow}>
                        <Pressable
                          onPress={() => {
                            animateLayout();
                            toggleFavoriteNote(note.id);
                          }}
                          style={[styles.iconBtn, { borderColor: colors.border }]}
                        >
                          <Text>{note.favorite ? '⭐' : '☆'}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            animateLayout();
                            togglePinNote(note.id);
                          }}
                          style={[styles.iconBtn, { borderColor: colors.border }]}
                        >
                          <Text>{note.pinned ? '📌' : '📍'}</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.metaChipsRow}>
                      <View style={[styles.metaChip, { borderColor: colors.border }]}> 
                        <Text style={{ color: colors.subtle }}>{note.notebook ?? 'School'}</Text>
                      </View>
                      <View style={[styles.metaChip, { borderColor: colors.border }]}> 
                        <Text style={{ color: colors.subtle }}>{note.section ?? 'General'}</Text>
                      </View>
                    </View>

                    {note.content ? <Text style={{ color: colors.text }}>{note.content}</Text> : null}

                    {(note.checklist ?? []).length > 0 ? (
                      <View style={styles.checklistWrap}>
                        {(note.checklist ?? []).map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => {
                              animateLayout();
                              toggleChecklistItem(note.id, item.id);
                            }}
                            style={styles.checkRow}
                          >
                            <Text style={{ color: colors.accent }}>{item.done ? '☑' : '☐'}</Text>
                            <Text
                              style={{
                                color: colors.text,
                                textDecorationLine: item.done ? 'line-through' : 'none',
                              }}
                            >
                              {item.text}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}

                    {note.inkDataUrl ? <Text style={{ color: colors.subtle }}>✍️ Handwriting attached</Text> : null}
                    {note.tags.length > 0 ? (
                      <Text style={{ color: colors.subtle }}>#{note.tags.join(' #')}</Text>
                    ) : null}

                    <Pressable
                      onPress={() => {
                        animateLayout();
                        deleteNote(note.id);
                      }}
                      style={[styles.deleteBtn, { borderColor: colors.border }]}
                    >
                      <Text style={{ color: colors.text }}>{t('common.delete')}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: colors.text, fontSize: 24 * fontScaleMultiplier }]}>{t('notes.title')}</Text>

          <Text style={{ color: colors.text, fontWeight: '800' }}>{t('notes.templates')}</Text>
          <View style={styles.filterRowWrap}>
            <Pressable onPress={() => applyTemplate('lecture')} style={[styles.filterChip, { borderColor: colors.border }]}> 
              <Text style={{ color: colors.text }}>{t('notes.templateLecture')}</Text>
            </Pressable>
            <Pressable onPress={() => applyTemplate('exam')} style={[styles.filterChip, { borderColor: colors.border }]}> 
              <Text style={{ color: colors.text }}>{t('notes.templateExam')}</Text>
            </Pressable>
            <Pressable onPress={() => applyTemplate('brainstorm')} style={[styles.filterChip, { borderColor: colors.border }]}> 
              <Text style={{ color: colors.text }}>{t('notes.templateBrainstorm')}</Text>
            </Pressable>
          </View>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('notes.noteTitle')}
            placeholderTextColor={colors.subtle}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />

          <View style={styles.modalGridRow}>
            <TextInput
              value={notebook}
              onChangeText={setNotebook}
              placeholder={t('notes.notebook')}
              placeholderTextColor={colors.subtle}
              style={[styles.input, styles.gridInput, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              value={section}
              onChangeText={setSection}
              placeholder={t('notes.section')}
              placeholderTextColor={colors.subtle}
              style={[styles.input, styles.gridInput, { borderColor: colors.border, color: colors.text }]}
            />
          </View>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={t('notes.typedText')}
            placeholderTextColor={colors.subtle}
            style={[styles.input, styles.bigInput, { borderColor: colors.border, color: colors.text }]}
            multiline
          />

          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder={t('notes.tags')}
            placeholderTextColor={colors.subtle}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />

          <Text style={{ color: colors.text, fontWeight: '800' }}>{t('notes.color')}</Text>
          <View style={styles.colorRow}>
            {noteColors.map((item) => (
              <Pressable
                key={item}
                onPress={() => setNoteColor(item)}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: item,
                    borderColor: noteColor === item ? colors.text : 'transparent',
                    borderWidth: noteColor === item ? 2 : 0,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.pinRow}>
            <Text style={{ color: colors.text }}>{t('notes.pin')}</Text>
            <Switch value={pinned} onValueChange={setPinned} trackColor={{ true: colors.accent }} />
          </View>
          <View style={styles.pinRow}>
            <Text style={{ color: colors.text }}>{t('notes.favorite')}</Text>
            <Switch value={favorite} onValueChange={setFavorite} trackColor={{ true: colors.accent }} />
          </View>

          <Text style={{ color: colors.text, fontWeight: '800' }}>{t('notes.checklist')}</Text>
          <View style={styles.modalGridRow}>
            <TextInput
              value={checklistInput}
              onChangeText={setChecklistInput}
              placeholder={t('notes.newChecklistItem')}
              placeholderTextColor={colors.subtle}
              style={[styles.input, styles.gridInput, { borderColor: colors.border, color: colors.text }]}
            />
            <Pressable onPress={addDraftChecklistItem} style={[styles.secondaryBtn, { borderColor: colors.border }]}> 
              <Text style={{ color: colors.text }}>{t('notes.addChecklistItem')}</Text>
            </Pressable>
          </View>

          {draftChecklist.map((item) => (
            <View key={item.id} style={[styles.draftRow, { borderColor: colors.border }]}> 
              <Text style={{ color: colors.text, flex: 1 }}>{item.text}</Text>
              <Pressable onPress={() => removeDraftChecklistItem(item.id)}>
                <Text style={{ color: colors.text }}>✕</Text>
              </Pressable>
            </View>
          ))}

          <Text style={[styles.handwritingTitle, { color: colors.text }]}>{t('notes.handwriting')}</Text>
          <View style={[styles.signatureWrap, { borderColor: colors.border, backgroundColor: colors.card }]}> 
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

          <View style={styles.rowBtns}>
            <Pressable onPress={() => signatureRef.current?.clearSignature()} style={[styles.actionBtn, { borderColor: colors.border }]}> 
              <Text style={{ color: colors.text }}>{t('notes.clearInk')}</Text>
            </Pressable>
            <Pressable onPress={() => signatureRef.current?.readSignature()} style={[styles.actionBtn, { borderColor: colors.border }]}> 
              <Text style={{ color: colors.text }}>Capture Ink</Text>
            </Pressable>
          </View>

          <View style={styles.rowBtns}>
            <Pressable
              onPress={() => {
                resetForm();
                setModalVisible(false);
              }}
              style={[styles.actionBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text }}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={save} style={[styles.actionBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}> 
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t('notes.save')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  addBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  widgetsHeader: {
    marginTop: 4,
  },
  widgetsTitle: {
    fontWeight: '800',
  },
  widgetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlsCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  filterRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  notebookChipRow: {
    gap: 8,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '900',
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    borderWidth: 1,
    borderRadius: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitle: {
    fontWeight: '800',
  },
  metaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  checklistWrap: {
    gap: 6,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  modalTitle: {
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalGridRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  gridInput: {
    flex: 1,
  },
  bigInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  draftRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handwritingTitle: {
    fontWeight: '700',
    fontSize: 15,
  },
  signatureWrap: {
    height: 260,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rowBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
