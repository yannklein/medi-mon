import type { Creature, CreatureFilter } from '@/types/creature';

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

  if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = filter.searchQuery.toLowerCase().trim();
    result = result.filter(
      (c) =>
        c.commonName.toLowerCase().includes(q) ||
        c.scientificName.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return result;
}
