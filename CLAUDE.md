# MediMon — Project Guide for Claude

> IMPORTANT: Expo APIs change frequently. Always read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

---

## Project Overview

Mediterranean sea life catalog + dive log app. Mobile (iOS/Android) + web from one Expo codebase.

Users can:
- Browse a catalog of Mediterranean species, filter by color/category/habitat/depth/difficulty
- Log dives (multi-step form) and attach creature sightings to each dive
- Track their personal "ocean" — a collection of species they've spotted
- View dive stats and profile

---

## Tech Stack

| Concern | Library / Version |
|---|---|
| Framework | Expo SDK 54, React 19.1, React Native 0.81.5 |
| Routing | Expo Router ~6.0.23 (file-based) |
| Styling | NativeWind v4 + Tailwind CSS v3 + `global.css` |
| Animations | Reanimated ~4.1.1 + react-native-worklets + Moti ^0.30 |
| State / Persist | Zustand ^5 + AsyncStorage 2.2.0 |
| DB | Zustand + AsyncStorage persist (WatermelonDB removed — requires native build) |
| Cloud sync | Supabase (Phase 5, optional) |
| TypeScript | 5.3.3 strict |

`"main": "expo-router/entry"` in package.json.

### Why SDK 54, not 56
Downgraded from 56 to match the Expo Go version available on device at setup time. Do NOT upgrade without user confirmation.

### Never run `expo prebuild`
This generates `ios/`/`android/` directories which break Expo Go compatibility.

---

## Key Config Files

| File | Purpose |
|---|---|
| `babel.config.js` | NativeWind + Reanimated presets (no decorators plugin) |
| `metro.config.js` | NativeWind + `@/` alias → `src/` |
| `tsconfig.json` | strict, `baseUrl: "."`, `paths: { "@/*": ["src/*"] }` |
| `tailwind.config.js` | Custom ocean color palette |
| `global.css` | NativeWind entry (`@tailwind base/components/utilities`) |
| `nativewind-env.d.ts` | NativeWind `className` type reference |
| `src/types/global.d.ts` | `declare module '*.css'` for CSS imports |

### Path Alias
`@/` maps to `src/` (set in both `metro.config.js` and `tsconfig.json`).

---

## File Structure

```
app/
  _layout.tsx               # Root layout — imports global.css, calls loadCreatures()
  index.tsx                 # Animated splash screen — redirects to onboarding or catalog
  onboarding.tsx            # 3-slide onboarding (sets hasOnboarded in uiStore)
  (tabs)/
    _layout.tsx             # Tab navigator (4 tabs, Ionicons icons)
    catalog/
      _layout.tsx           # Stack with themed header
      index.tsx             # Catalog list + search + filter
      [id].tsx              # Creature detail screen
    logbook/
      _layout.tsx           # Stack with themed header
      index.tsx             # Logbook list
      [id].tsx              # Dive detail screen
    collection/index.tsx    # My Ocean grid
    profile/index.tsx       # Stats + settings (language, units)
  modals/
    _layout.tsx             # Modals Stack layout
    log-dive.tsx            # 4-step dive logging modal
    add-sighting.tsx        # Quick-add sighting modal

src/
  constants/
    theme.ts                # Colors, Spacing, BorderRadius
    categories.ts           # CATEGORIES array + CATEGORY_MAP + CategoryId type
  types/
    creature.ts             # Creature, CreatureFilter interfaces + enums (incl. gamification)
    dive.ts                 # DiveFormData, DiveRecord
    sighting.ts             # SightingFormData, SightingRecord
    global.d.ts             # declare module '*.css'
  data/
    creatures/seed.json     # 170 species, version "2024-05"
  i18n/
    index.ts                # useT() hook, detectLang(), Lang type
    translations.ts         # EN (source of truth) + FR, ES, PT overrides; TRANSLATIONS registry
  services/
    seedService.ts          # loadCreatures(), getAllCreatures(), getCreatureById(), getCreatureName(creature, lang)
  stores/
    catalogFilterStore.ts   # Active filter state (Zustand + AsyncStorage, no searchQuery persist)
    diveSessionStore.ts     # In-progress 4-step dive form (Zustand + AsyncStorage)
    logbookStore.ts         # Persisted dives + sightings (Zustand + AsyncStorage)
    uiStore.ts              # UI preferences incl. language, units (Zustand)
  components/
    catalog/
      CreatureCard.tsx      # List + grid card variants
      FilterSheet.tsx       # Bottom sheet filter panel
    logbook/
      DiveCard.tsx          # Dive list card
    layout/
      WebContainer.tsx      # Max-width 680px container for wide web screens
  hooks/
    useResponsive.ts        # useIsWide() hook (breakpoint 768px)
  utils/
    filterEngine.ts         # applyFilters(creatures, filter) — pure, searches localizedNames too
  scripts/                  # (project root) one-off data scripts
    add-gamification.mjs    # Derived rarity/points/specialAbility from difficulty + IUCN
    add-localized-names.mjs # Added FR/ES/PT localizedNames to all 170 creatures
    verify-fix-images.mjs   # Re-fetched wrong images via iNaturalist curated API
```

