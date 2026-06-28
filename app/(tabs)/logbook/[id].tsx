import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLogbookStore } from '@/stores/logbookStore';
import { getCreatureById, getCreatureName } from '@/services/seedService';
import { CATEGORY_MAP } from '@/constants/categories';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useUIStore } from '@/stores/uiStore';

const DIVE_TYPE_LABEL: Record<string, string> = {
  scuba: 'SCUBA', freedive: 'Freedive', snorkel: 'Snorkel',
};

export default function DiveDetailScreen() {
  const language = useUIStore((s) => s.language);
  const { id } = useLocalSearchParams<{ id: string }>();
  const dive = useLogbookStore((s) => s.dives.find((d) => d.id === id));
  const allSightings = useLogbookStore((s) => s.sightings);
  const sightings = useMemo(
    () => allSightings.filter((s) => s.diveId === id),
    [allSightings, id]
  );
  const deleteDive = useLogbookStore((s) => s.deleteDive);
  const deleteSighting = useLogbookStore((s) => s.deleteSighting);

  if (!dive) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Dive Not Found' }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Dive not found.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const date = new Date(dive.date);
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Dive',
      'This will also remove all sightings from this dive. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteDive(id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: dive.locationName || 'Dive Detail',
          headerRight: () => (
            <Pressable onPress={handleDelete} style={{ paddingRight: 4 }}>
              <Text style={{ color: Colors.coral, fontSize: 14, fontWeight: '600' }}>Delete</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.locationText}>{dive.locationName || 'Unknown Location'}</Text>
          <Text style={styles.typeText}>{DIVE_TYPE_LABEL[dive.diveType] ?? dive.diveType}</Text>
          {dive.rating != null && (
            <Text style={styles.stars}>
              {'★'.repeat(dive.rating)}{'☆'.repeat(5 - dive.rating)}
            </Text>
          )}
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatRow label="Max Depth" value={`${dive.maxDepthMeters} m`} />
          {dive.avgDepthMeters != null && (
            <StatRow label="Avg Depth" value={`${dive.avgDepthMeters} m`} />
          )}
          <StatRow label="Duration" value={`${dive.durationMinutes} min`} />
          {dive.waterTempCelsius != null && (
            <StatRow label="Water Temp" value={`${dive.waterTempCelsius}°C`} />
          )}
          {dive.visibilityMeters != null && (
            <StatRow label="Visibility" value={`${dive.visibilityMeters} m`} />
          )}
          {dive.buddyName ? <StatRow label="Buddy" value={dive.buddyName} /> : null}
          {dive.diveCenterName ? <StatRow label="Dive Center" value={dive.diveCenterName} /> : null}
        </View>

        {/* Notes */}
        {dive.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{dive.notes}</Text>
          </View>
        ) : null}

        {/* Sightings */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Sightings ({sightings.length})</Text>
            <Pressable
              onPress={() => router.push(`/modals/add-sighting?diveId=${id}`)}
              style={styles.addSightingBtn}
            >
              <Text style={styles.addSightingText}>+ Add</Text>
            </Pressable>
          </View>

          {sightings.length === 0 ? (
            <Text style={styles.noSightings}>No sightings recorded for this dive.</Text>
          ) : (
            sightings.map((sighting) => {
              const creature = getCreatureById(sighting.creatureId);
              const cat = creature ? CATEGORY_MAP.get(creature.categoryId) : null;
              const catColor = cat?.color ?? Colors.ocean;
              return (
                <View key={sighting.id} style={styles.sightingRow}>
                  <View style={[styles.sightingThumb, { backgroundColor: catColor + '22' }]}>
                    <Text style={[styles.sightingLetter, { color: catColor }]}>
                      {creature ? getCreatureName(creature, language)[0] : '?'}
                    </Text>
                  </View>
                  <View style={styles.sightingInfo}>
                    <Text style={styles.sightingName}>
                      {creature ? getCreatureName(creature, language) : sighting.creatureId}
                    </Text>
                    <Text style={styles.sightingMeta}>
                      {[
                        sighting.confidence,
                        sighting.quantity,
                        sighting.depthObservedMeters != null ? `${sighting.depthObservedMeters}m` : null,
                      ].filter(Boolean).join(' · ')}
                    </Text>
                    {sighting.behaviorNotes ? (
                      <Text style={styles.sightingNotes} numberOfLines={2}>
                        {sighting.behaviorNotes}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => {
                      Alert.alert('Remove Sighting', 'Remove this sighting?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => deleteSighting(sighting.id) },
                      ]);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  scroll: { paddingBottom: Spacing.xxl },
  summaryCard: {
    backgroundColor: Colors.navyLight,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 4,
  },
  dateText: { color: Colors.textMuted, fontSize: 13 },
  locationText: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  typeText: { color: Colors.seafoam, fontSize: 14 },
  stars: { color: Colors.warning, fontSize: 16, letterSpacing: 2 },
  statsGrid: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy,
  },
  statLabel: { color: Colors.textMuted, fontSize: 14 },
  statValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.biolumCyan,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  addSightingBtn: {
    backgroundColor: Colors.ocean,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  addSightingText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  notesText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },
  noSightings: { color: Colors.textMuted, fontSize: 14, fontStyle: 'italic' },
  sightingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  sightingThumb: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sightingLetter: { fontSize: 20, fontWeight: '700' },
  sightingInfo: { flex: 1, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, gap: 2 },
  sightingName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  sightingMeta: { color: Colors.textMuted, fontSize: 12, textTransform: 'capitalize' },
  sightingNotes: { color: Colors.seafoam, fontSize: 12, fontStyle: 'italic' },
  deleteBtn: { padding: Spacing.sm },
  deleteBtnText: { color: Colors.coral, fontSize: 16 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  notFoundText: { color: Colors.textMuted, fontSize: 16 },
  backBtn: {
    backgroundColor: Colors.ocean, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  backBtnText: { color: Colors.white, fontWeight: '700' },
});
