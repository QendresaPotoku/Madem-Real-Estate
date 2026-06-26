import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ListingAgreement } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import { errorResponseSchema, listResponse, paginationQuerySchema, uuidParamSchema } from '../../schemas/common';
import { AGREEMENT_STATUSES, AGREEMENT_TYPES } from '../../schemas/enums';
import { dismissPendingAgreementReminders, regenerateAgreementExpiryReminders } from './reminders.service';

const response = z.object({
  id: z.string().uuid(),
  code: z.string(),
  propertyId: z.string().uuid(),
  ownerContactId: z.string().uuid(),
  agentUserId: z.string().uuid(),
  agreementType: z.enum(AGREEMENT_TYPES),
  startDate: z.string(),
  endDate: z.string().nullable(),
  commissionPercentage: z.number().nullable(),
  status: z.enum(AGREEMENT_STATUSES),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createBody = z.object({
  propertyId: z.string().uuid(),
  ownerContactId: z.string().uuid(),
  agentUserId: z.string().uuid(),
  agreementType: z.enum(AGREEMENT_TYPES),
  startDate: z.string(),
  endDate: z.string().optional(),
  commissionPercentage: z.number().min(0).max(100).optional(),
  status: z.enum(AGREEMENT_STATUSES).default('DRAFT'),
});

const updateBody = createBody.partial();
const listQuery = paginationQuerySchema.extend({
  propertyId: z.string().uuid().optional(),
  agentUserId: z.string().uuid().optional(),
  status: z.enum(AGREEMENT_STATUSES).optional(),
  // Only ACTIVE agreements whose end date falls within the next N days (inclusive).
  expiringInDays: z.coerce.number().int().min(0).optional(),
});

export async function listingAgreementRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);
  const repo = () => app.repo(ListingAgreement);

  r.get('/', { schema: { tags: ['listing-agreements'], querystring: listQuery, response: { 200: listResponse(response) } } },
    async (req) => {
      const qb = repo().createQueryBuilder('la');
      if (req.query.propertyId) qb.andWhere('la.property_id = :p', { p: req.query.propertyId });
      if (req.query.agentUserId) qb.andWhere('la.agent_user_id = :a', { a: req.query.agentUserId });
      if (req.query.status) qb.andWhere('la.status = :s', { s: req.query.status });
      if (req.query.expiringInDays !== undefined) {
        qb.andWhere("la.status = 'ACTIVE'")
          .andWhere('la.end_date IS NOT NULL')
          .andWhere('la.end_date >= CURRENT_DATE')
          .andWhere("la.end_date <= CURRENT_DATE + (:d::int * INTERVAL '1 day')", { d: req.query.expiringInDays });
      }
      return paginate(qb, req.query, { createdAt: 'la.created_at', startDate: 'la.start_date', endDate: 'la.end_date' }, 'la.created_at');
    });

  r.get('/:id', { schema: { tags: ['listing-agreements'], params: uuidParamSchema, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Listing agreement');
      return row;
    });

  r.post('/', { schema: { tags: ['listing-agreements'], summary: 'Create an agreement (ACTIVE auto-generates expiry reminders)', body: createBody, response: { 201: response } } },
    async (req, reply) => {
      const agreement = await app.db.transaction(async (manager) => {
        const aRepo = manager.getRepository(ListingAgreement);
        const saved = await aRepo.save(aRepo.create(req.body));
        const full = await aRepo.findOneByOrFail({ id: saved.id });
        await regenerateAgreementExpiryReminders(manager, full);
        return full;
      });
      return reply.status(201).send(agreement);
    });

  r.patch('/:id', { schema: { tags: ['listing-agreements'], summary: 'Update an agreement (re-syncs expiry reminders)', params: uuidParamSchema, body: updateBody, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      return app.db.transaction(async (manager) => {
        const aRepo = manager.getRepository(ListingAgreement);
        const row = await aRepo.findOneBy({ id: req.params.id });
        if (!row) throw AppError.notFound('Listing agreement');
        const prevStatus = row.status;
        aRepo.merge(row, req.body);
        await aRepo.save(row);

        if (['EXPIRED', 'TERMINATED'].includes(row.status) && row.status !== prevStatus) {
          await dismissPendingAgreementReminders(manager, row.id);
        } else {
          await regenerateAgreementExpiryReminders(manager, row);
        }
        return row;
      });
    });

  r.delete('/:id', { schema: { tags: ['listing-agreements'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await repo().delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Listing agreement');
      return reply.status(204).send(null);
    });
}
