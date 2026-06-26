import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import type { Creature } from '@/types/creature';
import { CATEGORY_MAP } from '@/constants/categories';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

const IUCN_THREAT_COLORS: Record<string, string> = {
  VU: Colors.warning,
  EN: Colors.coral,
  CR: Colors.error,
};

interface Props {
  creature: Creature;
  compact?: boolean;
  spotted?: boolean;
}

export function CreatureCard({ creature, compact = false, spotted = false }: Props) {
  const category = CATEGORY_MAP.get(creature.categoryId);
  const catColor = category?.color ?? Colors.ocean;
  const threatColor = IUCN_THREAT_COLORS[creature.conservationStatus];

  const handlePress = () => router.push(`/catalog/${creature.id}`);

  if (compact) {
    return (
      <Pressable style={styles.gridCard} onPress={handlePress} android_ripple={{ color: catColor + '33' }}>
        <View style={[styles.gridThumb, { backgroundColor: catColor + '22' }]}>
          {creature.wikiImageUrl ? (
            <Image source={{ uri: creature.wikiImageUrl }} style={styles.gridImage} />
          ) : (
            <Text style={creature.emoji ? styles.gridEmoji : [styles.gridLetter, { color: catColor }]}>
              {creature.emoji ?? creature.commonName[0]}
            </Text>
          )}
          {spotted && <SpottedBadge />}
        </View>
        <View style={styles.gridInfo}>
          <Text style={styles.gridName} numberOfLines={2}>{creature.commonName}</Text>
          <View style={styles.row}>
            <DifficultyDots value={creature.spottingDifficulty} />
            {threatColor ? (
              <Text style={[styles.iucnText, { color: threatColor }]}>
                {creature.conservationStatus}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.listCard} onPress={handlePress} android_ripple={{ color: catColor + '33' }}>
      <View style={[styles.listThumb, { backgroundColor: catColor + '22' }]}>
        {creature.wikiImageUrl ? (
          <Image source={{ uri: creature.wikiImageUrl }} style={styles.listImage} />
        ) : (
          <Text style={creature.emoji ? styles.listEmoji : [styles.listLetter, { color: catColor }]}>
            {creature.emoji ?? creature.commonName[0]}
          </Text>
        )}
        {spotted && <SpottedBadge />}
      </View>
      <View style={styles.listInfo}>
        <View style={styles.row}>
          <Text style={styles.listName} numberOfLines={1}>{creature.commonName}</Text>
          {threatColor ? (
            <Text style={[styles.iucnText, { color: threatColor }]}>
              {creature.conservationStatus}
            </Text>
          ) : null}
          {creature.isProtected && (
            <Text style={styles.protectedBadge}>Protected</Text>
          )}
        </View>
        <Text style={styles.sciName} numberOfLines={1}>{creature.scientificName}</Text>
        <View style={styles.row}>
          <Text style={[styles.catLabel, { color: catColor }]}>
            {category?.label ?? creature.categoryId}
          </Text>
          <DifficultyDots value={creature.spottingDifficulty} />
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function DifficultyDots({ value }: { value: number }) {
  return (
    <View style={styles.dotsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i <= value ? Colors.biolumCyan : Colors.textMuted },
          ]}
        />
      ))}
    </View>
  );
}

function SpottedBadge() {
  return (
    <View style={styles.spottedBadge}>
      <Text style={styles.spottedCheck}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // List card
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  listThumb: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listLetter: {
    fontSize: 28,
    fontWeight: '700',
  },
  listEmoji: {
    fontSize: 32,
  },
  listImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listInfo: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  listName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  sciName: {
    color: Colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 22,
    paddingRight: Spacing.sm,
  },

  // Grid card
  gridCard: {
    flex: 1,
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  gridThumb: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLetter: {
    fontSize: 40,
    fontWeight: '700',
  },
  gridEmoji: {
    fontSize: 48,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridInfo: {
    padding: Spacing.sm,
    gap: 6,
  },
  gridName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  // Shared
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iucnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  protectedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  spottedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.biolumCyan,
    borderRadius: 10,
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
});
