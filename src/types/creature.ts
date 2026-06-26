import type { CategoryId } from '@/constants/categories';

export type CreatureColor =
  | 'red' | 'orange' | 'yellow' | 'green' | 'blue'
  | 'purple' | 'brown' | 'grey' | 'white' | 'black'
  | 'pink' | 'transparent';

export type BodyShape =
  | 'rounded' | 'elongated' | 'flat' | 'spiky' | 'tentacled' | 'disc' | 'star' | 'irregular';

export type SizeCategory = 'tiny' | 'small' | 'medium' | 'large' | 'huge';

export type DepthZone = 'littoral' | 'infralittoral' | 'circalittoral' | 'bathyal';

export type Habitat =
  | 'rocky' | 'sandy' | 'posidonia' | 'open_water' | 'cave' | 'pelagic' | 'muddy' | 'reef';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type ActivityPattern = 'diurnal' | 'nocturnal' | 'both';

export type IUCNStatus = 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'DD' | 'NE';

export type SpottingDifficulty = 1 | 2 | 3 | 4 | 5;

export interface Creature {
  id: string;                        // slug: "octopus-vulgaris"
  commonName: string;
  scientificName: string;
  categoryId: CategoryId;
  subcategory: string;

  // Visual (primary searchability)
  primaryColors: CreatureColor[];
  bodyShape: BodyShape;
  sizeCategory: SizeCategory;
  sizeMinCm: number;
  sizeMaxCm: number;

  // Habitat
  depthMinM: number;
  depthMaxM: number;
  depthZones: DepthZone[];
  habitats: Habitat[];

  // Spotting
  spottingDifficulty: SpottingDifficulty;
  bestSeasons: Season[];
  activityPattern: ActivityPattern;
  spottingTips: string;

  // Info
  description: string;
  behavior: string;
  diet: string;
  funFacts: string[];
  conservationStatus: IUCNStatus;
  isProtected: boolean;
  isEndemic: boolean;

  // Tags
  tags: string[];  // "venomous" | "camouflage" | "schooling" | "invasive" | ...

  // Display
  emoji?: string;            // e.g. "🐙" — shown in cards & detail when no photo

  // Media
  wikiImageUrl?: string;     // remote image URL (iNaturalist / Wikipedia)
  thumbnailAsset: string;    // require()-able local asset path string
  photoAssets: string[];
  illustrationAsset: string;
}

export type CreatureFilter = {
  categoryId?: CategoryId | null;
  colors?: CreatureColor[];
  bodyShape?: BodyShape | null;
  sizeCategories?: SizeCategory[];
  depthMaxM?: number | null;
  habitats?: Habitat[];
  spottingDifficulty?: SpottingDifficulty | null;
  seasons?: Season[];
  conservationStatuses?: IUCNStatus[];
  tags?: string[];
  searchQuery?: string;
};
