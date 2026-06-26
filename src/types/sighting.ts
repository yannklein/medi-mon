export type SightingQuantity = 'one' | 'few' | 'many';
export type SightingConfidence = 'certain' | 'probable' | 'unsure';

export interface SightingFormData {
  creatureId: string;
  diveId: string | null;
  spottedAt: Date;
  depthObservedMeters: number | null;
  quantity: SightingQuantity | null;
  behaviorNotes: string;
  photoUri: string | null;
  confidence: SightingConfidence;
}

export interface SightingRecord extends SightingFormData {
  id: string;
  createdAt: number;
}
