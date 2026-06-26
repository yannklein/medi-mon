/**
 * Fetches photo URLs from iNaturalist API (open-data, CC-licensed photos)
 * for each creature in seed.json, then falls back to Wikipedia.
 * Run: node scripts/fetch-wiki-images.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, '../src/data/creatures/seed.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf8'));

const HEADERS = { 'User-Agent': 'MediMon/1.0 (educational project)' };

async function iNaturalistPhoto(scientificName) {
  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&is_active=true&rank=species&limit=1`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    const taxon = data?.results?.[0];
    if (!taxon) return null;
    // Prefer the taxon whose name exactly matches
    return taxon.default_photo?.medium_url ?? taxon.default_photo?.url ?? null;
  } catch {
    return null;
  }
}

async function wikipediaPhoto(scientificName, commonName) {
  // Try REST summary with scientific name
  for (const q of [scientificName, commonName]) {
    const title = q.replace(/ /g, '_');
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { headers: HEADERS }
      );
      if (res.ok) {
        const d = await res.json();
        const src = d?.thumbnail?.source;
        if (src) return src.replace(/\/\d+px-/, '/600px-');
      }
    } catch {}
  }
  return null;
}

let updated = 0;
const failed = [];

for (const creature of seed.creatures) {
  process.stdout.write(`${creature.scientificName} ... `);

  if (creature.wikiImageUrl) {
    console.log('already set');
    updated++;
    continue;
  }

  let img = await iNaturalistPhoto(creature.scientificName);

  if (!img) img = await wikipediaPhoto(creature.scientificName, creature.commonName);

  if (img) {
    creature.wikiImageUrl = img;
    console.log('✓');
    updated++;
  } else {
    console.log('✗');
    failed.push(creature.scientificName);
  }

  await new Promise((r) => setTimeout(r, 250));
}

writeFileSync(seedPath, JSON.stringify(seed, null, 2));
console.log(`\nDone. ${updated}/${seed.creatures.length} images.`);
if (failed.length) console.log('Missing:', failed.join(', '));
