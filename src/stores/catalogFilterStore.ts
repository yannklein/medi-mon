import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreatureFilter } from '@/types/creature';

interface CatalogFilterState {
  filter: CreatureFilter;
  setFilter: (filter: Partial<CreatureFilter>) => void;
  clearFilter: () => void;
  hasActiveFilters: () => boolean;
}

const EMPTY_FILTER: CreatureFilter = {};

export const useCatalogFilterStore = create<CatalogFilterState>()(
  persist(
    (set, get) => ({
      filter: EMPTY_FILTER,

      setFilter: (partial) =>
        set((state) => ({ filter: { ...state.filter, ...partial } })),

      clearFilter: () => set({ filter: EMPTY_FILTER }),

      hasActiveFilters: () => {
        const f = get().filter;
        return !!(
          f.categoryId ||
          (f.colors && f.colors.length > 0) ||
          f.bodyShape ||
          (f.sizeCategories && f.sizeCategories.length > 0) ||
          f.depthMaxM != null ||
          (f.habitats && f.habitats.length > 0) ||
          f.spottingDifficulty != null ||
          (f.seasons && f.seasons.length > 0) ||
          (f.tags && f.tags.length > 0) ||
          (f.searchQuery && f.searchQuery.trim().length > 0)
        );
      },
    }),
    {
      name: 'catalog-filter',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist search query across sessions
      partialize: (state) => ({
        filter: { ...state.filter, searchQuery: undefined },
      }),
    }
  )
);
