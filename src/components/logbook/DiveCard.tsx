import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { DiveRecord } from '@/types/dive';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

const DIVE_TYPE_LABEL: Record<string, string> = {
  scuba: 'SCUBA',
  freedive: 'FREE',
  snorkel: 'SNKL',
};

const DIVE_TYPE_COLOR: Record<string, string> = {
  scuba: Colors.ocean,
  freedive: Colors.biolumCyan,
  snorkel: Colors.seafoam,
};

interface Props {
  dive: DiveRecord;
  sightingCount: number;
}

export function DiveCard({ dive, sightingCount }: Props) {
  const date = new Date(dive.date);
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const typeColor = DIVE_TYPE_COLOR[dive.diveType] ?? Colors.ocean;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/logbook/${dive.id}`)}
      android_ripple={{ color: Colors.ocean + '33' }}
    >
      {/* Left accent */}
      <View style={[styles.accent, { backgroundColor: typeColor }]} />

      <View style={styles.body}>
        {/* Row 1: Date + Type badge */}
        <View style={styles.row}>
          <Text style={styles.date}>{dateStr}</Text>
          <View style={[styles.typeBadge, { borderColor: typeColor }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {DIVE_TYPE_LABEL[dive.diveType] ?? dive.diveType.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Row 2: Location */}
        <Text style={styles.location} numberOfLines={1}>
          {dive.locationName || 'Unknown Location'}
        </Text>

        {/* Row 3: Stats */}
        <View style={styles.statsRow}>
          <Stat label="Depth" value={`${dive.maxDepthMeters}m`} />
          <Stat label="Time" value={`${dive.durationMinutes}min`} />
          {sightingCount > 0 && (
            <Stat label="Sightings" value={String(sightingCount)} accent />
          )}
          {dive.rating != null && (
            <Text style={styles.stars}>{'★'.repeat(dive.rating)}{'☆'.repeat(5 - dive.rating)}</Text>
          )}
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && { color: Colors.biolumCyan }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  location: {
    color: Colors.seafoam,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  stars: {
    color: Colors.warning,
    fontSize: 12,
    letterSpacing: 1,
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 22,
    paddingRight: Spacing.sm,
  },
});
