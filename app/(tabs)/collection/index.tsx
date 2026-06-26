import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLogbookStore } from '@/stores/logbookStore';
import { getAllCreatures } from '@/services/seedService';
import { CATEGORY_MAP } from '@/constants/categories';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import type { Creature } from '@/types/creature';

const ALL_CREATURES = getAllCreatures();

export default function CollectionScreen() {
  const sightings = useLogbookStore((s) => s.sightings);
  const spottedIds = useMemo(() => new Set(sightings.map((s) => s.creatureId)), [sightings]);
  const totalSightings = sightings.length;
  const totalDives = useLogbookStore((s) => s.dives.length);

  const sorted = useMemo(() => {
    const spotted = ALL_CREATURES.filter((c) => spottedIds.has(c.id));
    const unspotted = ALL_CREATURES.filter((c) => !spottedIds.has(c.id));
    return [...spotted, ...unspotted];
  }, [spottedIds]);

  const renderItem = ({ item, index }: { item: Creature; index: number }) => {
    const isSpotted = spottedIds.has(item.id);
    const category = CATEGORY_MAP.get(item.categoryId);
    const catColor = category?.color ?? Colors.ocean;

    return (
      <View style={styles.gridItemWrapper}>
        <Pressable
          style={[styles.gridItem, !isSpotted && styles.gridItemUnspotted]}
          onPress={() => router.push(`/catalog/${item.id}`)}
        >
          <View
            style={[
              styles.thumbArea,
              { backgroundColor: isSpotted ? catColor + '33' : Colors.navyDark },
            ]}
          >
            <Text
              style={[
                styles.thumbLetter,
                { color: isSpotted ? catColor : Colors.textMuted + '66' },
              ]}
            >
              {item.commonName[0]}
            </Text>
            {isSpotted && (
              <View style={styles.spottedBadge}>
                <Text style={styles.spottedCheck}>✓</Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.itemName, !isSpotted && styles.itemNameUnspotted]}
            numberOfLines={2}
          >
            {isSpotted ? item.commonName : '???'}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(c) => c.id}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>My Ocean</Text>
              <Text style={styles.subtitle}>Your personal field guide</Text>
            </View>
            {/* Stats banner */}
            <View style={styles.statsBanner}>
              <StatCell
                value={`${spottedIds.size}/${ALL_CREATURES.length}`}
                label="Species Spotted"
                highlight
              />
              <View style={styles.statDivider} />
              <StatCell value={String(totalDives)} label="Dives" />
              <View style={styles.statDivider} />
              <StatCell value={String(totalSightings)} label="Sightings" />
            </View>
            <Text style={styles.sectionLabel}>
              {spottedIds.size > 0
                ? `${spottedIds.size} spotted — ${ALL_CREATURES.length - spottedIds.size} to discover`
                : 'Start diving to fill your ocean!'}
            </Text>
          </>
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No species yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function StatCell({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, highlight && { color: Colors.biolumCyan }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: 13 },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.navyLight,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 11 },
  statDivider: {
    width: 1,
    backgroundColor: Colors.navy,
    marginVertical: 4,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  row: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  gridItemWrapper: {
    flex: 1,
  },
  gridItem: {
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  gridItemUnspotted: {
    opacity: 0.5,
  },
  thumbArea: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLetter: {
    fontSize: 32,
    fontWeight: '700',
  },
  spottedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.biolumCyan,
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spottedCheck: {
    color: Colors.navy,
    fontSize: 10,
    fontWeight: '700',
  },
  itemName: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    padding: 6,
    lineHeight: 14,
  },
  itemNameUnspotted: {
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
});
