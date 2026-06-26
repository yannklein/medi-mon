import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLogbookStore } from '@/stores/logbookStore';
import { useUIStore } from '@/stores/uiStore';
import { getAllCreatures, getCreatureById } from '@/services/seedService';
import { DiveCard } from '@/components/logbook/DiveCard';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

const ALL_CREATURES = getAllCreatures();

export default function ProfileScreen() {
  const dives = useLogbookStore((s) => s.dives);
  const sightings = useLogbookStore((s) => s.sightings);
  const getSightingsForDive = useLogbookStore((s) => s.getSightingsForDive);
  const spottedIds = useMemo(() => new Set(sightings.map((s) => s.creatureId)), [sightings]);

  const { showScientificNames, setShowScientificNames, lengthUnit, setLengthUnit } = useUIStore();

  const stats = useMemo(() => {
    const totalMinutes = dives.reduce((sum, d) => sum + d.durationMinutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;
    const deepest = dives.reduce((max, d) => Math.max(max, d.maxDepthMeters), 0);

    // Most spotted creature
    const counts: Record<string, number> = {};
    for (const s of sightings) {
      counts[s.creatureId] = (counts[s.creatureId] ?? 0) + 1;
    }
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCreature = topId ? getCreatureById(topId) : null;

    return { totalHours, totalMins, deepest, topCreature, topCount: topId ? counts[topId] : 0 };
  }, [dives, sightings]);

  const recentDives = [...dives]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>🤿</Text>
          </View>
          <Text style={styles.title}>Diver Profile</Text>
          <Text style={styles.subtitle}>Mediterranean Explorer</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatBox label="Total Dives" value={String(dives.length)} />
          <StatBox
            label="Bottom Time"
            value={dives.length ? `${stats.totalHours}h ${stats.totalMins}m` : '—'}
          />
          <StatBox
            label="Deepest Dive"
            value={stats.deepest > 0 ? `${stats.deepest}m` : '—'}
          />
          <StatBox
            label="Species Found"
            value={`${spottedIds.size}/${ALL_CREATURES.length}`}
            accent
          />
        </View>

        {stats.topCreature && (
          <View style={styles.topCreatureCard}>
            <Text style={styles.topCreatureLabel}>Most Spotted</Text>
            <Text style={styles.topCreatureName}>{stats.topCreature.commonName}</Text>
            <Text style={styles.topCreatureCount}>{stats.topCount}× sightings</Text>
          </View>
        )}

        {/* Recent dives */}
        {recentDives.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Dives</Text>
              <Pressable onPress={() => router.push('/logbook')}>
                <Text style={styles.seeAllText}>See all →</Text>
              </Pressable>
            </View>
            {recentDives.map((dive) => (
              <DiveCard
                key={dive.id}
                dive={dive}
                sightingCount={getSightingsForDive(dive.id).length}
              />
            ))}
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              label="Show Scientific Names"
              description="Display Latin names in catalog"
            >
              <Switch
                value={showScientificNames}
                onValueChange={setShowScientificNames}
                trackColor={{ false: Colors.navyDark, true: Colors.ocean }}
                thumbColor={showScientificNames ? Colors.biolumCyan : Colors.textMuted}
              />
            </SettingRow>
            <View style={styles.settingDivider} />
            <SettingRow
              label="Units"
              description={`Currently: ${lengthUnit}`}
            >
              <Pressable
                style={styles.unitToggle}
                onPress={() => setLengthUnit(lengthUnit === 'metric' ? 'imperial' : 'metric')}
              >
                <Text style={styles.unitToggleText}>
                  {lengthUnit === 'metric' ? 'Metric' : 'Imperial'}
                </Text>
              </Pressable>
            </SettingRow>
          </View>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>MediMon v1.0.0</Text>
          <Text style={styles.appInfoText}>{ALL_CREATURES.length} species in catalog</Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, accent && { color: Colors.biolumCyan }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description ? <Text style={styles.settingDesc}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  scroll: { paddingBottom: Spacing.xxl },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.ocean,
  },
  avatarText: { fontSize: 36 },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    padding: Spacing.xs,
  },
  statBox: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: 4,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  topCreatureCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.ocean + '22',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ocean,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  topCreatureLabel: {
    color: Colors.ocean,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  topCreatureName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  topCreatureCount: { color: Colors.textMuted, fontSize: 13 },
  section: { marginBottom: Spacing.md },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.biolumCyan,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  seeAllText: { color: Colors.ocean, fontSize: 13, fontWeight: '600' },
  settingsCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.navy,
    marginHorizontal: Spacing.md,
  },
  settingLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  settingDesc: { color: Colors.textMuted, fontSize: 12 },
  unitToggle: {
    backgroundColor: Colors.ocean + '22',
    borderWidth: 1,
    borderColor: Colors.ocean,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  unitToggleText: { color: Colors.ocean, fontSize: 13, fontWeight: '600' },
  appInfo: {
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
  },
  appInfoText: { color: Colors.textMuted, fontSize: 12 },
});
