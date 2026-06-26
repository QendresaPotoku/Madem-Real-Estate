import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Activity } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import { errorResponseSchema, listResponse, paginationQuerySchema, uuidParamSchema } from '../../schemas/common';
import { ACTIVITY_TYPES } from '../../schemas/enums';

const response = z.object({
  id: z.string().uuid(),
  type: z.enum(ACTIVITY_TYPES),
  contactId: z.string().uuid().nullable(),
  propertyId: z.string().uuid().nullable(),
  opportunityId: z.string().uuid().nullable(),
  dealId: z.string().uuid().nullable(),
  note: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createBody = z.object({
  type: z.enum(ACTIVITY_TYPES),
  contactId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  note: z.string().optional(),
}).refine((v) => v.contactId || v.propertyId || v.opportunityId || v.dealId, {
  message: 'An activity must link to at least one of: contact, property, opportunity, deal',
  path: ['contactId'],
});

const listQuery = paginationQuerySchema.extend({
  contactId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  type: z.enum(ACTIVITY_TYPES).optional(),
});

export async function activityRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);
  const repo = () => app.repo(Activity);

  r.get('/', { schema: { tags: ['activities'], querystring: listQuery, response: { 200: listResponse(response) } } },
    async (req) => {
      const q = req.query;
      const qb = repo().createQueryBuilder('a');
      if (q.contactId) qb.andWhere('a.contact_id = :c', { c: q.contactId });
      if (q.propertyId) qb.andWhere('a.property_id = :p', { p: q.propertyId });
      if (q.opportunityId) qb.andWhere('a.opportunity_id = :o', { o: q.opportunityId });
      if (q.dealId) qb.andWhere('a.deal_id = :d', { d: q.dealId });
      if (q.type) qb.andWhere('a.type = :t', { t: q.type });
      return paginate(qb, req.query, { createdAt: 'a.created_at' }, 'a.created_at');
    });

  r.post('/', { schema: { tags: ['activities'], body: createBody, response: { 201: response } } },
    async (req, reply) => reply.status(201).send(await repo().save(repo().create({ ...req.body, createdBy: req.authUser!.id }))));

  r.delete('/:id', { schema: { tags: ['activities'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await repo().delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Activity');
      return reply.status(204).send(null);
    });
}
