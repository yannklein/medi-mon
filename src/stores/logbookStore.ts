import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DiveRecord, DiveFormData } from '@/types/dive';
import type { SightingRecord, SightingFormData } from '@/types/sighting';

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface LogbookState {
  dives: DiveRecord[];
  sightings: SightingRecord[];

  addDive: (form: DiveFormData, sightings?: Omit<SightingFormData, 'diveId'>[]) => string;
  updateDive: (id: string, patch: Partial<DiveFormData>) => void;
  deleteDive: (id: string) => void;

  addSighting: (form: SightingFormData) => string;
  deleteSighting: (id: string) => void;

  getSightingsForDive: (diveId: string) => SightingRecord[];
  getSightingsForCreature: (creatureId: string) => SightingRecord[];
  getSpottedCreatureIds: () => Set<string>;
}

export const useLogbookStore = create<LogbookState>()(
  persist(
    (set, get) => ({
      dives: [],
      sightings: [],

      addDive: (form, pendingSightings = []) => {
        const now = Date.now();
        const diveId = uuid();
        const dive: DiveRecord = { ...form, id: diveId, createdAt: now, updatedAt: now };

        const newSightings: SightingRecord[] = pendingSightings.map((s) => ({
          ...s,
          diveId,
          id: uuid(),
          createdAt: now,
        }));

        set((state) => ({
          dives: [dive, ...state.dives],
          sightings: [...newSightings, ...state.sightings],
        }));

        return diveId;
      },

      updateDive: (id, patch) => {
        set((state) => ({
          dives: state.dives.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d
          ),
        }));
      },

      deleteDive: (id) => {
        set((state) => ({
          dives: state.dives.filter((d) => d.id !== id),
          sightings: state.sightings.filter((s) => s.diveId !== id),
        }));
      },

      addSighting: (form) => {
        const id = uuid();
        const record: SightingRecord = { ...form, id, createdAt: Date.now() };
        set((state) => ({ sightings: [record, ...state.sightings] }));
        return id;
      },

      deleteSighting: (id) => {
        set((state) => ({ sightings: state.sightings.filter((s) => s.id !== id) }));
      },

      getSightingsForDive: (diveId) => get().sightings.filter((s) => s.diveId === diveId),

      getSightingsForCreature: (creatureId) =>
        get().sightings.filter((s) => s.creatureId === creatureId),

      getSpottedCreatureIds: () => new Set(get().sightings.map((s) => s.creatureId)),
    }),
    {
      name: 'logbook',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
