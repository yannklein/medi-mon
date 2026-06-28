import { useUIStore } from '@/stores/uiStore';
import { TRANSLATIONS, type Lang } from './translations';

export type { Lang } from './translations';
export { LANG_LABELS } from './translations';

/**
 * Interpolate {0}, {1}, … placeholders in a translation string.
 */
function interpolate(str: string, args: (string | number)[]): string {
  return args.reduce<string>(
    (acc, val, i) => acc.replace(new RegExp(`\\{${i}\\}`, 'g'), String(val)),
    str
  );
}

/**
 * Low-level translation function — use useT() in components instead.
 */
export function translate(lang: Lang, key: string, ...args: (string | number)[]): string {
  const map = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
  const str = (map as Record<string, string>)[key] ?? (TRANSLATIONS.en as Record<string, string>)[key] ?? key;
  return args.length ? interpolate(str, args) : str;
}

/**
 * Hook — returns a `t(key, ...args)` function bound to the current language.
 *
 * Special plural helper:
 *   t('logbook.subtitle', count)
 *   → tries 'logbook.subtitle_one' when count === 1, else 'logbook.subtitle_other'
 */
export function useT() {
  const lang = useUIStore((s) => s.language);

  return function t(key: string, ...args: (string | number)[]): string {
    // Pluralization: if first arg is a number, try _one / _other variants
    if (args.length > 0 && typeof args[0] === 'number') {
      const count = args[0] as number;
      const pluralKey = count === 1 ? `${key}_one` : `${key}_other`;
      const map = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
      if ((map as Record<string, string>)[pluralKey]) {
        return interpolate((map as Record<string, string>)[pluralKey], args);
      }
    }
    return translate(lang, key, ...args);
  };
}

/**
 * Detect the device locale and map it to a supported Lang.
 * Falls back to 'en'.
 */
export function detectLang(): Lang {
  try {
    const locale =
      (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().locale) || 'en';
    const code = locale.split('-')[0].toLowerCase();
    if (code === 'fr') return 'fr';
    if (code === 'es') return 'es';
    if (code === 'pt') return 'pt';
  } catch {}
  return 'en';
}