---

## Design System

### Colors (`src/constants/theme.ts` → `Colors`)
```
navy:        #0A1628   (background)
navyLight:   #132240   (tab bar, cards)
navyDark:    #060F1A
ocean:       #0D7EA5   (primary)
oceanLight:  #1299C5
oceanDark:   #0A6080
biolumCyan:  #00E5FF   (active/highlight)
seafoam:     #B2EBF2   (secondary text)
sandy:       #F5F0E8   (primary text)
coral:       #FF6B6B   (error/accent)
textPrimary: #F5F0E8
textSecondary:#B2EBF2
textMuted:   #6B8FA8
success:     #4CAF50
warning:     #FFC107
error:       #F44336
```

NativeWind custom classes: `bg-navy`, `bg-navyLight`, `text-seafoam`, `text-ocean`, `text-sandy`, etc.

### Spacing / BorderRadius
`Spacing`: xs=4, sm=8, md=16, lg=24, xl=32, xxl=48
`BorderRadius`: sm=8, md=12, lg=16, xl=24, full=9999

---

## Data Models

### Creature (`src/types/creature.ts`)
Full interface with: id (slug), commonName, scientificName, categoryId, subcategory, primaryColors[], bodyShape, sizeCategory, sizeMin/MaxCm, depthMin/MaxM, depthZones[], habitats[], spottingDifficulty (1–5), bestSeasons[], activityPattern, spottingTips, description, behavior, diet, funFacts[], conservationStatus (IUCN), isProtected, isEndemic, tags[], visualKeywords[], emoji?, wikiImageUrl?, thumbnailAsset, photoAssets[], illustrationAsset

**Gamification fields:** `rarity` ('common'|'uncommon'|'rare'|'epic'|'legendary'), `points` (number), `specialAbility?` (string[])

**Localization:** `localizedNames?: { fr?: string; es?: string; pt?: string }` — always use `getCreatureName(creature, lang)` from seedService for display, never read `commonName` directly in UI code.

### CreatureFilter (`src/types/creature.ts`)
categoryId, colors[], bodyShape, sizeCategories[], depthMaxM, habitats[], spottingDifficulty, seasons[], conservationStatuses[], tags[], searchQuery

### DiveRecord (`src/types/dive.ts`)
DiveFormData (date, durationMinutes, locationName, locationLat/Lon, maxDepthMeters, avgDepthMeters, waterTempCelsius, visibilityMeters, diveType, buddyName, diveCenterName, notes, rating) + id, createdAt, updatedAt

### SightingRecord (`src/types/sighting.ts`)
SightingFormData (creatureId, diveId, spottedAt, depthObservedMeters, quantity, behaviorNotes, photoUri, confidence) + id, createdAt

### 11 Categories (`src/constants/categories.ts`)
fish, cephalopod, crustacean, mollusk, echinoderm, shark_ray, sea_turtle, marine_mammal, jellyfish, coral_sponge, seagrass_algae

---

## Stores

### `useLogbookStore`
- `dives: DiveRecord[]`, `sightings: SightingRecord[]`
- `addDive(form, pendingSightings?)` → diveId
- `updateDive(id, patch)`, `deleteDive(id)` (also deletes sightings)
- `addSighting(form)` → sightingId, `deleteSighting(id)`
- `getSightingsForDive(diveId)`, `getSightingsForCreature(creatureId)`, `getSpottedCreatureIds()` → Set<string>
- Persisted under key `'logbook'`

### `useDiveSessionStore`
- In-progress dive form: `step` (1–4), `draft: Partial<DiveFormData>`, `pendingSightings[]`
- `setStep`, `updateDraft`, `addPendingSighting`, `removePendingSighting`, `clearSession`, `hasPendingSession`
- Persisted under key `'dive-session'`

### `useCatalogFilterStore`
- `filter: CreatureFilter`, `setFilter`, `clearFilter`, `hasActiveFilters`
- Persisted under key `'catalog-filter'` (searchQuery NOT persisted)

### `useUIStore`
- `language: Lang` ('en'|'fr'|'es'|'pt'), `setLanguage(lang)`
- `showScientificNames: boolean`, `setShowScientificNames`
- `lengthUnit: 'metric'|'imperial'`, `setLengthUnit`
- `hasOnboarded: boolean`, `setHasOnboarded`
- `_hasHydrated: boolean` — always guard routing logic on this
- Persisted under key `'ui'`

