import type { Creature, CreatureFilter } from '@/types/creature';

// Common synonyms so "dot" finds "spot", "gray" finds "grey", etc.
const SYNONYMS: Record<string, string[]> = {
  dot:        ['spot', 'blotch', 'mark'],
  dots:       ['spots', 'blotches', 'marks', 'speckles'],
  spot:       ['dot', 'blotch', 'mark', 'patch'],
  spots:      ['dots', 'blotches', 'marks', 'patches', 'speckles'],
  stripe:     ['line', 'band', 'bar', 'streak'],
  stripes:    ['lines', 'bands', 'bars', 'streaks'],
  line:       ['stripe', 'band', 'bar'],
  gray:       ['grey'],
  grey:       ['gray'],
  color:      ['colour'],
  colour:     ['color'],
  colorful:   ['colourful', 'vivid', 'bright', 'vibrant'],
  colourful:  ['colorful', 'vivid', 'bright', 'vibrant'],
  arms:       ['tentacles'],
  tentacles:  ['arms'],
  fin:        ['dorsal', 'pectoral', 'anal'],
  sting:      ['venomous', 'toxic', 'dangerous'],
  poison:     ['venomous', 'toxic', 'venom'],
  venomous:   ['poisonous', 'toxic', 'sting'],
  flat:       ['disc', 'pancake', 'flattened'],
  round:      ['rounded', 'circular', 'oval', 'spherical'],
  long:       ['elongated', 'eel-like', 'slender'],
  big:        ['large', 'huge', 'giant'],
  small:      ['tiny', 'little', 'miniature'],
  shell:      ['carapace', 'exoskeleton'],
  transparent:['see-through', 'translucent', 'clear'],
  hidden:     ['camouflage', 'cryptic', 'invisible'],
  scary:      ['dangerous', 'venomous', 'aggressive'],
};

function expandQuery(q: string): string[] {
  const synonyms = SYNONYMS[q] ?? [];
  return [q, ...synonyms];
}

function scoreCreature(c: Creature, q: string): number {
  let score = 0;
  const name = c.commonName.toLowerCase();
  const sci = c.scientificName.toLowerCase();
  // All localized names for multi-language search
  const localizedNames = c.localizedNames
    ? Object.values(c.localizedNames).map((n) => n.toLowerCase())
    : [];

  // Name — highest weight
  if (name === q) score += 20;
  else if (name.startsWith(q)) score += 12;
  else if (name.includes(q)) score += 8;
  // Localized name match
  else if (localizedNames.some((n) => n === q)) score += 20;
  else if (localizedNames.some((n) => n.startsWith(q))) score += 12;
  else if (localizedNames.some((n) => n.includes(q))) score += 8;

  // Scientific name
  if (sci.includes(q)) score += 5;

  // Subcategory (e.g. "goby", "blenny", "nudibranch")
  if (c.subcategory.toLowerCase().includes(q)) score += 6;

  // Visual keywords (curated per-species)
  if (c.visualKeywords?.some((k) => k.toLowerCase().includes(q))) score += 6;

  // Tags (e.g. "venomous", "schooling", "camouflage")
  if (c.tags.some((t) => t.toLowerCase().includes(q))) score += 5;

  // Structural fields
  if (c.primaryColors.some((col) => col.toLowerCase().includes(q))) score += 4;
  if (c.bodyShape.toLowerCase().includes(q)) score += 4;
  if (c.sizeCategory.toLowerCase().includes(q)) score += 2;
  if (c.habitats.some((h) => h.replace('_', ' ').toLowerCase().includes(q))) score += 2;

  // Rich text fields
  if (c.spottingTips.toLowerCase().includes(q)) score += 3;
  if (c.description.toLowerCase().includes(q)) score += 2;
  if (c.behavior.toLowerCase().includes(q)) score += 2;
  if (c.diet.toLowerCase().includes(q)) score += 1;
  if (c.funFacts.some((f) => f.toLowerCase().includes(q))) score += 1;

  return score;
}

export function applyFilters(creatures: Creature[], filter: CreatureFilter): Creature[] {
  let result = creatures;

  if (filter.categoryId) {
    result = result.filter((c) => c.categoryId === filter.categoryId);
  }

  if (filter.colors && filter.colors.length > 0) {
    result = result.filter((c) =>
      filter.colors!.some((color) => c.primaryColors.includes(color))
    );
  }

  if (filter.bodyShape) {
    result = result.filter((c) => c.bodyShape === filter.bodyShape);
  }

  if (filter.sizeCategories && filter.sizeCategories.length > 0) {
    result = result.filter((c) => filter.sizeCategories!.includes(c.sizeCategory));
  }

  if (filter.depthMaxM != null) {
    result = result.filter((c) => c.depthMinM <= filter.depthMaxM!);
  }

  if (filter.habitats && filter.habitats.length > 0) {
    result = result.filter((c) =>
      filter.habitats!.some((h) => c.habitats.includes(h))
    );
  }

  if (filter.spottingDifficulty != null) {
    result = result.filter((c) => c.spottingDifficulty <= filter.spottingDifficulty!);
  }

  if (filter.seasons && filter.seasons.length > 0) {
    result = result.filter((c) =>
      filter.seasons!.some((s) => c.bestSeasons.includes(s))
    );
  }

  if (filter.conservationStatuses && filter.conservationStatuses.length > 0) {
    result = result.filter((c) =>
      filter.conservationStatuses!.includes(c.conservationStatus)
    );
  }

  if (filter.tags && filter.tags.length > 0) {
    result = result.filter((c) =>
      filter.tags!.some((t) => c.tags.includes(t))
    );
  }

  const rawQuery = filter.searchQuery?.trim() ?? '';
  if (rawQuery.length > 0) {
    const q = rawQuery.toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);

    // Score each creature: try exact phrase first, then all individual terms must match
    const scored = result
      .map((c) => {
        // Phrase score (exact phrase match — highest priority)
        const phraseScore = scoreCreature(c, q);
        if (phraseScore > 0) return { c, score: phraseScore + 10 };

        // Multi-term: every term (or one of its synonyms) must match somewhere
        const allMatch = terms.every((t) =>
          expandQuery(t).some((variant) => scoreCreature(c, variant) > 0)
        );
        if (!allMatch) return null;
        const termScore = terms.reduce(
          (sum, t) => sum + Math.max(...expandQuery(t).map((v) => scoreCreature(c, v))),
          0
        );
        return { c, score: termScore };
      })
      .filter((x): x is { c: Creature; score: number } => x !== null && x.score > 0);

    // Sort by relevance descending, ties broken by commonness
    scored.sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : a.c.spottingDifficulty - b.c.spottingDifficulty
    );
    return scored.map((x) => x.c);
  }

  // No search query: sort by commonness (spottingDifficulty ascending), then alphabetically
  return [...result].sort((a, b) =>
    a.spottingDifficulty !== b.spottingDifficulty
      ? a.spottingDifficulty - b.spottingDifficulty
      : a.commonName.localeCompare(b.commonName)
  );
}
