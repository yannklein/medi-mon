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
import { getAllCreatures, getCreatureById, getCreatureName } from '@/services/seedService';
import { DiveCard } from '@/components/logbook/DiveCard';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useT, LANG_LABELS, type Lang } from '@/i18n';

// ─── Level system ────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, xpNeeded: 0 },
  { level: 2, xpNeeded: 100 },
  { level: 3, xpNeeded: 300 },
  { level: 4, xpNeeded: 700 },
  { level: 5, xpNeeded: 1500 },
  { level: 6, xpNeeded: 3000 },
  { level: 7, xpNeeded: 6000 },
  { level: 8, xpNeeded: 12000 },
];

function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xpNeeded) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const xpIntoLevel = next ? xp - current.xpNeeded : 0;
  const xpForNext = next ? next.xpNeeded - current.xpNeeded : 1;
  const progress = next ? Math.min(1, xpIntoLevel / xpForNext) : 1;
  return { current, next, progress, xpIntoLevel, xpForNext };
}

// ─── Badge definitions ───────────────────────────────────────────────────────
const BADGE_EMOJIS: Record<string, string> = {
  first_sighting: '👁️', first_dive: '🤿', explorer_10: '🗺️', explorer_25: '🔭',
  explorer_50: '📚', explorer_100: '🏆', shark_watcher: '🦈', turtle_saver: '🐢',
  octopus: '🐙', deep_diver: '🌊', rare_find: '💎', epic_find: '🌟',
  legendary_find: '👑', diver_10: '📓', night_spotter: '🌙',
};
const BADGE_IDS = Object.keys(BADGE_EMOJIS);

const ALL_CREATURES = getAllCreatures();

