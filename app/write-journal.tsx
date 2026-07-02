import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme, getCurrentMoonPhase } from '../constants/theme';
import { getTodayPlanet } from '../constants/planetaryData';
import { getCurrentPlanetaryHour } from '../services/planetaryHours';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '@/template';
import GradientScreen from '../components/GradientScreen';
import ImageField from '../components/ImageField';

const SPIRITUAL_EMOJIS = [
  '🌀', '✨', '🔮', '💫', '🌊', '🔥', '🌿', '⚡',
  '🕯️', '🧿', '🌑', '☁️', '🗝️', '🪬', '🫧',
  '🌸', '🦋', '🐍', '🌹', '⭐',
];

const DEFAULT_TYPE_IDS = ['reflection', 'dream', 'encounter', 'insight'];

export default function WriteJournalScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { standaloneEntries, addStandaloneEntry, updateStandaloneEntry, journalEntryTypes, addJournalEntryType, deleteJournalEntryType, moods, addMood, deleteMood } = useApp();
  const { showAlert } = useAlert();

  const editEntry = editId ? standaloneEntries.find(e => e.id === editId) : undefined;

  const moonPhase = getCurrentMoonPhase();
  const todayPlanet = getTodayPlanet();
  const currentHour = getCurrentPlanetaryHour();

  const [title, setTitle] = useState(editEntry?.title || '');
  const [notes, setNotes] = useState(editEntry?.notes || '');
  const [type, setType] = useState(editEntry?.type || 'reflection');
  const [selectedMoods, setSelectedMoods] = useState<string[]>(editEntry?.moods || editEntry?.mood ? [editEntry.mood] : []);
  const [tags, setTags] = useState(editEntry?.tags?.join(', ') || '');
  const [imageUrl, setImageUrl] = useState<string | undefined>(editEntry?.imageUrl);
  const [isAddingMood, setIsAddingMood] = useState(false);
  const [newMoodText, setNewMoodText] = useState('');
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypeEmoji, setNewTypeEmoji] = useState('✨');

  const canSave = title.trim().length > 0 && notes.trim().length > 0 && selectedMoods.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const parsedTags = tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (editEntry) {
      updateStandaloneEntry(editEntry.id, {
        title: title.trim(),
        notes: notes.trim(),
        moods: selectedMoods,
        tags: parsedTags,
        type,
        imageUrl,
      });
    } else {
      addStandaloneEntry({
        date: new Date().toISOString(),
        title: title.trim(),
        notes: notes.trim(),
        moods: selectedMoods,
        tags: parsedTags,
        type,
        imageUrl,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleCreateType = () => {
    if (!newTypeLabel.trim()) return;
    const id = newTypeLabel.toLowerCase().trim().replace(/\s+/g, '_');
    if (journalEntryTypes.some(t => t.id === id)) {
      showAlert('Duplicate', 'A type with this name already exists.');
      return;
    }
    addJournalEntryType({ id, label: newTypeLabel.trim(), icon: newTypeEmoji });
    setType(id);
    setNewTypeLabel('');
    setNewTypeEmoji('✨');
    setShowNewTypeModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLongPressType = (typeId: string) => {
    if (DEFAULT_TYPE_IDS.includes(typeId)) return;
    const typeObj = journalEntryTypes.find(t => t.id === typeId);
    showAlert('Delete Type?', `Remove "${typeObj?.label || typeId}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteJournalEntryType(typeId); if (type === typeId) setType('reflection'); } },
    ]);
  };

  const cosmicStr = [
    `${moonPhase.icon} ${moonPhase.name}`,
    `${todayPlanet.emoji} Day of ${todayPlanet.name}`,
    currentHour ? `${currentHour.planet.emoji} Hour of ${currentHour.planet.name}` : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <GradientScreen>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{editEntry ? 'Edit Entry' : 'New Entry'}</Text>
        <Pressable
          onPress={handleSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          disabled={!canSave}
        >
          <Text style={[styles.saveBtnText, !canSave && { color: theme.textMuted }]}>
            {editEntry ? 'Update' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom + 200, 300) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
        >
          {/* Cosmic context pill */}
          {!editEntry && (
            <View style={styles.cosmicPill}>
              <Text style={styles.cosmicPillText}>{cosmicStr}</Text>
            </View>
          )}

          {/* Type selector */}
          <View style={styles.typeSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
              {journalEntryTypes.map(et => (
                <Pressable
                  key={et.id}
                  style={[styles.typeChip, type === et.id && styles.typeChipActive]}
                  onPress={() => { setType(et.id); Haptics.selectionAsync(); }}
                  onLongPress={() => handleLongPressType(et.id)}
                  delayLongPress={500}
                >
                  <Text style={{ fontSize: 14 }}>{et.icon}</Text>
                  <Text style={[styles.typeChipText, type === et.id && styles.typeChipTextActive]}>{et.label}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.newTypeBtn} onPress={() => setShowNewTypeModal(true)}>
                <MaterialIcons name="add" size={14} color={theme.accent} />
                <Text style={styles.newTypeBtnText}>New Type</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Title */}
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Title..."
            placeholderTextColor={theme.textMuted}
            returnKeyType="next"
          />

          {/* Notes — the main focus */}
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Write your thoughts, dreams, observations, insights..."
            placeholderTextColor={theme.textMuted}
            multiline
            textAlignVertical="top"
          />

          {/* Mood */}
          <Text style={styles.fieldLabel}>HOW DO YOU FEEL? * (select one or more)</Text>
          <View style={styles.moodRow}>
            {moods.map(m => {
              const isSelected = selectedMoods.includes(m);
              return (
                <Pressable
                  key={m}
                  style={[styles.moodChip, isSelected && styles.moodChipActive]}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedMoods(prev => prev.filter(mood => mood !== m));
                    } else {
                      setSelectedMoods(prev => [...prev, m]);
                    }
                    Haptics.selectionAsync();
                  }}
                  onLongPress={() => showAlert('Delete Mood?', `Remove "${m}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => { deleteMood(m); if (isSelected) setSelectedMoods(prev => prev.filter(mood => mood !== m)); } },
                  ])}
                  delayLongPress={500}
                >
                  <View style={styles.moodCheckmark}>
                    <Text style={[styles.moodChipText, isSelected && styles.moodChipTextActive]}>{m}</Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={14} color={theme.primary} />
                    )}
                  </View>
                </Pressable>
              );
            })}
            {isAddingMood ? (
              <View style={styles.moodAddInline}>
                <TextInput
                  style={styles.moodAddInput}
                  value={newMoodText}
                  onChangeText={setNewMoodText}
                  placeholder="New mood..."
                  placeholderTextColor={theme.textMuted}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => { if (newMoodText.trim()) addMood(newMoodText.trim()); setNewMoodText(''); setIsAddingMood(false); }}
                />
                <Pressable onPress={() => { if (newMoodText.trim()) addMood(newMoodText.trim()); setNewMoodText(''); setIsAddingMood(false); }} hitSlop={8}>
                  <MaterialIcons name="check" size={18} color={theme.success} />
                </Pressable>
                <Pressable onPress={() => { setIsAddingMood(false); setNewMoodText(''); }} hitSlop={8}>
                  <MaterialIcons name="close" size={18} color={theme.textMuted} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.moodAddChip} onPress={() => setIsAddingMood(true)}>
                <MaterialIcons name="add" size={14} color={theme.accent} />
                <Text style={styles.moodAddChipText}>Add</Text>
              </Pressable>
            )}
          </View>

          {/* Tags */}
          <Text style={styles.fieldLabel}>TAGS</Text>
          <TextInput
            style={styles.tagsInput}
            value={tags}
            onChangeText={setTags}
            placeholder="dream, moon, breakthrough... (comma-separated)"
            placeholderTextColor={theme.textMuted}
          />

          {/* Image Upload */}
          <ImageField
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
            fieldLabel="Photo"
            uploadLabel="Add Journal Photo"
            showCameraOption={true}
            previewSize={200}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* New Type Modal */}
      <Modal visible={showNewTypeModal} transparent animationType="fade" onRequestClose={() => setShowNewTypeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowNewTypeModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Create New Type</Text>
            <Text style={styles.modalLabel}>LABEL</Text>
            <TextInput
              style={styles.modalInput}
              value={newTypeLabel}
              onChangeText={setNewTypeLabel}
              placeholder="e.g. Channelling"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <Text style={styles.modalLabel}>ICON</Text>
            <View style={styles.emojiGrid}>
              {SPIRITUAL_EMOJIS.map(emoji => (
                <Pressable
                  key={emoji}
                  style={[styles.emojiBtn, newTypeEmoji === emoji && styles.emojiBtnActive]}
                  onPress={() => { setNewTypeEmoji(emoji); Haptics.selectionAsync(); }}
                >
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalBtnRow}>
              <Pressable style={styles.modalCancelBtn} onPress={() => { setShowNewTypeModal(false); setNewTypeLabel(''); setNewTypeEmoji('✨'); }}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalCreateBtn, !newTypeLabel.trim() && { opacity: 0.4 }]} onPress={handleCreateType} disabled={!newTypeLabel.trim()}>
                <Text style={styles.modalCreateBtnText}>Create</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, letterSpacing: 0.3 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, backgroundColor: theme.primary, borderRadius: theme.radius.sm },
  saveBtnDisabled: { backgroundColor: theme.surfaceLight },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: theme.background },

  cosmicPill: {
    backgroundColor: theme.primary + '25', borderWidth: 1.5, borderColor: theme.primary + '50',
    borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, marginTop: 20, marginBottom: 24,
    alignSelf: 'center', ...theme.shadows.card,
  },
  cosmicPillText: { fontSize: 13, color: theme.textSecondary, fontWeight: '600', letterSpacing: 0.3 },

  typeSection: { marginTop: 20, marginBottom: 8 },
  typeRow: { gap: 10, paddingVertical: 6 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typeChipActive: { backgroundColor: theme.primary + '20', borderColor: theme.primary, borderWidth: 2 },
  typeChipText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  typeChipTextActive: { color: theme.primary, fontWeight: '700' },
  newTypeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 2, borderColor: theme.accent + '50', borderStyle: 'dashed',
    backgroundColor: theme.accent + '12',
  },
  newTypeBtnText: { fontSize: 12, fontWeight: '700', color: theme.accent },

  titleInput: {
    fontSize: 28, fontWeight: '700', color: theme.textPrimary,
    fontFamily: theme.fonts.serif, marginTop: 24, marginBottom: 16,
    borderBottomWidth: 2, borderBottomColor: theme.primary + '40', paddingBottom: 12,
    textShadowColor: theme.primary + '20',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  notesInput: {
    fontSize: 16, color: theme.textPrimary, lineHeight: 28,
    fontFamily: theme.fonts.serif, minHeight: 240,
    backgroundColor: theme.surface, borderRadius: 20,
    padding: 20, borderWidth: 1.5, borderColor: theme.primary + '30',
    marginBottom: 28,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: theme.primary + '70',
    letterSpacing: 1.5, marginBottom: 12, marginTop: 4,
    textTransform: 'uppercase',
  },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  moodChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  moodChipActive: { backgroundColor: theme.primary + '22', borderColor: theme.primary, borderWidth: 2 },
  moodChipText: { fontSize: 12, fontWeight: '500', color: theme.textMuted },
  moodChipTextActive: { color: theme.primary, fontWeight: '700' },
  moodCheckmark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moodAddChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 2, borderColor: theme.accent + '50', borderStyle: 'dashed', backgroundColor: theme.accent + '12',
  },
  moodAddChipText: { fontSize: 12, fontWeight: '600', color: theme.accent },
  moodAddInline: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.primary + '50',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  moodAddInput: { fontSize: 12, color: theme.textPrimary, minWidth: 80, padding: 0 },

  tagsInput: {
    backgroundColor: theme.surface, borderRadius: 16,
    padding: 16, fontSize: 14, color: theme.textPrimary,
    borderWidth: 1.5, borderColor: theme.primary + '25',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#231248', borderRadius: theme.radius.lg, padding: 24, width: '100%', maxWidth: 380, ...theme.shadows.elevated },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 16 },
  modalLabel: { fontSize: 10, fontWeight: '700', color: theme.textMuted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' as const },
  modalInput: { backgroundColor: theme.background, borderRadius: theme.radius.sm, padding: 12, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border, marginBottom: 16 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  emojiBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceLight, borderWidth: 1.5, borderColor: 'transparent' },
  emojiBtnActive: { backgroundColor: theme.primary + '18', borderColor: theme.primary },
  modalBtnRow: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: theme.radius.md, backgroundColor: theme.surfaceLight, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  modalCancelBtnText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  modalCreateBtn: { flex: 1, paddingVertical: 13, borderRadius: theme.radius.md, backgroundColor: theme.primary, alignItems: 'center' },
  modalCreateBtnText: { fontSize: 14, fontWeight: '600', color: theme.background },
});
