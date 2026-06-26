import React, { useState, useCallback } from 'react';
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
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLogbookStore } from '@/stores/logbookStore';
import { useDiveSessionStore } from '@/stores/diveSessionStore';
import { getAllCreatures } from '@/services/seedService';
import { CATEGORY_MAP } from '@/constants/categories';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import type { DiveType } from '@/types/dive';
import type { SightingFormData, SightingConfidence, SightingQuantity } from '@/types/sighting';

const DIVE_TYPES: DiveType[] = ['scuba', 'freedive', 'snorkel'];
const ALL_CREATURES = getAllCreatures();

type Step = 1 | 2 | 3 | 4;

export default function LogDiveModal() {
  const addDive = useLogbookStore((s) => s.addDive);
  const { draft, updateDraft, pendingSightings, addPendingSighting, removePendingSighting, clearSession } =
    useDiveSessionStore();

  const [step, setStep] = useState<Step>(1);
  const [creatureSearch, setCreatureSearch] = useState('');

  // Step 1 state
  const [date, setDate] = useState(new Date(draft.date ?? Date.now()));
  const [locationName, setLocationName] = useState(draft.locationName ?? '');
  const [diveType, setDiveType] = useState<DiveType>(draft.diveType ?? 'scuba');

  // Step 2 state
  const [maxDepth, setMaxDepth] = useState(String(draft.maxDepthMeters ?? ''));
  const [duration, setDuration] = useState(String(draft.durationMinutes ?? ''));
  const [waterTemp, setWaterTemp] = useState(String(draft.waterTempCelsius ?? ''));
  const [visibility, setVisibility] = useState(String(draft.visibilityMeters ?? ''));

  // Step 4 state
  const [notes, setNotes] = useState(draft.notes ?? '');
  const [buddy, setBuddy] = useState(draft.buddyName ?? '');
  const [diveCenter, setDiveCenter] = useState(draft.diveCenterName ?? '');
  const [rating, setRating] = useState<1|2|3|4|5|null>(draft.rating ?? null);

  const adjustDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d);
  };

  const filteredCreatures = ALL_CREATURES.filter((c) =>
    c.commonName.toLowerCase().includes(creatureSearch.toLowerCase()) ||
    c.scientificName.toLowerCase().includes(creatureSearch.toLowerCase())
  );

  const handleNext = () => {
    if (step === 1) {
      if (!locationName.trim()) {
        Alert.alert('Location required', 'Please enter a location name.');
        return;
      }
      updateDraft({ date, locationName: locationName.trim(), diveType });
    } else if (step === 2) {
      const depth = parseFloat(maxDepth);
      const dur = parseInt(duration);
      if (isNaN(depth) || depth <= 0) {
        Alert.alert('Depth required', 'Please enter a valid max depth.');
        return;
      }
      if (isNaN(dur) || dur <= 0) {
        Alert.alert('Duration required', 'Please enter a valid duration.');
        return;
      }
      updateDraft({
        maxDepthMeters: depth,
        durationMinutes: dur,
        waterTempCelsius: waterTemp ? parseFloat(waterTemp) : null,
        visibilityMeters: visibility ? parseFloat(visibility) : null,
      });
    } else if (step === 3) {
      // sightings are already in store
    } else if (step === 4) {
      updateDraft({ notes, buddyName: buddy, diveCenterName: diveCenter, rating });
    }
    setStep((s) => Math.min(s + 1, 4) as Step);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBack = () => {
    if (step === 1) {
      handleCancel();
      return;
    }
    setStep((s) => Math.max(s - 1, 1) as Step);
  };

  const handleCancel = () => {
    Alert.alert('Discard Dive?', 'Any entered data will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          clearSession();
          router.back();
        },
      },
    ]);
  };

  const handleSave = () => {
    const depth = parseFloat(maxDepth);
    const dur = parseInt(duration);
    const formData = {
      date,
      locationName: locationName.trim(),
      diveType,
      maxDepthMeters: isNaN(depth) ? 0 : depth,
      durationMinutes: isNaN(dur) ? 0 : dur,
      waterTempCelsius: waterTemp ? parseFloat(waterTemp) : null,
      visibilityMeters: visibility ? parseFloat(visibility) : null,
      avgDepthMeters: null,
      locationLat: null,
      locationLon: null,
      buddyName: buddy,
      diveCenterName: diveCenter,
      notes,
      rating,
    };
    addDive(formData, pendingSightings);
    clearSession();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const toggleSighting = useCallback((creatureId: string) => {
    const exists = pendingSightings.some((s) => s.creatureId === creatureId);
    if (exists) {
      removePendingSighting(creatureId);
    } else {
      const now = new Date();
      const sighting: Omit<SightingFormData, 'diveId'> = {
        creatureId,
        spottedAt: now,
        depthObservedMeters: null,
        quantity: 'one',
        behaviorNotes: '',
        photoUri: null,
        confidence: 'certain',
      };
      addPendingSighting(sighting);
    }
    Haptics.selectionAsync();
  }, [pendingSightings, addPendingSighting, removePendingSighting]);

  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Log a Dive',
          headerLeft: () => (
            <Pressable onPress={handleCancel} style={{ paddingLeft: 4 }}>
              <Text style={{ color: Colors.coral, fontSize: 16 }}>Cancel</Text>
            </Pressable>
          ),
        }}
      />

      {/* Progress bar */}
      <View style={styles.progress}>
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <View
            key={s}
            style={[styles.progressDot, s <= step && styles.progressDotActive]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>
        Step {step} of 4 — {['Basics', 'Conditions', 'Sightings', 'Notes'][step - 1]}
      </Text>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* STEP 1: Basics */}
          {step === 1 && (
            <View style={styles.stepContent}>
              {/* Date picker */}
              <Field label="Date">
                <View style={styles.dateRow}>
                  <Pressable style={styles.dateArrow} onPress={() => adjustDate(-1)}>
                    <Text style={styles.dateArrowText}>‹</Text>
                  </Pressable>
                  <Text style={styles.dateValue}>{dateStr}</Text>
                  <Pressable
                    style={styles.dateArrow}
                    onPress={() => adjustDate(1)}
                    disabled={date >= new Date()}
                  >
                    <Text style={[styles.dateArrowText, date >= new Date() && { opacity: 0.3 }]}>›</Text>
                  </Pressable>
                </View>
              </Field>

              <Field label="Location *">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Cala Ratjada, Mallorca"
                  placeholderTextColor={Colors.textMuted}
                  value={locationName}
                  onChangeText={setLocationName}
                  returnKeyType="next"
                />
              </Field>

              <Field label="Dive Type">
                <View style={styles.segmentRow}>
                  {DIVE_TYPES.map((t) => (
                    <Pressable
                      key={t}
                      style={[styles.segment, diveType === t && styles.segmentActive]}
                      onPress={() => setDiveType(t)}
                    >
                      <Text style={[styles.segmentText, diveType === t && styles.segmentTextActive]}>
                        {t === 'scuba' ? 'SCUBA' : t === 'freedive' ? 'Freedive' : 'Snorkel'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>
            </View>
          )}

          {/* STEP 2: Conditions */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Field label="Max Depth (m) *">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 18"
                  placeholderTextColor={Colors.textMuted}
                  value={maxDepth}
                  onChangeText={setMaxDepth}
                  keyboardType="decimal-pad"
                />
              </Field>
              <Field label="Duration (minutes) *">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 45"
                  placeholderTextColor={Colors.textMuted}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                />
              </Field>
              <Field label="Water Temperature (°C)">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 22"
                  placeholderTextColor={Colors.textMuted}
                  value={waterTemp}
                  onChangeText={setWaterTemp}
                  keyboardType="decimal-pad"
                />
              </Field>
              <Field label="Visibility (m)">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 15"
                  placeholderTextColor={Colors.textMuted}
                  value={visibility}
                  onChangeText={setVisibility}
                  keyboardType="decimal-pad"
                />
              </Field>
            </View>
          )}

          {/* STEP 3: Sightings */}
          {step === 3 && (
            <View style={styles.stepContent}>
              {pendingSightings.length > 0 && (
                <View style={styles.addedSection}>
                  <Text style={styles.addedLabel}>Added ({pendingSightings.length})</Text>
                  {pendingSightings.map((s) => {
                    const c = ALL_CREATURES.find((cr) => cr.id === s.creatureId);
                    const catColor = CATEGORY_MAP.get(c?.categoryId ?? '')?.color ?? Colors.ocean;
                    return (
                      <View key={s.creatureId} style={styles.addedRow}>
                        <View style={[styles.miniThumb, { backgroundColor: catColor + '22' }]}>
                          <Text style={{ color: catColor, fontWeight: '700' }}>{c?.commonName[0]}</Text>
                        </View>
                        <Text style={styles.addedName}>{c?.commonName ?? s.creatureId}</Text>
                        <Pressable onPress={() => removePendingSighting(s.creatureId)}>
                          <Text style={styles.removeText}>✕</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}

              <TextInput
                style={[styles.input, { marginBottom: Spacing.sm }]}
                placeholder="Search species..."
                placeholderTextColor={Colors.textMuted}
                value={creatureSearch}
                onChangeText={setCreatureSearch}
              />

              {filteredCreatures.map((creature) => {
                const selected = pendingSightings.some((s) => s.creatureId === creature.id);
                const catColor = CATEGORY_MAP.get(creature.categoryId)?.color ?? Colors.ocean;
                return (
                  <Pressable
                    key={creature.id}
                    style={[styles.creaturePickRow, selected && { borderColor: catColor }]}
                    onPress={() => toggleSighting(creature.id)}
                  >
                    <View style={[styles.miniThumb, { backgroundColor: catColor + '22' }]}>
                      <Text style={[styles.miniLetter, { color: catColor }]}>{creature.commonName[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.creaturePickName}>{creature.commonName}</Text>
                      <Text style={styles.creaturePickSci}>{creature.scientificName}</Text>
                    </View>
                    <View style={[styles.checkCircle, selected && { backgroundColor: catColor }]}>
                      {selected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* STEP 4: Notes */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <Field label="Buddy">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Maria"
                  placeholderTextColor={Colors.textMuted}
                  value={buddy}
                  onChangeText={setBuddy}
                />
              </Field>
              <Field label="Dive Center">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Blue Dive Center"
                  placeholderTextColor={Colors.textMuted}
                  value={diveCenter}
                  onChangeText={setDiveCenter}
                />
              </Field>
              <Field label="Rating">
                <View style={styles.ratingRow}>
                  {([1, 2, 3, 4, 5] as const).map((r) => (
                    <Pressable key={r} onPress={() => setRating(rating === r ? null : r)}>
                      <Text style={[styles.ratingStar, r <= (rating ?? 0) && styles.ratingStarActive]}>
                        ★
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>
              <Field label="Notes">
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="How was the dive? Any observations?"
                  placeholderTextColor={Colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </Field>
            </View>
          )}
        </ScrollView>

        {/* Bottom nav */}
        <View style={styles.bottomNav}>
          <Pressable style={styles.backNavBtn} onPress={handleBack}>
            <Text style={styles.backNavText}>{step === 1 ? 'Cancel' : '← Back'}</Text>
          </Pressable>
          {step < 4 ? (
            <Pressable style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next →</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.nextBtn, styles.saveBtn]} onPress={handleSave}>
              <Text style={styles.nextBtnText}>Save Dive ✓</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  progress: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 4,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.navyLight,
  },
  progressDotActive: {
    backgroundColor: Colors.biolumCyan,
  },
  stepLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  stepContent: { gap: Spacing.md },
  field: { gap: 6 },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 12,
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
    minHeight: 100,
    paddingTop: Spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ocean + '33',
    overflow: 'hidden',
  },
  dateArrow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dateArrowText: {
    color: Colors.biolumCyan,
    fontSize: 24,
    fontWeight: '300',
  },
  dateValue: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ocean + '33',
  },
  segmentActive: {
    backgroundColor: Colors.ocean + '33',
    borderColor: Colors.ocean,
  },
  segmentText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  segmentTextActive: { color: Colors.biolumCyan },
  addedSection: {
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  addedLabel: {
    color: Colors.biolumCyan,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  addedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addedName: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  removeText: { color: Colors.coral, fontSize: 16, paddingHorizontal: 4 },
  creaturePickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  miniThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLetter: { fontSize: 16, fontWeight: '700' },
  creaturePickName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  creaturePickSci: { color: Colors.textMuted, fontSize: 11, fontStyle: 'italic' },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  ratingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ratingStar: {
    color: Colors.textMuted,
    fontSize: 32,
  },
  ratingStarActive: {
    color: Colors.warning,
  },
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.ocean + '33',
    backgroundColor: Colors.navy,
  },
  backNavBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.textMuted + '44',
    borderRadius: BorderRadius.lg,
  },
  backNavText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
  nextBtn: {
    flex: 2,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.ocean,
    borderRadius: BorderRadius.lg,
  },
  saveBtn: { backgroundColor: Colors.success },
  nextBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
