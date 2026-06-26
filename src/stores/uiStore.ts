import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CatalogViewMode = 'grid' | 'list';
type LengthUnit = 'metric' | 'imperial';

interface UIState {
  // Preferences (persisted)
  catalogViewMode: CatalogViewMode;
  showScientificNames: boolean;
  lengthUnit: LengthUnit;
  hasOnboarded: boolean;

  // Hydration flag (not persisted — set to true once AsyncStorage loads)
  _hasHydrated: boolean;

  // Transient
  isFilterSheetOpen: boolean;
  isCreaturePickerOpen: boolean;

  // Actions
  setCatalogViewMode: (mode: CatalogViewMode) => void;
  setShowScientificNames: (show: boolean) => void;
  setLengthUnit: (unit: LengthUnit) => void;
  setFilterSheetOpen: (open: boolean) => void;
  setCreaturePickerOpen: (open: boolean) => void;
  setHasOnboarded: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      catalogViewMode: 'grid',
      showScientificNames: false,
      lengthUnit: 'metric',
      hasOnboarded: false,
      _hasHydrated: false,
      isFilterSheetOpen: false,
      isCreaturePickerOpen: false,

      setCatalogViewMode: (mode) => set({ catalogViewMode: mode }),
      setShowScientificNames: (show) => set({ showScientificNames: show }),
      setLengthUnit: (unit) => set({ lengthUnit: unit }),
      setFilterSheetOpen: (open) => set({ isFilterSheetOpen: open }),
      setCreaturePickerOpen: (open) => set({ isCreaturePickerOpen: open }),
      setHasOnboarded: (value) => set({ hasOnboarded: value }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'ui-prefs',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        catalogViewMode: state.catalogViewMode,
        showScientificNames: state.showScientificNames,
        lengthUnit: state.lengthUnit,
        hasOnboarded: state.hasOnboarded,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);
