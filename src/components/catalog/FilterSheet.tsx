import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useCatalogFilterStore } from '@/stores/catalogFilterStore';
import { CATEGORIES } from '@/constants/categories';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import type {
  CreatureColor,
  BodyShape,
  SizeCategory,
  Habitat,
  Season,
  IUCNStatus,
  SpottingDifficulty,
} from '@/types/creature';

const COLOR_HEX: Record<CreatureColor, string> = {
  red: '#E53935',
  orange: '#FB8C00',
  yellow: '#FDD835',
  green: '#43A047',
  blue: '#1E88E5',
  purple: '#8E24AA',
  brown: '#795548',
  grey: '#757575',
  white: '#FAFAFA',
  black: '#424242',
  pink: '#E91E63',
  transparent: Colors.seafoam,
};

const ALL_COLORS: CreatureColor[] = [
  'red','orange','yellow','green','blue','purple','brown','grey','white','black','pink','transparent',
];
const ALL_SHAPES: BodyShape[] = ['rounded','elongated','flat','spiky','tentacled','disc','star','irregular'];
const ALL_SIZES: SizeCategory[] = ['tiny','small','medium','large','huge'];
const ALL_HABITATS: Habitat[] = ['rocky','sandy','posidonia','open_water','cave','pelagic','muddy','reef'];
const ALL_SEASONS: Season[] = ['spring','summer','autumn','winter'];
const ALL_IUCN: IUCNStatus[] = ['LC','NT','VU','EN','CR','DD','NE'];
const DEPTH_OPTIONS = [10, 20, 40, 100, 200];
const DIFFICULTY_KEYS = ['', 'easy', 'moderate', 'average', 'hard', 'expert'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FilterSheet({ visible, onClose }: Props) {
  const t = useT();
  const { filter, setFilter, clearFilter } = useCatalogFilterStore();

  function toggle<T>(arr: T[] | undefined, item: T): T[] {
    const current = arr ?? [];
    return current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => { clearFilter(); }} style={styles.clearBtn}>
              <Text style={styles.clearText}>{t('filter.clearAll')}</Text>
            </Pressable>
            <Text style={styles.title}>{t('filter.title')}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Category */}
            <Section label={t('filter.category')}>
              <View style={styles.chips}>
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.label}
                    active={filter.categoryId === cat.id}
                    color={cat.color}
                    onPress={() => setFilter({ categoryId: filter.categoryId === cat.id ? null : cat.id })}
                  />
                ))}
              </View>
            </Section>

            {/* Colors */}
            <Section label={t('filter.color')}>
              <View style={styles.colorRow}>
                {ALL_COLORS.map((color) => {
                  const active = filter.colors?.includes(color) ?? false;
                  return (
                    <Pressable
                      key={color}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: COLOR_HEX[color] },
                        active && styles.colorSwatchActive,
                      ]}
                      onPress={() => setFilter({ colors: toggle(filter.colors, color) })}
                    >
                      {active && <Text style={styles.colorCheck}>✓</Text>}
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            {/* Body Shape */}
            <Section label={t('filter.shape')}>
              <View style={styles.chips}>
                {ALL_SHAPES.map((shape) => (
                  <Chip
                    key={shape}
                    label={shape}
                    active={filter.bodyShape === shape}
                    onPress={() => setFilter({ bodyShape: filter.bodyShape === shape ? null : shape })}
                  />
                ))}
              </View>
            </Section>

            {/* Size */}
            <Section label={t('filter.size')}>
              <View style={styles.chips}>
                {ALL_SIZES.map((size) => (
                  <Chip
                    key={size}
                    label={size}
                    active={filter.sizeCategories?.includes(size) ?? false}
                    onPress={() => setFilter({ sizeCategories: toggle(filter.sizeCategories, size) })}
                  />
                ))}
              </View>
            </Section>

            {/* Max Depth */}
            <Section label={t('filter.depth')}>
              <View style={styles.chips}>
                {DEPTH_OPTIONS.map((depth) => (
                  <Chip
                    key={depth}
                    label={`≤${depth}m`}
                    active={filter.depthMaxM === depth}
                    onPress={() => setFilter({ depthMaxM: filter.depthMaxM === depth ? null : depth })}
                  />
                ))}
              </View>
            </Section>

            {/* Habitat */}
            <Section label={t('filter.habitat')}>
              <View style={styles.chips}>
                {ALL_HABITATS.map((h) => (
                  <Chip
                    key={h}
                    label={h.replace('_', ' ')}
                    active={filter.habitats?.includes(h) ?? false}
                    onPress={() => setFilter({ habitats: toggle(filter.habitats, h) })}
                  />
                ))}
              </View>
            </Section>

            {/* Spotting Difficulty */}
            <Section label={t('filter.difficulty')}>
              <View style={styles.chips}>
                {([1,2,3,4,5] as SpottingDifficulty[]).map((d) => (
                  <Chip
                    key={d}
                    label={t(`filter.difficulty.${DIFFICULTY_KEYS[d]}`)}
                    active={filter.spottingDifficulty === d}
                    onPress={() => setFilter({ spottingDifficulty: filter.spottingDifficulty === d ? null : d })}
                  />
                ))}
              </View>
            </Section>

            {/* Season */}
            <Section label={t('filter.season')}>
              <View style={styles.chips}>
                {ALL_SEASONS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    active={filter.seasons?.includes(s) ?? false}
                    onPress={() => setFilter({ seasons: toggle(filter.seasons, s) })}
                  />
                ))}
              </View>
            </Section>

            {/* Conservation Status */}
            <Section label={t('filter.conservation')}>
              <View style={styles.chips}>
                {ALL_IUCN.map((status) => (
                  <Chip
                    key={status}
                    label={status}
                    active={filter.conservationStatuses?.includes(status) ?? false}
                    onPress={() => setFilter({ conservationStatuses: toggle(filter.conservationStatuses, status) })}
                  />
                ))}
              </View>
            </Section>

            <View style={{ height: Spacing.xl }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={styles.applyBtn} onPress={onClose}>
              <Text style={styles.applyText}>{t('filter.apply')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({
  label, active, color, onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  const activeColor = color ?? Colors.biolumCyan;
  return (
    <Pressable
      style={[
        styles.chip,
        active && { backgroundColor: activeColor + '33', borderColor: activeColor },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && { color: activeColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.navyLight,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ocean + '33',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  clearBtn: { padding: Spacing.xs },
  clearText: { color: Colors.coral, fontSize: 14, fontWeight: '600' },
  closeBtn: { padding: Spacing.xs },
  closeText: { color: Colors.textMuted, fontSize: 18 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  section: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.textMuted + '55',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: Colors.biolumCyan,
  },
  colorCheck: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.ocean + '33',
  },
  applyBtn: {
    backgroundColor: Colors.ocean,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
  },
  applyText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
