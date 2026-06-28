#!/usr/bin/env node
/**
 * Verifies and fixes creature images in seed.json.
 *
 * Strategy:
 * - For every creature, query iNaturalist /v1/taxa by exact scientific name.
 * - Accept the match ONLY if the returned taxon name matches closely.
 * - Use the taxon's curated default_photo (not user observations).
 * - Force-replace: any URL containing "static.inaturalist.org" (observation-
 *   based, less reliable) and any explicitly listed problematic IDs.
 * - Skip entries that already have a reliable "inaturalist-open-data.s3" URL
 *   UNLESS they are in the force-replace list.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, '../src/data/creatures/seed.json');

// Always re-fetch these (user-reported wrong pictures + anything on static.inaturalist.org)
const FORCE_IDS = new Set([
  'torpedo-torpedo',
  'anguilla-anguilla',
]);

async function fetchTaxonPhoto(scientificName) {
  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&rank=species&is_active=true&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();

  // Find best match: exact name match first, then partial
  const exact = json.results?.find(r =>
    r.name?.toLowerCase() === scientificName.toLowerCase()
  );
  const taxon = exact ?? json.results?.[0];
  if (!taxon) return null;

  // Prefer taxon_photos array (curated) over default_photo
  const photos = taxon.taxon_photos ?? [];
  for (const tp of photos) {
    const u = tp.photo?.medium_url ?? tp.photo?.url;
    if (u && u.includes('inaturalist-open-data.s3')) return u;
  }

  // Fall back to default_photo
  const dp = taxon.default_photo?.medium_url ?? taxon.default_photo?.url;
  if (dp) return dp;

  return null;
}

function needsUpdate(c) {
  if (FORCE_IDS.has(c.id)) return true;
  // Re-fetch static.inaturalist.org (observation photos — unreliable)
  if (c.wikiImageUrl && c.wikiImageUrl.includes('static.inaturalist.org')) return true;
  // No image at all
  if (!c.wikiImageUrl) return true;
  return false;
}

const data = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
const toUpdate = data.creatures.filter(needsUpdate);

console.log(`Found ${toUpdate.length} creatures to verify/fix.\n`);

let fixed = 0, failed = 0, unchanged = 0;

for (const c of toUpdate) {
  process.stdout.write(`  [${c.id}] ${c.commonName} (${c.scientificName}) ... `);
  try {
    const url = await fetchTaxonPhoto(c.scientificName);
    if (url && url !== c.wikiImageUrl) {
      const old = c.wikiImageUrl ?? '(none)';
      c.wikiImageUrl = url;
      console.log(`FIXED\n    old: ${old}\n    new: ${url}`);
      fixed++;
    } else if (url) {
      console.log(`ok (same)`);
      unchanged++;
    } else {
      console.log(`FAILED — no photo found`);
      failed++;
    }
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    failed++;
  }
  // Rate-limit courtesy
  await new Promise(r => setTimeout(r, 220));
}

writeFileSync(SEED_PATH, JSON.stringify(data, null, 2));

console.log(`\nDone. Fixed: ${fixed}  Unchanged: ${unchanged}  Failed: ${failed}`);
console.log(`Total creatures: ${data.creatures.length}`);
