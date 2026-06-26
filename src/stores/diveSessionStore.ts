import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DiveFormData } from '@/types/dive';
import type { SightingFormData } from '@/types/sighting';

type DiveStep = 1 | 2 | 3 | 4;

interface DiveSessionState {
  // Form state
  step: DiveStep;
  draft: Partial<DiveFormData>;
  pendingSightings: Omit<SightingFormData, 'diveId'>[];

  // Actions
  setStep: (step: DiveStep) => void;
  updateDraft: (data: Partial<DiveFormData>) => void;
  addPendingSighting: (sighting: Omit<SightingFormData, 'diveId'>) => void;
  removePendingSighting: (creatureId: string) => void;
  clearSession: () => void;
  hasPendingSession: () => boolean;
}

const EMPTY_DRAFT: Partial<DiveFormData> = {
  date: undefined,
  diveType: 'scuba',
  locationName: '',
  maxDepthMeters: 0,
  durationMinutes: 0,
};

export const useDiveSessionStore = create<DiveSessionState>()(
  persist(
    (set, get) => ({
      step: 1,
      draft: EMPTY_DRAFT,
      pendingSightings: [],

      setStep: (step) => set({ step }),

      updateDraft: (data) =>
        set((state) => ({ draft: { ...state.draft, ...data } })),

      addPendingSighting: (sighting) =>
        set((state) => {
          const already = state.pendingSightings.some(
            (s) => s.creatureId === sighting.creatureId
          );
          if (already) return state;
          return { pendingSightings: [...state.pendingSightings, sighting] };
        }),

      removePendingSighting: (creatureId) =>
        set((state) => ({
          pendingSightings: state.pendingSightings.filter(
            (s) => s.creatureId !== creatureId
          ),
        })),

      clearSession: () =>
        set({ step: 1, draft: EMPTY_DRAFT, pendingSightings: [] }),

      hasPendingSession: () => {
        const { draft, pendingSightings } = get();
        return !!(
          draft.locationName ||
          draft.maxDepthMeters ||
          pendingSightings.length > 0
        );
      },
    }),
    {
      name: 'dive-session',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
