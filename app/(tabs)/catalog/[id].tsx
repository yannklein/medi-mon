import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getCreatureById } from '@/services/seedService';
import { useLogbookStore } from '@/stores/logbookStore';
import { CATEGORY_MAP } from '@/constants/categories';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

const IUCN_LABEL: Record<string, string> = {
  LC: 'Least Concern', NT: 'Near Threatened', VU: 'Vulnerable',
  EN: 'Endangered', CR: 'Critically Endangered', DD: 'Data Deficient', NE: 'Not Evaluated',
};
const IUCN_COLOR: Record<string, string> = {
  LC: Colors.success, NT: '#8BC34A', VU: Colors.warning, EN: Colors.coral, CR: Colors.error,
  DD: Colors.textMuted, NE: Colors.textMuted,
};
const SEASON_EMOJI: Record<string, string> = {
  spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️',
};

export default function CreatureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const creature = getCreatureById(id);
  const allSightings = useLogbookStore((s) => s.sightings);
  const sightings = useMemo(
    () => allSightings.filter((s) => s.creatureId === id),
    [allSightings, id]
  );

  if (!creature) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Species not found.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const category = CATEGORY_MAP.get(creature.categoryId);
  const catColor = category?.color ?? Colors.ocean;
  const iucnColor = IUCN_COLOR[creature.conservationStatus] ?? Colors.textMuted;
  const hasBeenSpotted = sightings.length > 0;

  const handleSpotted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/modals/add-sighting?creatureId=${creature.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: creature.commonName,
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.biolumCyan,
          headerTitleStyle: { color: Colors.sandy, fontSize: 16, fontWeight: '700' },
          headerBackTitleVisible: false,
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        {creature.wikiImageUrl ? (
          <View style={styles.heroImageContainer}>
            <Image source={{ uri: creature.wikiImageUrl }} style={styles.heroImage} />
            <LinearGradient
              colors={['transparent', Colors.navy]}
              style={styles.heroImageGradient}
            />
            <View style={styles.heroImageOverlay}>
              <Text style={styles.heroName}>{creature.commonName}</Text>
              <Text style={styles.heroSciName}>{creature.scientificName}</Text>
              <View style={styles.heroBadges}>
                <Badge label={category?.label ?? creature.categoryId} color={catColor} />
                <Badge label={IUCN_LABEL[creature.conservationStatus] ?? creature.conservationStatus} color={iucnColor} />
                {creature.isProtected && <Badge label="Protected" color={Colors.success} />}
                {creature.isEndemic && <Badge label="Endemic" color={Colors.ocean} />}
              </View>
            </View>
          </View>
        ) : (
          <LinearGradient
            colors={[catColor + '55', Colors.navy]}
            style={styles.hero}
          >
            <View style={[styles.heroThumb, { backgroundColor: catColor + '33' }]}>
              <Text style={creature.emoji ? styles.heroEmoji : [styles.heroLetter, { color: catColor }]}>
                {creature.emoji ?? creature.commonName[0]}
              </Text>
            </View>
            <Text style={styles.heroName}>{creature.commonName}</Text>
            <Text style={styles.heroSciName}>{creature.scientificName}</Text>
            <View style={styles.heroBadges}>
              <Badge label={category?.label ?? creature.categoryId} color={catColor} />
              <Badge label={IUCN_LABEL[creature.conservationStatus] ?? creature.conservationStatus} color={iucnColor} />
              {creature.isProtected && <Badge label="Protected" color={Colors.success} />}
              {creature.isEndemic && <Badge label="Endemic" color={Colors.ocean} />}
            </View>
          </LinearGradient>
        )}

        {/* Quick stats */}
        <View style={styles.statsGrid}>
          <StatBox label="Depth" value={`${creature.depthMinM}–${creature.depthMaxM}m`} />
          <StatBox label="Size" value={`${creature.sizeMinCm}–${creature.sizeMaxCm}cm`} />
          <StatBox
            label="Difficulty"
            value={'●'.repeat(creature.spottingDifficulty) + '○'.repeat(5 - creature.spottingDifficulty)}
            valueColor={Colors.biolumCyan}
          />
          <StatBox
            label="Activity"
            value={creature.activityPattern === 'both' ? 'Day & Night' : creature.activityPattern}
          />
        </View>

        {/* Spotted CTA */}
        <View style={styles.ctaRow}>
          <Pressable style={[styles.ctaBtn, hasBeenSpotted && styles.ctaBtnSpotted]} onPress={handleSpotted}>
            <Text style={styles.ctaBtnText}>
              {hasBeenSpotted ? `✓ Spotted ${sightings.length}×  — Log Again` : '+ Log a Sighting'}
            </Text>
          </Pressable>
        </View>

        {/* Sections */}
        <Section title="Description">
          <Text style={styles.bodyText}>{creature.description}</Text>
        </Section>

        <Section title="Habitats & Seasons">
          <View style={styles.chipRow}>
            {creature.habitats.map((h) => (
              <View key={h} style={styles.infoChip}>
                <Text style={styles.infoChipText}>{h.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.chipRow, { marginTop: Spacing.xs }]}>
            {creature.bestSeasons.map((s) => (
              <View key={s} style={styles.infoChip}>
                <Text style={styles.infoChipText}>{SEASON_EMOJI[s]} {s}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Spotting Tips">
          <Text style={[styles.bodyText, { color: Colors.seafoam }]}>{creature.spottingTips}</Text>
        </Section>

        <Section title="Behavior">
          <Text style={styles.bodyText}>{creature.behavior}</Text>
        </Section>

        <Section title="Diet">
          <Text style={styles.bodyText}>{creature.diet}</Text>
        </Section>

        {creature.funFacts.length > 0 && (
          <Section title="Fun Facts">
            {creature.funFacts.map((fact, i) => (
              <View key={i} style={styles.factRow}>
                <Text style={styles.factBullet}>✦</Text>
                <Text style={styles.factText}>{fact}</Text>
              </View>
            ))}
          </Section>
        )}

        {creature.tags.length > 0 && (
          <Section title="Tags">
            <View style={styles.chipRow}>
              {creature.tags.map((t) => (
                <View key={t} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{t}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StatBox({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  scroll: { paddingBottom: Spacing.xxl },
  heroImageContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  heroImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  heroThumb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroLetter: {
    fontSize: 52,
    fontWeight: '700',
  },
  heroEmoji: {
    fontSize: 64,
  },
  heroName: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSciName: {
    color: Colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  badge: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.sm,
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    marginTop: -Spacing.md,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ctaRow: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  ctaBtn: {
    backgroundColor: Colors.ocean,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  ctaBtnSpotted: {
    backgroundColor: Colors.oceanDark,
    borderWidth: 1,
    borderColor: Colors.biolumCyan,
  },
  ctaBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.biolumCyan,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  bodyText: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  infoChip: {
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  infoChipText: {
    color: Colors.seafoam,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  factRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  factBullet: {
    color: Colors.biolumCyan,
    fontSize: 12,
    marginTop: 3,
  },
  factText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  tagChip: {
    backgroundColor: Colors.ocean + '22',
    borderWidth: 1,
    borderColor: Colors.ocean,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  tagChipText: {
    color: Colors.ocean,
    fontSize: 12,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  notFoundText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  backBtn: {
    backgroundColor: Colors.ocean,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },
});
