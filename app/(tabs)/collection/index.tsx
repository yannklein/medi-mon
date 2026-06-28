import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLogbookStore } from '@/stores/logbookStore';
import { getAllCreatures, getCreatureName } from '@/services/seedService';
import { CATEGORY_MAP } from '@/constants/categories';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { useUIStore } from '@/stores/uiStore';
import type { Creature } from '@/types/creature';

const ALL_CREATURES = getAllCreatures();

export default function CollectionScreen() {
  const t = useT();
  const language = useUIStore((s) => s.language);
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
            {isSpotted && item.wikiImageUrl ? (
              <Image source={{ uri: item.wikiImageUrl }} style={styles.thumbImage} />
            ) : (
              <Text
                style={[
                  item.emoji ? styles.thumbEmoji : styles.thumbLetter,
                  !item.emoji && { color: isSpotted ? catColor : Colors.textMuted + '66' },
                ]}
              >
                {isSpotted ? (item.emoji ?? getCreatureName(item, language)[0]) : '?'}
              </Text>
            )}
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
            {isSpotted ? getCreatureName(item, language) : '???'}
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
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>🌊</Text>
              </View>
              <Text style={styles.title}>{t('collection.title')}</Text>
              <Text style={styles.subtitle}>
                {spottedIds.size > 0
                  ? t('collection.subtitle.discovered', spottedIds.size, ALL_CREATURES.length)
                  : t('collection.subtitle.default')}
              </Text>
            </View>
            {/* Stats banner */}
            <View style={styles.statsBanner}>
              <StatCell
                value={`${spottedIds.size}/${ALL_CREATURES.length}`}
                label={t('collection.stats.species')}
                highlight
              />
              <View style={styles.statDivider} />
              <StatCell value={String(totalDives)} label={t('collection.stats.dives')} />
              <View style={styles.statDivider} />
              <StatCell value={String(totalSightings)} label={t('collection.stats.sightings')} />
            </View>
            <Text style={styles.sectionLabel}>
              {spottedIds.size > 0
                ? t('collection.section.spotted', spottedIds.size, ALL_CREATURES.length - spottedIds.size)
                : t('collection.section.empty')}
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
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: Colors.ocean,
  },
  iconEmoji: { fontSize: 30 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
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
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbEmoji: {
    fontSize: 32,
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