---

## Known Issues / Gotchas

- `tsc` binary may throw MODULE_NOT_FOUND. Use: `node node_modules/typescript/lib/tsc.js --noEmit`
- CSS imports require `src/types/global.d.ts` (`declare module '*.css'`)
- Tab icon `color` prop is `ColorValue` not `string` — don't pass to `style.color` string props directly
- Never run `expo prebuild` — generates `ios/`/`android/` and breaks Expo Go compatibility
- `moti` (MotiView) breaks Metro web bundle — use RN `Animated` API instead on web
- `headerBackTitleVisible` is a valid NativeStack option but not in TS types — use `// @ts-ignore`
- `outlineStyle: 'none'` (web-only) is not in RN TS types — cast as `any`
- Never call store methods returning new objects (e.g. `getSpottedCreatureIds()`) inside Zustand selectors — causes infinite loops. Select raw data and compute with `useMemo`
- Always import `SafeAreaView` from `react-native-safe-area-context`, not `react-native`
- Always use `getCreatureName(creature, lang)` for display — never read `creature.commonName` directly in UI

## i18n

- `useT()` hook from `@/i18n` — returns `t(key, ...args)` function
- Interpolation: `{0}`, `{1}` placeholders. Plurals: `key_one` / `key_other` suffix
- `detectLang()` reads device locale via `Intl.DateTimeFormat().resolvedOptions().locale`
- Language persisted in `uiStore.language`; toggled in Profile → Settings
- `LANG_LABELS` exported from `@/i18n` for display: `{ en: '🇬🇧 English', fr: '🇫🇷 Français', … }`
- To add a new string: add key to `EN` in `src/i18n/translations.ts`, then add translations to FR/ES/PT objects

---

## Phase Progress

### Phase 1 — Foundation (COMPLETE)
### Phase 2 — Creature Catalog (COMPLETE)
### Phase 3 — Sighting & Logbook (COMPLETE)
### Phase 4 — My Ocean + Polish (COMPLETE)
### Phase 5 — Web responsive layout (COMPLETE)

### Post-Phase additions (COMPLETE)
- **170 species** in seed.json (up from 5), with wikiImageUrl, emoji, visualKeywords
- **Gamification**: rarity, points, specialAbility on all creatures; XP/level/badges on Profile
- **i18n**: EN/FR/ES/PT across all UI strings; creature names localized in all 170 species
- **Animated splash screen** (`app/index.tsx`) using RN `Animated` API
- **EAS config**: `eas.json` (preview + production profiles), `expo-updates` wired with updates URL
- **Image quality**: fixed wrong/unreliable photos via iNaturalist curated API script

---

### Phase 1 — Foundation (COMPLETE)
- Expo Router scaffold with 4-tab layout
- NativeWind + custom ocean theme
- Zustand stores: catalog filter, dive session, logbook, UI
- Creature type system + 11 categories
- seed.json with 5 species + seedService
- filterEngine (pure, all filter dimensions)
- Dive + Sighting type system
- Placeholder screens for all tabs

---

### Phase 2 — Creature Catalog (COMPLETE)

**Goal:** Fully browsable, filterable species catalog.

#### Screens / Components
1. **`app/(tabs)/catalog/index.tsx`** — Catalog list
   - Search bar (updates `catalogFilterStore.filter.searchQuery`)
   - Horizontal scrollable category chip row
   - "Filters" button → opens filter sheet (badge count of active filters)
   - `FlatList` of `CreatureCard` components
   - Empty state when no results

2. **`src/components/catalog/CreatureCard.tsx`**
   - Thumbnail image (or placeholder), commonName, scientificName, category badge, spotting difficulty dots, conservation status badge if VU/EN/CR

3. **`app/(tabs)/catalog/[id].tsx`** — Creature detail (stack screen inside catalog group)
   - Hero image / illustration
   - All info sections: description, habitat, spotting tips, diet, behavior, fun facts
   - Conservation status + protected/endemic badges
   - "I spotted this!" CTA button → navigates to quick-add sighting modal

4. **`src/components/catalog/FilterSheet.tsx`** — Bottom sheet filter panel
   - Sections: Category, Color, Body Shape, Size, Max Depth, Habitat, Difficulty, Season, Conservation Status, Tags
   - "Apply" + "Clear all" buttons

5. **Tab icons** — Replace placeholder `<Text>` chars with proper icons (e.g., `@expo/vector-icons` Ionicons or inline SVG)

#### Notes
- Use `getAllCreatures()` + `applyFilters()` from existing services
- `useCatalogFilterStore` drives all filter state
- Creature detail route: `app/(tabs)/catalog/[id].tsx` — read `id` from `useLocalSearchParams()`

