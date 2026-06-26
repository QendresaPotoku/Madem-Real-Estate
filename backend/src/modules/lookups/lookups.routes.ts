import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { DocumentType, HeatingType } from '../../entities';
import { localizedSchema } from '../../schemas/common';
import { DOCUMENT_CATEGORIES } from '../../schemas/enums';

const heatingTypeResponse = z.object({
  id: z.number(),
  key: z.string(),
  labelJson: localizedSchema,
  isActive: z.boolean(),
  sortOrder: z.number(),
});

const documentTypeResponse = z.object({
  id: z.number(),
  category: z.enum(DOCUMENT_CATEGORIES),
  key: z.string(),
  labelJson: localizedSchema,
  isActive: z.boolean(),
});

export async function lookupRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    '/heating-types',
    { schema: { tags: ['lookups'], summary: 'List heating types', response: { 200: z.array(heatingTypeResponse) } } },
    async () => app.repo(HeatingType).find({ where: { isActive: true }, order: { sortOrder: 'ASC' } }),
  );

  r.get(
    '/document-types',
    { schema: { tags: ['lookups'], summary: 'List document types', response: { 200: z.array(documentTypeResponse) } } },
    async () => app.repo(DocumentType).find({ where: { isActive: true }, order: { category: 'ASC' } }),
  );
}
