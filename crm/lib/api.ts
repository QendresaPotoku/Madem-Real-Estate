import createClient from 'openapi-fetch';
import type { paths } from './api-types';

/**
 * Typed API client. baseUrl is '' so requests go to the same origin (/api/...),
 * which Next rewrites proxy to the Fastify backend — keeping the session cookie
 * first-party. `credentials: 'include'` sends the httpOnly cookie.
 */
export const api = createClient<paths>({
  baseUrl: '',
  credentials: 'include',
});

/** Await an openapi-fetch call, throwing the error body so mutations reject (→ global toast). */
export async function req<T>(p: Promise<{ data?: T; error?: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

/** Pick a language out of a Localized {en,sq,de} JSONB value. */
export type Localized = { en: string; sq: string; de: string };
export function tx(value: Localized | null | undefined, lang: 'en' | 'sq' | 'de' = 'en'): string {
  if (!value) return '';
  return value[lang] || value.en || '';
}
