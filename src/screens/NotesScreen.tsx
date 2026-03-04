import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import SignatureScreen from 'react-native-signature-canvas';
import dayjs from 'dayjs';
import { useAppContext } from '../context/AppContext';
import { NoteType } from '../types/models';

export default function NotesScreen() {
  const { t } = useTranslation();
  const { data, colors, addNote, togglePinNote } = useAppContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [pinned, setPinned] = useState(false);
  const [inkData, setInkData] = useState<string | undefined>();
  const signatureRef = useRef<any>(null);

  const sortedNotes = useMemo(
    () => [...data.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    [data.notes],
  );

  function resetForm() {
    setTitle('');
    setContent('');
    setTags('');
    setPinned(false);
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

        {sortedNotes.length === 0 ? (
          <Text style={{ color: colors.subtle, paddingHorizontal: 4 }}>{t('notes.noNotes')}</Text>
        ) : (
          sortedNotes.map((note) => (
            <View key={note.id} style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.noteHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
                  <Text style={{ color: colors.subtle, fontSize: 12 }}>
                    {dayjs(note.updatedAt).format('DD.MM.YYYY HH:mm')} • {note.type}
                  </Text>
                </View>
                <Pressable onPress={() => togglePinNote(note.id)} style={[styles.pinBtn, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.text }}>{note.pinned ? '📌' : '📍'}</Text>
                </Pressable>
              </View>
              {note.content ? <Text style={{ color: colors.text }}>{note.content}</Text> : null}
              {note.inkDataUrl ? <Text style={{ color: colors.subtle }}>✍️ Handwriting attached</Text> : null}
              {note.tags.length > 0 ? (
                <Text style={{ color: colors.subtle }}>#{note.tags.join(' #')}</Text>
              ) : null}
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
  noteCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteTitle: {
    fontWeight: '800',
    fontSize: 17,
  },
  pinBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
