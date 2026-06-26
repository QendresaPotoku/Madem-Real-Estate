import { useLanguage } from "./context";
import { messages } from "./messages";
import { DEFAULT_LANGUAGE, isLocalized, type Language, type Localized } from "./types";

function lookup(lang: Language, key: string): string | undefined {
  const parts = key.split(".");
  let node: unknown = messages[lang];
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

const LOCALES: Record<Language, string> = {
  en: "en-US",
  sq: "sq-AL",
  de: "de-DE",
};

export interface Translator {
  language: Language;
  /** BCP-47 locale for the current language (for Intl date/number formatting). */
  locale: string;
  /** Translate a UI string by dot-path key, with optional {var} interpolation. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Resolve a Localized data field to the current language (passes plain strings through). */
  tx: <T = string>(value: Localized<T> | T) => T;
  /** Translate an enum value (e.g. property type/status, blog/FAQ category). */
  tEnum: (group: string, value: string) => string;
  /** Translate a glossary term (amenities, features, specialties); falls back to the term. */
  tg: (term: string) => string;
}

export function useT(): Translator {
  const { language } = useLanguage();

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const value = lookup(language, key) ?? lookup(DEFAULT_LANGUAGE, key) ?? key;
    return interpolate(value, vars);
  };

  const tx = <T = string,>(value: Localized<T> | T): T => {
    if (isLocalized(value)) {
      return ((value as Localized<T>)[language] ?? (value as Localized<T>)[DEFAULT_LANGUAGE]) as T;
    }
    return value as T;
  };

  const tEnum = (group: string, value: string): string => {
    return lookup(language, `enums.${group}.${value}`) ?? lookup(DEFAULT_LANGUAGE, `enums.${group}.${value}`) ?? value;
  };

  const tg = (term: string): string => {
    const dict = messages[language].glossary as Record<string, string> | undefined;
    return (dict && dict[term]) || term;
  };

  return { language, locale: LOCALES[language], t, tx, tEnum, tg };
}
