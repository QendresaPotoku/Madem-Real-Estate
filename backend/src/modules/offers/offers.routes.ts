import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Offer } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import {
  currencySchema,
  errorResponseSchema,
  listResponse,
  paginationQuerySchema,
  uuidParamSchema,
} from '../../schemas/common';
import { OFFER_STATUSES } from '../../schemas/enums';

const response = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  opportunityId: z.string().uuid().nullable(),
  buyerContactId: z.string().uuid(),
  offeredAmount: z.number(),
  currency: z.string(),
  status: z.enum(OFFER_STATUSES),
  notes: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createBody = z.object({
  propertyId: z.string().uuid(),
  opportunityId: z.string().uuid().optional(),
  buyerContactId: z.string().uuid(),
  offeredAmount: z.number().min(0),
  currency: currencySchema,
  status: z.enum(OFFER_STATUSES).default('SUBMITTED'),
  notes: z.string().optional(),
});

const updateBody = z.object({
  offeredAmount: z.number().min(0).optional(),
  status: z.enum(OFFER_STATUSES).optional(),
  notes: z.string().optional(),
});

const listQuery = paginationQuerySchema.extend({
  propertyId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  status: z.enum(OFFER_STATUSES).optional(),
});

export async function offerRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);
  const repo = () => app.repo(Offer);

  r.get('/', { schema: { tags: ['offers'], querystring: listQuery, response: { 200: listResponse(response) } } },
    async (req) => {
      const q = req.query;
      const qb = repo().createQueryBuilder('o');
      if (q.propertyId) qb.andWhere('o.property_id = :p', { p: q.propertyId });
      if (q.opportunityId) qb.andWhere('o.opportunity_id = :op', { op: q.opportunityId });
      if (q.status) qb.andWhere('o.status = :s', { s: q.status });
      return paginate(qb, req.query, { createdAt: 'o.created_at', offeredAmount: 'o.offered_amount' }, 'o.created_at');
    });

  r.get('/:id', { schema: { tags: ['offers'], params: uuidParamSchema, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Offer');
      return row;
    });

  r.post('/', { schema: { tags: ['offers'], body: createBody, response: { 201: response } } },
    async (req, reply) => reply.status(201).send(await repo().save(repo().create({ ...req.body, createdBy: req.authUser!.id }))));

  r.patch('/:id', { schema: { tags: ['offers'], params: uuidParamSchema, body: updateBody, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Offer');
      repo().merge(row, req.body);
      await repo().save(row);
      return row;
    });

  r.delete('/:id', { schema: { tags: ['offers'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await repo().delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Offer');
      return reply.status(204).send(null);
    });
}
