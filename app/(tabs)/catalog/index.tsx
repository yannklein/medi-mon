import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllCreatures } from '@/services/seedService';
import { applyFilters } from '@/utils/filterEngine';
import { useCatalogFilterStore } from '@/stores/catalogFilterStore';
import { useUIStore } from '@/stores/uiStore';
import { useLogbookStore } from '@/stores/logbookStore';
import { CATEGORIES } from '@/constants/categories';
import { CreatureCard } from '@/components/catalog/CreatureCard';
import { FilterSheet } from '@/components/catalog/FilterSheet';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import type { Creature } from '@/types/creature';

const ALL_CREATURES = getAllCreatures();

export default function CatalogScreen() {
  const t = useT();
  const { filter, setFilter, clearFilter, hasActiveFilters } = useCatalogFilterStore();
  const { catalogViewMode, setCatalogViewMode } = useUIStore();
  const sightings = useLogbookStore((s) => s.sightings);
  const spottedIds = useMemo(() => new Set(sightings.map((s) => s.creatureId)), [sightings]);

  const [filterVisible, setFilterVisible] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const SEARCH_HINTS = t('catalog.searchHints').split(',');

  const filtered = useMemo(() => applyFilters(ALL_CREATURES, filter), [filter]);
  const isGrid = catalogViewMode === 'grid';

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filter.categoryId) n++;
    if (filter.colors?.length) n++;
    if (filter.bodyShape) n++;
    if (filter.sizeCategories?.length) n++;
    if (filter.depthMaxM != null) n++;
    if (filter.habitats?.length) n++;
    if (filter.spottingDifficulty != null) n++;
    if (filter.seasons?.length) n++;
    if (filter.conservationStatuses?.length) n++;
    if (filter.tags?.length) n++;
    return n;
  }, [filter]);

  const renderItem = ({ item }: { item: Creature }) => (
    <CreatureCard
      creature={item}
      compact={isGrid}
      spotted={spottedIds.has(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View style={styles.pageIconCircle}>
          <Text style={styles.pageIconEmoji}>🐠</Text>
        </View>
        <Text style={styles.pageTitle}>{t('catalog.title')}</Text>
        <Text style={styles.pageSubtitle}>{t('catalog.subtitle', ALL_CREATURES.length)}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('catalog.searchPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            value={filter.searchQuery ?? ''}
            onChangeText={(q) => setFilter({ searchQuery: q })}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        {/* Filter button */}
        <Pressable
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={[styles.filterBtnText, activeFilterCount > 0 && styles.filterBtnTextActive]}>
            ⚙ {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </Text>
        </Pressable>
        {/* View toggle */}
        <Pressable style={styles.viewToggle} onPress={() => setCatalogViewMode(isGrid ? 'list' : 'grid')}>
          <Text style={styles.viewToggleText}>{isGrid ? '☰' : '⊞'}</Text>
        </Pressable>
      </View>

      {/* Search hint chips — shown when search bar is focused and empty */}
      {searchFocused && !filter.searchQuery && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hintChips}
          keyboardShouldPersistTaps="always"
        >
          {SEARCH_HINTS.map((hint) => (
            <Pressable
              key={hint}
              style={styles.hintChip}
              onPress={() => setFilter({ searchQuery: hint })}
            >
              <Text style={styles.hintChipText}>{hint}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Category chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChips}
        style={styles.categoryRow}
        renderItem={({ item: cat }) => (
          <Pressable
            style={[
              styles.catChip,
              filter.categoryId === cat.id && { backgroundColor: cat.color + '33', borderColor: cat.color },
            ]}
            onPress={() => setFilter({ categoryId: filter.categoryId === cat.id ? null : cat.id })}
          >
            <Text
              style={[
                styles.catChipText,
                filter.categoryId === cat.id && { color: cat.color },
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        )}
        ListHeaderComponent={
          <Pressable
            style={[styles.catChip, !filter.categoryId && styles.catChipAll]}
            onPress={() => setFilter({ categoryId: null })}
          >
            <Text style={[styles.catChipText, !filter.categoryId && { color: Colors.biolumCyan }]}>
              {t('catalog.all')}
            </Text>
          </Pressable>
        }
      />

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>{t('catalog.speciesCount', filtered.length)}</Text>
        {hasActiveFilters() && (
          <Pressable onPress={clearFilter}>
            <Text style={styles.clearText}>{t('catalog.clearFilters')}</Text>
          </Pressable>
        )}
      </View>

      {/* key forces remount when numColumns changes — required by FlatList */}
      <FlatList
        key={isGrid ? 'grid' : 'list'}
        data={filtered}
        keyExtractor={(c) => c.id}
        numColumns={isGrid ? 2 : 1}
        contentContainerStyle={isGrid ? styles.gridContent : styles.listContent}
        columnWrapperStyle={isGrid ? styles.gridRow : undefined}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState />}
      />

      <FilterSheet visible={filterVisible} onClose={() => setFilterVisible(false)} />
    </SafeAreaView>
  );
}

function EmptyState() {
  const t = useT();
  const { clearFilter } = useCatalogFilterStore();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{t('catalog.noResults.title')}</Text>
      <Text style={styles.emptySubtitle}>{t('catalog.noResults.subtitle')}</Text>
      <Pressable style={styles.emptyBtn} onPress={clearFilter}>
        <Text style={styles.emptyBtnText}>{t('catalog.noResults.btn')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  pageHeader: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 4,
  },
  pageIconCircle: {
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
  pageIconEmoji: { fontSize: 30 },
  pageTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  filterBtn: {
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnActive: {
    borderColor: Colors.biolumCyan,
  },
  filterBtnText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  filterBtnTextActive: {
    color: Colors.biolumCyan,
  },
  viewToggle: {
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleText: {
    color: Colors.textMuted,
    fontSize: 18,
  },
  hintChips: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  hintChip: {
    backgroundColor: Colors.ocean + '22',
    borderWidth: 1,
    borderColor: Colors.ocean + '66',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  hintChipText: {
    color: Colors.ocean,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryRow: {
    flexShrink: 0,
  },
  categoryChips: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  catChip: {
    borderWidth: 1,
    borderColor: Colors.textMuted + '44',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
  },
  catChipAll: {
    borderColor: Colors.biolumCyan,
  },
  catChipText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  resultsText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  clearText: {
    color: Colors.coral,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
  },
  gridContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  gridRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyBtn: {
    backgroundColor: Colors.ocean,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  emptyBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
