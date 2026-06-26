export type CategoryId =
  | 'fish'
  | 'cephalopod'
  | 'crustacean'
  | 'mollusk'
  | 'echinoderm'
  | 'shark_ray'
  | 'sea_turtle'
  | 'marine_mammal'
  | 'jellyfish'
  | 'coral_sponge'
  | 'seagrass_algae';

export interface Category {
  id: CategoryId;
  label: string;
  pluralLabel: string;
  color: string;
  sortOrder: number;
}

export const CATEGORIES: Category[] = [
  { id: 'fish', label: 'Fish', pluralLabel: 'Fish', color: '#0D7EA5', sortOrder: 1 },
  { id: 'cephalopod', label: 'Cephalopod', pluralLabel: 'Cephalopods', color: '#7B2FBE', sortOrder: 2 },
  { id: 'crustacean', label: 'Crustacean', pluralLabel: 'Crustaceans', color: '#E65100', sortOrder: 3 },
  { id: 'mollusk', label: 'Mollusk', pluralLabel: 'Mollusks', color: '#558B2F', sortOrder: 4 },
  { id: 'echinoderm', label: 'Echinoderm', pluralLabel: 'Echinoderms', color: '#AD1457', sortOrder: 5 },
  { id: 'shark_ray', label: 'Shark & Ray', pluralLabel: 'Sharks & Rays', color: '#37474F', sortOrder: 6 },
  { id: 'sea_turtle', label: 'Sea Turtle', pluralLabel: 'Sea Turtles', color: '#2E7D32', sortOrder: 7 },
  { id: 'marine_mammal', label: 'Marine Mammal', pluralLabel: 'Marine Mammals', color: '#1565C0', sortOrder: 8 },
  { id: 'jellyfish', label: 'Jellyfish', pluralLabel: 'Jellyfish & Cnidarians', color: '#C2185B', sortOrder: 9 },
  { id: 'coral_sponge', label: 'Coral & Sponge', pluralLabel: 'Corals & Sponges', color: '#FF6B6B', sortOrder: 10 },
  { id: 'seagrass_algae', label: 'Seagrass & Algae', pluralLabel: 'Seagrass & Algae', color: '#1B5E20', sortOrder: 11 },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]));
