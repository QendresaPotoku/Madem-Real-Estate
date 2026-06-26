import { z } from 'zod';

/** Trilingual text shape, mirrors the frontend `Localized` type. */
export const localizedSchema = z.object({
  en: z.string(),
  sq: z.string(),
  de: z.string(),
});
export type LocalizedDto = z.infer<typeof localizedSchema>;

/** A partial localized value (for updates / optional fields). */
export const localizedPartialSchema = z.object({
  en: z.string().optional(),
  sq: z.string().optional(),
  de: z.string().optional(),
});

export const uuidParamSchema = z.object({ id: z.string().uuid() });

/** Standard pagination query (page/limit) + sort. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Envelope metadata for list responses. */
export const pageMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

/** Build a `{ data, meta }` list-response schema for a given item schema. */
export function listResponse<T extends z.ZodTypeAny>(item: T) {
  return z.object({ data: z.array(item), meta: pageMetaSchema });
}

export const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const currencySchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/)
  .default('EUR');
