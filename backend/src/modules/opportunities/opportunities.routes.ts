import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Opportunity } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import {
  currencySchema,
  errorResponseSchema,
  listResponse,
  paginationQuerySchema,
  uuidParamSchema,
} from '../../schemas/common';
import { LISTING_TYPES, OPPORTUNITY_STATUSES, PROPERTY_TYPES } from '../../schemas/enums';

const response = z.object({
  id: z.string().uuid(),
  code: z.string(),
  contactId: z.string().uuid(),
  assignedAgentId: z.string().uuid().nullable(),
  propertyType: z.enum(PROPERTY_TYPES),
  listingType: z.enum(LISTING_TYPES),
  country: z.string().nullable(),
  city: z.string().nullable(),
  area: z.string().nullable(),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  currency: z.string(),
  status: z.enum(OPPORTUNITY_STATUSES),
  requirementsJson: z.record(z.unknown()),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createBody = z.object({
  contactId: z.string().uuid(),
  assignedAgentId: z.string().uuid().optional(),
  propertyType: z.enum(PROPERTY_TYPES),
  listingType: z.enum(LISTING_TYPES),
  country: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  currency: currencySchema,
  status: z.enum(OPPORTUNITY_STATUSES).default('NEW'),
  requirementsJson: z.record(z.unknown()).default({}),
}).refine((v) => v.budgetMax == null || v.budgetMin == null || v.budgetMax >= v.budgetMin, {
  message: 'budgetMax must be >= budgetMin',
  path: ['budgetMax'],
});

const updateBody = z.object({
  assignedAgentId: z.string().uuid().nullable().optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  listingType: z.enum(LISTING_TYPES).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  currency: currencySchema.optional(),
  status: z.enum(OPPORTUNITY_STATUSES).optional(),
  requirementsJson: z.record(z.unknown()).optional(),
});

const listQuery = paginationQuerySchema.extend({
  status: z.enum(OPPORTUNITY_STATUSES).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  listingType: z.enum(LISTING_TYPES).optional(),
  assignedAgentId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
});

export async function opportunityRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);
  const repo = () => app.repo(Opportunity);

  r.get('/', { schema: { tags: ['opportunities'], querystring: listQuery, response: { 200: listResponse(response) } } },
    async (req) => {
      const q = req.query;
      const qb = repo().createQueryBuilder('o');
      if (q.status) qb.andWhere('o.status = :s', { s: q.status });
      if (q.propertyType) qb.andWhere('o.property_type = :pt', { pt: q.propertyType });
      if (q.listingType) qb.andWhere('o.listing_type = :lt', { lt: q.listingType });
      if (q.assignedAgentId) qb.andWhere('o.assigned_agent_id = :a', { a: q.assignedAgentId });
      if (q.contactId) qb.andWhere('o.contact_id = :c', { c: q.contactId });
      return paginate(qb, req.query, { createdAt: 'o.created_at' }, 'o.created_at');
    });

  r.get('/:id', { schema: { tags: ['opportunities'], params: uuidParamSchema, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Opportunity');
      return row;
    });

  r.post('/', { schema: { tags: ['opportunities'], body: createBody, response: { 201: response } } },
    async (req, reply) => {
      const saved = await repo().save(repo().create({ ...req.body, createdBy: req.authUser!.id }));
      return reply.status(201).send(await repo().findOneByOrFail({ id: saved.id }));
    });

  r.patch('/:id', { schema: { tags: ['opportunities'], params: uuidParamSchema, body: updateBody, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Opportunity');
      repo().merge(row, req.body);
      await repo().save(row);
      return row;
    });

  r.delete('/:id', { schema: { tags: ['opportunities'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await repo().delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Opportunity');
      return reply.status(204).send(null);
    });
}
