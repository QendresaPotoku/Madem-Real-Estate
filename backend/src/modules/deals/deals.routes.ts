import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Deal, Property } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import {
  currencySchema,
  errorResponseSchema,
  listResponse,
  paginationQuerySchema,
  uuidParamSchema,
} from '../../schemas/common';
import { DEAL_STATUSES, DEAL_TYPES } from '../../schemas/enums';

const response = z.object({
  id: z.string().uuid(),
  code: z.string(),
  propertyId: z.string().uuid(),
  opportunityId: z.string().uuid().nullable(),
  buyerContactId: z.string().uuid().nullable(),
  sellerContactId: z.string().uuid().nullable(),
  agentUserId: z.string().uuid(),
  dealType: z.enum(DEAL_TYPES),
  finalPrice: z.number().nullable(),
  mademCommissionValue: z.number().nullable(),
  commissionPaid: z.boolean(),
  currency: z.string(),
  status: z.enum(DEAL_STATUSES),
  closedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createBody = z.object({
  propertyId: z.string().uuid(),
  opportunityId: z.string().uuid().optional(),
  buyerContactId: z.string().uuid().optional(),
  sellerContactId: z.string().uuid().optional(),
  agentUserId: z.string().uuid(),
  dealType: z.enum(DEAL_TYPES),
  finalPrice: z.number().min(0).optional(),
  mademCommissionValue: z.number().min(0).optional(),
  commissionPaid: z.boolean().optional(),
  currency: currencySchema,
  status: z.enum(DEAL_STATUSES).default('OPEN'),
});

const updateBody = z.object({
  finalPrice: z.number().min(0).optional(),
  mademCommissionValue: z.number().min(0).optional(),
  commissionPaid: z.boolean().optional(),
  status: z.enum(DEAL_STATUSES).optional(),
  buyerContactId: z.string().uuid().optional(),
  sellerContactId: z.string().uuid().optional(),
});

const listQuery = paginationQuerySchema.extend({
  status: z.enum(DEAL_STATUSES).optional(),
  dealType: z.enum(DEAL_TYPES).optional(),
  agentUserId: z.string().uuid().optional(),
});

export async function dealRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);
  const repo = () => app.repo(Deal);

  r.get('/', { schema: { tags: ['deals'], querystring: listQuery, response: { 200: listResponse(response) } } },
    async (req) => {
      const q = req.query;
      const qb = repo().createQueryBuilder('d');
      if (q.status) qb.andWhere('d.status = :s', { s: q.status });
      if (q.dealType) qb.andWhere('d.deal_type = :t', { t: q.dealType });
      if (q.agentUserId) qb.andWhere('d.agent_user_id = :a', { a: q.agentUserId });
      return paginate(qb, req.query, { createdAt: 'd.created_at', finalPrice: 'd.final_price' }, 'd.created_at');
    });

  r.get('/:id', { schema: { tags: ['deals'], params: uuidParamSchema, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Deal');
      return row;
    });

  r.post('/', { schema: { tags: ['deals'], body: createBody, response: { 201: response } } },
    async (req, reply) => {
      const saved = await repo().save(repo().create({
        ...req.body,
        commissionPaid: req.body.status === 'CLOSED_WON' ? req.body.commissionPaid ?? false : false,
      }));
      return reply.status(201).send(await repo().findOneByOrFail({ id: saved.id }));
    });

  r.patch('/:id', { schema: { tags: ['deals'], summary: 'Update a deal (closing it transitions the property status)', params: uuidParamSchema, body: updateBody, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      return app.db.transaction(async (manager) => {
        const dealRepo = manager.getRepository(Deal);
        const deal = await dealRepo.findOneBy({ id: req.params.id });
        if (!deal) throw AppError.notFound('Deal');

        const closingNow = req.body.status === 'CLOSED_WON' && deal.status !== 'CLOSED_WON';
        dealRepo.merge(deal, req.body);
        if (closingNow && !deal.closedAt) deal.closedAt = new Date();
        if (deal.status !== 'CLOSED_WON') deal.commissionPaid = false;
        await dealRepo.save(deal);

        // Closing a won deal moves the property to SOLD (sale) or RENTED (rent).
        if (closingNow) {
          const newStatus = deal.dealType === 'SALE' ? 'SOLD' : 'RENTED';
          await manager.getRepository(Property).update({ id: deal.propertyId }, { status: newStatus });
        }
        return deal;
      });
    });

  r.delete('/:id', { schema: { tags: ['deals'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await repo().delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Deal');
      return reply.status(204).send(null);
    });
}
