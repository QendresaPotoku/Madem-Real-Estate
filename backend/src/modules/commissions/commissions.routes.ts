import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Commission, CommissionSplit } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import {
  currencySchema,
  errorResponseSchema,
  listResponse,
  paginationQuerySchema,
  uuidParamSchema,
} from '../../schemas/common';
import { COMMISSION_STATUSES, RECEIVER_TYPES } from '../../schemas/enums';

const commissionResponse = z.object({
  id: z.string().uuid(),
  dealId: z.string().uuid(),
  totalAmount: z.number(),
  currency: z.string(),
  status: z.enum(COMMISSION_STATUSES),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const splitResponse = z.object({
  id: z.string().uuid(),
  commissionId: z.string().uuid(),
  receiverType: z.enum(RECEIVER_TYPES),
  receiverUserId: z.string().uuid().nullable(),
  receiverLabel: z.string().nullable(),
  percentage: z.number().nullable(),
  amount: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createCommission = z.object({
  dealId: z.string().uuid(),
  totalAmount: z.number().min(0),
  currency: currencySchema,
  status: z.enum(COMMISSION_STATUSES).default('PENDING'),
});

const splitInput = z.object({
  receiverType: z.enum(RECEIVER_TYPES),
  receiverUserId: z.string().uuid().optional(),
  receiverLabel: z.string().optional(),
  percentage: z.number().min(0).max(100),
}).refine((v) => v.receiverType !== 'AGENT' || !!v.receiverUserId, {
  message: 'AGENT splits require receiverUserId',
  path: ['receiverUserId'],
});

const setSplitsBody = z.object({ splits: z.array(splitInput).min(1) });

export async function commissionRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  r.get('/', { schema: { tags: ['commissions'], querystring: paginationQuerySchema.extend({ status: z.enum(COMMISSION_STATUSES).optional() }), response: { 200: listResponse(commissionResponse) } } },
    async (req) => {
      const qb = app.repo(Commission).createQueryBuilder('c');
      if (req.query.status) qb.andWhere('c.status = :s', { s: req.query.status });
      return paginate(qb, req.query, { createdAt: 'c.created_at', totalAmount: 'c.total_amount' }, 'c.created_at');
    });

  r.get('/:id', { schema: { tags: ['commissions'], params: uuidParamSchema, response: { 200: commissionResponse, 404: errorResponseSchema } } },
    async (req) => {
      const row = await app.repo(Commission).findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Commission');
      return row;
    });

  r.post('/', { schema: { tags: ['commissions'], summary: 'Create a commission for a deal', body: createCommission, response: { 201: commissionResponse } } },
    async (req, reply) => reply.status(201).send(await app.repo(Commission).save(app.repo(Commission).create(req.body))));

  r.patch('/:id', { schema: { tags: ['commissions'], params: uuidParamSchema, body: z.object({ totalAmount: z.number().min(0).optional(), status: z.enum(COMMISSION_STATUSES).optional() }), response: { 200: commissionResponse, 404: errorResponseSchema } } },
    async (req) => {
      const repo = app.repo(Commission);
      const row = await repo.findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Commission');
      repo.merge(row, req.body);
      await repo.save(row);
      return row;
    });

  r.get('/:id/splits', { schema: { tags: ['commissions'], params: uuidParamSchema, response: { 200: z.array(splitResponse) } } },
    async (req) => app.repo(CommissionSplit).find({ where: { commissionId: req.params.id } }));

  r.put('/:id/splits', {
    schema: {
      tags: ['commissions'],
      summary: 'Replace a commission\'s splits (percentages must sum to 100)',
      params: uuidParamSchema,
      body: setSplitsBody,
      response: { 200: z.array(splitResponse), 400: errorResponseSchema, 404: errorResponseSchema },
    },
  }, async (req) => {
    const sum = req.body.splits.reduce((acc, s) => acc + s.percentage, 0);
    if (Math.abs(sum - 100) > 0.01) {
      throw AppError.badRequest(`Split percentages must sum to 100 (got ${sum})`);
    }
    return app.db.transaction(async (manager) => {
      const commission = await manager.getRepository(Commission).findOneBy({ id: req.params.id });
      if (!commission) throw AppError.notFound('Commission');
      const splitRepo = manager.getRepository(CommissionSplit);
      await splitRepo.delete({ commissionId: commission.id });
      const rows = req.body.splits.map((s) =>
        splitRepo.create({
          commissionId: commission.id,
          receiverType: s.receiverType,
          receiverUserId: s.receiverUserId ?? null,
          receiverLabel: s.receiverLabel ?? null,
          percentage: s.percentage,
          amount: Math.round(commission.totalAmount * s.percentage) / 100,
        }),
      );
      await splitRepo.save(rows);
      return splitRepo.find({ where: { commissionId: commission.id } });
    });
  });
}
