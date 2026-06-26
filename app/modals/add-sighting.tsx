import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLogbookStore } from '@/stores/logbookStore';
import { getAllCreatures, getCreatureById } from '@/services/seedService';
import { CATEGORY_MAP } from '@/constants/categories';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import type { SightingConfidence, SightingQuantity } from '@/types/sighting';

const ALL_CREATURES = getAllCreatures();
const CONFIDENCE_OPTIONS: SightingConfidence[] = ['certain', 'probable', 'unsure'];
const QUANTITY_OPTIONS: SightingQuantity[] = ['one', 'few', 'many'];

export default function AddSightingModal() {
  const params = useLocalSearchParams<{ creatureId?: string; diveId?: string }>();
  const addSighting = useLogbookStore((s) => s.addSighting);

  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(
    params.creatureId ?? null
  );
  const [creatureSearch, setCreatureSearch] = useState('');
  const [depth, setDepth] = useState('');
  const [quantity, setQuantity] = useState<SightingQuantity>('one');
  const [confidence, setConfidence] = useState<SightingConfidence>('certain');
  const [behaviorNotes, setBehaviorNotes] = useState('');

  const selectedCreature = selectedCreatureId ? getCreatureById(selectedCreatureId) : null;
  const catColor = selectedCreature
    ? CATEGORY_MAP.get(selectedCreature.categoryId)?.color ?? Colors.ocean
    : Colors.ocean;

  const filteredCreatures = useMemo(() =>
    ALL_CREATURES.filter((c) =>
      c.commonName.toLowerCase().includes(creatureSearch.toLowerCase()) ||
      c.scientificName.toLowerCase().includes(creatureSearch.toLowerCase())
    ),
    [creatureSearch]
  );

  const handleSave = () => {
    if (!selectedCreatureId) {
      Alert.alert('Select a Species', 'Please select a species before saving.');
      return;
    }
    addSighting({
      creatureId: selectedCreatureId,
      diveId: params.diveId ?? null,
      spottedAt: new Date(),
      depthObservedMeters: depth ? parseFloat(depth) : null,
      quantity,
      confidence,
      behaviorNotes,
      photoUri: null,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Log a Sighting',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingLeft: 4 }}>
              <Text style={{ color: Colors.coral, fontSize: 16 }}>Cancel</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleSave} style={{ paddingRight: 4 }}>
              <Text style={{ color: Colors.biolumCyan, fontSize: 16, fontWeight: '700' }}>Save</Text>
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Selected creature */}
          {selectedCreature ? (
            <View style={[styles.selectedCard, { borderColor: catColor }]}>
              <View style={[styles.thumbCircle, { backgroundColor: catColor + '22' }]}>
                <Text style={[styles.thumbLetter, { color: catColor }]}>{selectedCreature.commonName[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedName}>{selectedCreature.commonName}</Text>
                <Text style={styles.selectedSci}>{selectedCreature.scientificName}</Text>
              </View>
              <Pressable onPress={() => setSelectedCreatureId(null)}>
                <Text style={styles.changeText}>Change</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Species *</Text>
              <TextInput
                style={styles.input}
                placeholder="Search species..."
                placeholderTextColor={Colors.textMuted}
                value={creatureSearch}
                onChangeText={setCreatureSearch}
              />
              {filteredCreatures.map((c) => {
                const color = CATEGORY_MAP.get(c.categoryId)?.color ?? Colors.ocean;
                return (
                  <Pressable
                    key={c.id}
                    style={styles.creatureRow}
                    onPress={() => {
                      setSelectedCreatureId(c.id);
                      Haptics.selectionAsync();
                    }}
                  >
                    <View style={[styles.miniThumb, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.miniLetter, { color }]}>{c.commonName[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.creatureName}>{c.commonName}</Text>
                      <Text style={styles.creatureSci}>{c.scientificName}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {selectedCreature && (
            <>
              {/* Confidence */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How sure are you?</Text>
                <View style={styles.optionRow}>
                  {CONFIDENCE_OPTIONS.map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.optionBtn, confidence === c && styles.optionBtnActive]}
                      onPress={() => setConfidence(c)}
                    >
                      <Text style={[styles.optionText, confidence === c && styles.optionTextActive]}>
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Quantity */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How many?</Text>
                <View style={styles.optionRow}>
                  {QUANTITY_OPTIONS.map((q) => (
                    <Pressable
                      key={q}
                      style={[styles.optionBtn, quantity === q && styles.optionBtnActive]}
                      onPress={() => setQuantity(q)}
                    >
                      <Text style={[styles.optionText, quantity === q && styles.optionTextActive]}>
                        {q}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Depth */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Depth Observed (m)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 12"
                  placeholderTextColor={Colors.textMuted}
                  value={depth}
                  onChangeText={setDepth}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Notes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Behavior Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What was it doing? Any interesting behavior?"
                  placeholderTextColor={Colors.textMuted}
                  value={behaviorNotes}
                  onChangeText={setBehaviorNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Sighting ✓</Text>
              </Pressable>
            </>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  thumbCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLetter: { fontSize: 22, fontWeight: '700' },
  selectedName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  selectedSci: { color: Colors.textMuted, fontSize: 12, fontStyle: 'italic' },
  changeText: { color: Colors.ocean, fontSize: 13, fontWeight: '600' },
  section: { gap: 8 },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.ocean + '33',
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.sm,
  },
  creatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  miniThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLetter: { fontSize: 16, fontWeight: '700' },
  creatureName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  creatureSci: { color: Colors.textMuted, fontSize: 11, fontStyle: 'italic' },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ocean + '33',
  },
  optionBtnActive: {
    backgroundColor: Colors.ocean + '33',
    borderColor: Colors.ocean,
  },
  optionText: { color: Colors.textMuted, fontSize: 13, textTransform: 'capitalize' },
  optionTextActive: { color: Colors.biolumCyan, fontWeight: '700' },
  saveBtn: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
