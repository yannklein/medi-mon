import type { Creature } from '@/types/creature';
import type { Lang } from '@/i18n';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const seedData = require('@/data/creatures/seed.json') as {
  version: string;
  creatures: Creature[];
};

let creatureMap: Map<string, Creature> | null = null;
let catalogVersion = '';

export function loadCreatures(): void {
  if (creatureMap !== null) return; // already loaded
  creatureMap = new Map<string, Creature>();
  for (const creature of seedData.creatures) {
    creatureMap.set(creature.id, creature);
  }
  catalogVersion = seedData.version;
}

export function getCreatureById(id: string): Creature | undefined {
  return creatureMap?.get(id);
}

export function getAllCreatures(): Creature[] {
  if (!creatureMap) loadCreatures();
  return Array.from(creatureMap!.values());
}

export function getCatalogVersion(): string {
  return catalogVersion;
}

export function getCreatureCount(): number {
  return creatureMap?.size ?? 0;
}

export function getCreatureName(creature: Creature, lang: Lang): string {
  if (lang === 'en' || !creature.localizedNames) return creature.commonName;
  return creature.localizedNames[lang as 'fr' | 'es' | 'pt'] ?? creature.commonName;
}
