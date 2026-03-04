import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  Switch,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import SignatureScreen from 'react-native-signature-canvas';
import dayjs from 'dayjs';
import { useAppContext } from '../context/AppContext';
import { NoteType } from '../types/models';
import InfoWidget from '../components/InfoWidget';

type NotesSortMode = 'recent' | 'title';

export default function NotesScreen() {
  const { t } = useTranslation();
  const { data, colors, addNote, togglePinNote } = useAppContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [pinned, setPinned] = useState(false);
  const [inkData, setInkData] = useState<string | undefined>();
  const [notebook, setNotebook] = useState('School');
  const [section, setSection] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotebook, setSelectedNotebook] = useState('all');
  const [sortMode, setSortMode] = useState<NotesSortMode>('recent');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const signatureRef = useRef<any>(null);

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
      const queryMatch =
        !normalizedQuery ||
        [note.title, note.content, note.tags.join(' '), note.notebook ?? '', note.section ?? '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return notebookMatch && pinnedMatch && queryMatch;
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
  }, [data.notes, selectedNotebook, searchTerm, sortMode, pinnedOnly]);

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

  function resetForm() {
    setTitle('');
    setContent('');
    setTags('');
    setPinned(false);
    setNotebook('School');
    setSection('General');
    setInkData(undefined);
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
      type,
      notebook: notebook.trim() || 'School',
      section: section.trim() || 'General',
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

        <View style={styles.widgetsHeader}>
          <Text style={[styles.widgetsTitle, { color: colors.text }]}>{t('notes.widgets')}</Text>
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
              onPress={() => setSortMode('recent')}
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
              onPress={() => setSortMode('title')}
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
              onPress={() => setPinnedOnly((value) => !value)}
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
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notebookChipRow}>
            <Pressable
              onPress={() => setSelectedNotebook('all')}
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
                onPress={() => setSelectedNotebook(item)}
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{sectionName}</Text>
              <View style={styles.notesGrid}>
                {sectionNotes.map((note) => (
                  <View
                    key={note.id}
                    style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.noteHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
                        <Text style={{ color: colors.subtle, fontSize: 12 }}>
                          {dayjs(note.updatedAt).format('DD.MM.YYYY HH:mm')} • {note.type}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => togglePinNote(note.id)}
                        style={[styles.pinBtn, { borderColor: colors.border }]}
                      >
                        <Text style={{ color: colors.text }}>{note.pinned ? '📌' : '📍'}</Text>
                      </Pressable>
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
                    {note.inkDataUrl ? <Text style={{ color: colors.subtle }}>✍️ Handwriting attached</Text> : null}
                    {note.tags.length > 0 ? (
                      <Text style={{ color: colors.subtle }}>#{note.tags.join(' #')}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{t('notes.title')}</Text>

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

          <View style={styles.pinRow}>
            <Text style={{ color: colors.text }}>{t('notes.pin')}</Text>
            <Switch value={pinned} onValueChange={setPinned} trackColor={{ true: colors.accent }} />
          </View>

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
    fontSize: 16,
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
    fontSize: 16,
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
    width: '48.5%',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteTitle: {
    fontWeight: '800',
    fontSize: 16,
  },
  pinBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  modalContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 24,
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
  },
  gridInput: {
    flex: 1,
  },
  bigInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
