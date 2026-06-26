import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Match } from '../../entities';
import { AppError } from '../../lib/errors';
import { errorResponseSchema, localizedSchema, uuidParamSchema } from '../../schemas/common';
import { MATCH_STATUSES } from '../../schemas/enums';
import { recomputeMatches } from './matching.service';

const propertySummary = z.object({
  id: z.string().uuid(),
  propertyCode: z.string(),
  titleJson: localizedSchema,
  price: z.number(),
  city: z.string(),
  area: z.string().nullable(),
  bedrooms: z.number().nullable(),
});

const matchResponse = z.object({
  id: z.string().uuid(),
  opportunityId: z.string().uuid(),
  propertyId: z.string().uuid(),
  status: z.enum(MATCH_STATUSES),
  matchScore: z.number().nullable(),
  property: propertySummary.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Mounted at /api — exposes /opportunities/:id/matches and /matches/:id. */
export async function matchRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  r.get(
    '/opportunities/:id/matches',
    {
      schema: {
        tags: ['matches'],
        summary: 'Recompute and return ranked property matches for an opportunity',
        params: uuidParamSchema,
        response: { 200: z.array(matchResponse), 404: errorResponseSchema },
      },
    },
    async (req) => {
      const matches = await recomputeMatches(app.db, req.params.id);
      if (matches === null) throw AppError.notFound('Opportunity');
      return matches;
    },
  );

  r.patch(
    '/matches/:id',
    {
      schema: {
        tags: ['matches'],
        summary: 'Update a match status (e.g. SHARED, ACCEPTED, REJECTED)',
        params: uuidParamSchema,
        body: z.object({ status: z.enum(MATCH_STATUSES) }),
        response: { 200: matchResponse, 404: errorResponseSchema },
      },
    },
    async (req) => {
      const repo = app.repo(Match);
      const match = await repo.findOneBy({ id: req.params.id });
      if (!match) throw AppError.notFound('Match');
      match.status = req.body.status;
      await repo.save(match);
      return match;
    },
  );
}