export default function ProfileScreen() {
  const t = useT();
  const dives = useLogbookStore((s) => s.dives);
  const sightings = useLogbookStore((s) => s.sightings);
  const getSightingsForDive = useLogbookStore((s) => s.getSightingsForDive);
  const spottedIds = useMemo(() => new Set(sightings.map((s) => s.creatureId)), [sightings]);

  const { showScientificNames, setShowScientificNames, lengthUnit, setLengthUnit, language, setLanguage } = useUIStore();

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

  // ─── XP ────────────────────────────────────────────────────────────────────
  const totalXP = useMemo(() => {
    return sightings.reduce((sum, s) => {
      const c = getCreatureById(s.creatureId);
      return sum + (c?.points ?? 0);
    }, 0);
  }, [sightings]);
  const levelInfo = getLevelInfo(totalXP);

  // ─── Badges ────────────────────────────────────────────────────────────────
  const earnedBadgeIds = useMemo(() => {
    const earned = new Set<string>();
    if (sightings.length > 0) earned.add('first_sighting');
    if (dives.length > 0) earned.add('first_dive');
    if (dives.length >= 10) earned.add('diver_10');
    if (spottedIds.size >= 10) earned.add('explorer_10');
    if (spottedIds.size >= 25) earned.add('explorer_25');
    if (spottedIds.size >= 50) earned.add('explorer_50');
    if (spottedIds.size >= 100) earned.add('explorer_100');

    let nocturnalCount = 0;
    for (const s of sightings) {
      const c = getCreatureById(s.creatureId);
      if (!c) continue;
      if (c.categoryId === 'shark_ray') earned.add('shark_watcher');
      if (c.categoryId === 'sea_turtle') earned.add('turtle_saver');
      if (c.categoryId === 'cephalopod') earned.add('octopus');
      if (c.rarity === 'rare' || c.rarity === 'epic' || c.rarity === 'legendary') earned.add('rare_find');
      if (c.rarity === 'epic' || c.rarity === 'legendary') earned.add('epic_find');
      if (c.rarity === 'legendary') earned.add('legendary_find');
      if (s.depthObservedMeters != null && s.depthObservedMeters >= 30) earned.add('deep_diver');
      if (c.activityPattern === 'nocturnal') nocturnalCount++;
    }
    if (nocturnalCount >= 5) earned.add('night_spotter');
    return earned;
  }, [sightings, dives, spottedIds]);

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
          <Text style={styles.title}>{t('profile.title')}</Text>
          <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatBox label={t('profile.stats.dives')} value={String(dives.length)} />
          <StatBox
            label={t('profile.stats.time')}
            value={dives.length ? `${stats.totalHours}h ${stats.totalMins}m` : '—'}
          />
          <StatBox
            label={t('profile.stats.depth')}
            value={stats.deepest > 0 ? `${stats.deepest}m` : '—'}
          />
          <StatBox
            label={t('profile.stats.species')}
            value={`${spottedIds.size}/${ALL_CREATURES.length}`}
            accent
          />
        </View>

        {/* XP / Level */}
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View style={styles.levelBadgeCircle}>
              <Text style={styles.levelBadgeNum}>{levelInfo.current.level}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelTitle}>{t(`level.${levelInfo.current.level}`)}</Text>
              <Text style={styles.levelXP}>
                {levelInfo.next
                  ? t('profile.xp.toNext', totalXP, levelInfo.xpForNext - levelInfo.xpIntoLevel)
                  : t('profile.xp.max', totalXP)}
              </Text>
            </View>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${Math.round(levelInfo.progress * 100)}%` as any }]} />
          </View>
          {levelInfo.next && (
            <Text style={styles.xpBarLabel}>
              {t('profile.xp.bar', levelInfo.xpIntoLevel, levelInfo.xpForNext, t(`level.${levelInfo.next.level}`))}
            </Text>
          )}
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {t('profile.badges.title')} — {earnedBadgeIds.size}/{BADGE_IDS.length}
            </Text>
          </View>
          <View style={styles.badgeGrid}>
            {BADGE_IDS.map((id) => {
              const earned = earnedBadgeIds.has(id);
              return (
                <View key={id} style={[styles.badgeItem, !earned && styles.badgeItemLocked]}>
                  <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>
                    {earned ? BADGE_EMOJIS[id] : '🔒'}
                  </Text>
                  <Text style={[styles.badgeTitle, !earned && styles.badgeTitleLocked]} numberOfLines={2}>
                    {t(`badge.${id}.title`)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {stats.topCreature && (
          <View style={styles.topCreatureCard}>
            <Text style={styles.topCreatureLabel}>{t('profile.mostSpotted.label')}</Text>
            <Text style={styles.topCreatureName}>{getCreatureName(stats.topCreature, language)}</Text>
            <Text style={styles.topCreatureCount}>{t('profile.mostSpotted.count', stats.topCount)}</Text>
          </View>
        )}

        {/* Recent dives */}
        {recentDives.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('profile.recentDives.title')}</Text>
              <Pressable onPress={() => router.push('/logbook')}>
                <Text style={styles.seeAllText}>{t('profile.recentDives.seeAll')}</Text>
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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('profile.settings.title')}</Text>
          </View>
          <View style={styles.settingsCard}>
            <SettingRow
              label={t('profile.settings.showSci')}
              description={t('profile.settings.showSciDesc')}
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
              label={t('profile.settings.units')}
              description={lengthUnit === 'metric' ? t('profile.settings.metric') : t('profile.settings.imperial')}
            >
              <Pressable
                style={styles.unitToggle}
                onPress={() => setLengthUnit(lengthUnit === 'metric' ? 'imperial' : 'metric')}
              >
                <Text style={styles.unitToggleText}>
                  {lengthUnit === 'metric' ? t('profile.settings.metric') : t('profile.settings.imperial')}
                </Text>
              </Pressable>
            </SettingRow>
            <View style={styles.settingDivider} />
            <SettingRow
              label={t('profile.settings.language')}
              description={t('profile.settings.languageDesc')}
            >
              <View style={styles.langRow}>
                {(['en', 'fr', 'es', 'pt'] as Lang[]).map((lang) => (
                  <Pressable
                    key={lang}
                    style={[styles.langBtn, language === lang && styles.langBtnActive]}
                    onPress={() => setLanguage(lang)}
                  >
                    <Text style={[styles.langBtnText, language === lang && styles.langBtnTextActive]}>
                      {lang.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </SettingRow>
          </View>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>{t('profile.appInfo')}</Text>
          <Text style={styles.appInfoText}>{t('profile.appInfo.species', ALL_CREATURES.length)}</Text>
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
  levelCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.biolumCyan + '44',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  levelBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.biolumCyan + '22',
    borderWidth: 2,
    borderColor: Colors.biolumCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeNum: { color: Colors.biolumCyan, fontSize: 18, fontWeight: '800' },
  levelTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  levelXP: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  xpBarBg: {
    height: 8,
    backgroundColor: Colors.navyDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 8,
    backgroundColor: Colors.biolumCyan,
    borderRadius: 4,
  },
  xpBarLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  badgeItem: {
    width: '22%',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.biolumCyan + '44',
  },
  badgeItemLocked: {
    borderColor: 'transparent',
    opacity: 0.4,
  },
  badgeEmoji: { fontSize: 24 },
  badgeEmojiLocked: { fontSize: 20 },
  badgeTitle: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  badgeTitleLocked: { color: Colors.textMuted },
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
  langRow: { flexDirection: 'row', gap: 4 },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.textMuted + '44',
  },
  langBtnActive: {
    backgroundColor: Colors.biolumCyan + '22',
    borderColor: Colors.biolumCyan,
  },
  langBtnText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  langBtnTextActive: { color: Colors.biolumCyan },
  appInfo: {
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
  },
  appInfoText: { color: Colors.textMuted, fontSize: 12 },
});
