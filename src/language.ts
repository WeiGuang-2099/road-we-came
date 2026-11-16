import {type Language, type Script, isLanguage} from './script';
import {EN} from './script_en';
import {ZH} from './script_zh';

export const SCRIPTS: Readonly<Record<Language, Script>> = {zh: ZH, en: EN};

/**
 * Picks the language to play in: the one an address asks for (?lang=en),
 * else the one the player chose before, else the first of Chinese or English
 * among the browser's preferred languages. Anyone else gets English.
 */
export function pickLanguage(
  search: string,
  saved: Language | null,
  preferred: readonly string[],
): Language {
  const asked = new URLSearchParams(search).get('lang');
  if (isLanguage(asked)) {
    return asked;
  }
  if (saved) {
    return saved;
  }
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLanguage(base)) {
      return base;
    }
  }
  return 'en';
}

/** The language the switch on the page leads to. */
export function otherLanguage(language: Language): Language {
  return language === 'zh' ? 'en' : 'zh';
}