---

### Phase 3 — Sighting & Logbook (COMPLETE)

**Goal:** Log dives with creature sightings; browse past dives.

#### Screens / Components

1. **`app/(tabs)/logbook/index.tsx`** — Logbook list
   - List of `DiveCard` components, sorted by date descending
   - Each card: date, location, dive type icon, duration, max depth, # sightings, rating stars
   - "Log a Dive" FAB button → starts new dive flow
   - Empty state with CTA

2. **`app/modals/log-dive/`** — Multi-step dive logging modal (4 steps, uses `diveSessionStore`)
   - **Step 1** (`step1.tsx`): Date picker, location name, dive type selector (scuba/freedive/snorkel)
   - **Step 2** (`step2.tsx`): Max depth, duration, water temp, visibility
   - **Step 3** (`step3.tsx`): Add sightings — searchable creature picker, each sighting gets confidence + quantity + depth
   - **Step 4** (`step4.tsx`): Notes, buddy name, dive center, 1–5 star rating
   - **Summary** (`summary.tsx`): Review before saving → calls `logbookStore.addDive()`
   - Progress indicator (step X of 4) at top
   - "Back" / "Next" / "Save" navigation
   - Abandon confirmation if `hasPendingSession()`

3. **`app/(tabs)/logbook/[id].tsx`** — Dive detail
   - All dive fields
   - Sightings list with creature thumbnails
   - Edit button (patch via `updateDive`)
   - Delete button (with confirmation)

4. **`app/modals/add-sighting.tsx`** — Quick-add sighting (standalone, without a dive)
   - Creature picker (search + filter by category)
   - Confidence, quantity, depth, behavior notes, optional photo (expo-image-picker)
   - Saves via `logbookStore.addSighting()`

#### Notes
- `diveSessionStore` holds the in-progress form; commit to `logbookStore` on save
- `clearSession()` after successful save or explicit abandon
- Date picker: use `@react-native-community/datetimepicker` (check Expo SDK 54 compatibility) or a custom scroll picker

---

### Phase 4 — My Ocean + Polish (COMPLETE)

**Goal:** Personal collection view, stats, and a polished, animated UI.

#### Screens / Components

1. **`app/(tabs)/collection/index.tsx`** — My Ocean
   - "Spotted" species grid: all creatures the user has sighted at least once (from `getSpottedCreatureIds()`)
   - Silhouette / locked state for unspotted creatures (optional "discovery" mechanic)
   - Stats banner: total species spotted, total dives, total sightings
   - Filter by category

2. **`app/(tabs)/profile/index.tsx`** — Profile & Stats
   - Diver summary card: total dives, total hours, deepest dive, most seen species
   - Recent dives list (last 5)
   - Settings section: units (metric/imperial), theme toggle (future), app version
   - `useUiStore` for preferences

3. **Polish / Animations**
   - Add `Moti` / `Reanimated` entrance animations to list items
   - Tab bar icon animations on press (scale/spring)
   - Skeleton loaders while data loads
   - Haptic feedback (`expo-haptics`) on key interactions (save, delete confirm, sighting added)
   - `expo-linear-gradient` for hero gradients on creature detail + onboarding

4. **Onboarding**
   - First-launch splash / welcome screen
   - Store "has onboarded" flag in `uiStore`

---

### Phase 5 — Web + Sync (COMPLETE — web responsive; Supabase sync not implemented)

**Goal:** Web-compatible layout and optional Supabase cloud sync.

#### Tasks

1. **Web layout**
   - Responsive sidebar navigation for wide screens (replace tab bar)
   - Test `expo start --web`, fix any web-incompatible RN components
   - Use `Platform.select` / `useWindowDimensions` for layout branching

2. **Supabase sync (optional)**
   - Auth: email/password or magic link via `supabase-js`
   - Tables: `dives`, `sightings` mirroring local Zustand shape
   - Sync strategy: local-first, push on save, pull on app open
   - Conflict resolution: last-write-wins on `updatedAt`
   - New store: `useAuthStore` (session, user profile)

3. **EAS Build + Deploy**
   - `eas.json` profiles: development, preview, production
   - OTA updates via `expo-updates`
   - Web deploy via EAS Hosting or Vercel

---

## Development Commands

```bash
npx expo start                                        # Start dev server (Expo Go)
npx expo start --tunnel                               # Expo Go accessible from anywhere (no same-network required)
npx expo start --web                                  # Web mode
node node_modules/typescript/lib/tsc.js --noEmit     # Type check (tsc bin may be broken)
eas update --branch main --message "..."              # Publish OTA update to Expo Go via EAS
eas build --profile preview --platform android        # Build shareable Android APK (no Apple account needed)
```
