#!/usr/bin/env node
/**
 * Adds rarity, points, and specialAbility to every creature in seed.json
 * based on spottingDifficulty, conservationStatus, categoryId, and tags.
 *
 * Rarity tiers:
 *   common    → difficulty 1–2, LC
 *   uncommon  → difficulty 2–3, NT
 *   rare      → difficulty 3–4, VU
 *   epic      → difficulty 4–5, EN
 *   legendary → difficulty 5, CR / specific iconic species
 *
 * Points:
 *   common    → 10
 *   uncommon  → 25
 *   rare      → 60
 *   epic      → 150
 *   legendary → 400
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, '../src/data/creatures/seed.json');

const data = JSON.parse(readFileSync(SEED_PATH, 'utf8'));

// Hand-curated overrides for iconic/special creatures
const LEGENDARY_IDS = new Set([
  'bluefin-tuna',
  'great-white-shark',
  'hammerhead-shark',
  'thresher-shark',
  'whale-shark',
  'basking-shark',
  'angel-shark',
  'loggerhead-sea-turtle',
  'green-sea-turtle',
  'leatherback-sea-turtle',
  'caretta-caretta',
  'sperm-whale',
  'fin-whale',
  'blue-whale',
  'monk-seal',
  'mediterranean-monk-seal',
  'oarfish',
  'ocean-sunfish',
  'mola-mola',
  'giant-devil-ray',
  'mobula-mobulari',
]);

const EPIC_IDS = new Set([
  'striped-dolphin',
  'bottlenose-dolphin',
  'common-dolphin',
  'short-beaked-common-dolphin',
  'long-finned-pilot-whale',
  'rissos-dolphin',
  'common-bottlenose-dolphin',
  'cuvier-beaked-whale',
  'blue-shark',
  'shortfin-mako',
  'smooth-hammerhead',
  'common-stingray',
  'common-eagle-ray',
  'spotted-eagle-ray',
  'sea-horse-hippocampus-guttulatus',
  'hippocampus-guttulatus',
  'long-snouted-seahorse',
  'weedy-seadragon',
  'mediterranean-seahorse',
  'giant-moray',
  'mediterranean-moray',
  'conger-eel',
  'electric-ray',
  'torpedo-torpedo',
  'greater-weever',
  'red-scorpionfish',
  'scorpaena-scrofa',
  'common-dentex',
  'european-sea-bass',
  'european-lobster',
  'spiny-lobster',
  'palinurus-elephas',
  'fluted-giant-clam',
  'date-mussel',
  'noble-pen-shell',
  'pinna-nobilis',
  'red-coral',
  'corallium-rubrum',
  'fan-mussel',
]);

// Special abilities keyed by tag/category/id
function getSpecialAbility(c) {
  const abilities = [];
  const tags = c.tags ?? [];
  const id = c.id;

  if (tags.includes('venomous')) abilities.push('Venomous Sting');
  if (tags.includes('camouflage')) abilities.push('Master of Camouflage');
  if (tags.includes('bioluminescent')) abilities.push('Bioluminescence');
  if (tags.includes('electric')) abilities.push('Electric Shock');
  if (tags.includes('schooling')) abilities.push('Swarm Tactics');
  if (tags.includes('symbiotic')) abilities.push('Symbiosis');
  if (tags.includes('cleaner_fish')) abilities.push('Parasite Cleaner');
  if (tags.includes('invasive')) abilities.push('Invasive Spreader');
  if (c.categoryId === 'cephalopod') {
    abilities.push('Ink Cloud');
    if (!abilities.includes('Master of Camouflage')) abilities.push('Colour Changer');
  }
  if (c.categoryId === 'shark_ray') abilities.push("Apex Predator's Sense");
  if (c.categoryId === 'sea_turtle') abilities.push('Ancient Navigator');
  if (c.categoryId === 'marine_mammal') abilities.push('Echolocation');
  if (c.categoryId === 'jellyfish' && !abilities.includes('Venomous Sting')) abilities.push('Trailing Tentacles');

  // Id-specific
  if (id === 'red-scorpionfish' || id === 'scorpaena-scrofa') abilities.push('Ambush Predator');
  if (id === 'conger-eel' || id === 'mediterranean-moray' || id === 'giant-moray') abilities.push('Lightning Bite');
  if (id === 'electric-ray' || id === 'torpedo-torpedo') abilities.push('Electric Torpedo');
  if (id === 'pinna-nobilis' || id === 'noble-pen-shell' || id === 'fan-mussel') abilities.push('Living Anchor');
  if (id === 'mola-mola' || id === 'ocean-sunfish') abilities.push('Solar Basker');
  if (id === 'oarfish') abilities.push('Deep Sea Legend');
  if (id === 'basking-shark') abilities.push('Filter Feeder Giant');
  if (id === 'red-coral' || id === 'corallium-rubrum') abilities.push('Reef Builder');

  return abilities.length > 0 ? abilities : undefined;
}

function getRarity(c) {
  if (LEGENDARY_IDS.has(c.id)) return 'legendary';
  if (c.conservationStatus === 'CR') return 'legendary';
  if (EPIC_IDS.has(c.id)) return 'epic';
  if (c.conservationStatus === 'EN') return 'epic';
  if (c.spottingDifficulty === 5) return 'epic';

  if (c.conservationStatus === 'VU') return 'rare';
  if (c.spottingDifficulty === 4) return 'rare';

  if (c.conservationStatus === 'NT') return 'uncommon';
  if (c.spottingDifficulty === 3) return 'uncommon';

  return 'common';
}

const POINTS = {
  common: 10,
  uncommon: 25,
  rare: 60,
  epic: 150,
  legendary: 400,
};

let updated = 0;
for (const c of data.creatures) {
  c.rarity = getRarity(c);
  c.points = POINTS[c.rarity];
  const ab = getSpecialAbility(c);
  if (ab && ab.length > 0) {
    c.specialAbility = ab;
  } else {
    delete c.specialAbility;
  }
  updated++;
}

writeFileSync(SEED_PATH, JSON.stringify(data, null, 2));
console.log(`Updated ${updated} creatures with rarity/points/specialAbility.`);

// Print summary
const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
for (const c of data.creatures) counts[c.rarity]++;
console.log('Rarity distribution:', counts);
