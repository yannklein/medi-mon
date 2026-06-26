export type DiveType = 'scuba' | 'freedive' | 'snorkel';

export interface DiveFormData {
  date: Date;
  durationMinutes: number;
  locationName: string;
  locationLat: number | null;
  locationLon: number | null;
  maxDepthMeters: number;
  avgDepthMeters: number | null;
  waterTempCelsius: number | null;
  visibilityMeters: number | null;
  diveType: DiveType;
  buddyName: string;
  diveCenterName: string;
  notes: string;
  rating: 1 | 2 | 3 | 4 | 5 | null;
}

export interface DiveRecord extends DiveFormData {
  id: string;
  createdAt: number;
  updatedAt: number;
}
