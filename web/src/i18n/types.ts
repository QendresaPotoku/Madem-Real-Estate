export type Language = "en" | "sq" | "de";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "sq", label: "SQ" },
  { code: "de", label: "DE" },
];

export const DEFAULT_LANGUAGE: Language = "en";

/**
 * A piece of content that exists in all three supported languages.
 * Used for free-text fields in the data layer (titles, descriptions, articles…).
 */
export type Localized<T = string> = { en: T; sq: T; de: T };

export function isLocalized(value: unknown): value is Localized {
  return (
    typeof value === "object" &&
    value !== null &&
    "en" in (value as Record<string, unknown>) &&
    "sq" in (value as Record<string, unknown>) &&
    "de" in (value as Record<string, unknown>)
  );
}
