import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Between, In, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  Contact,
  Contract,
  ContractReminder,
  Deal,
  Offer,
  Opportunity,
  Property,
  Viewing,
} from '../../entities';
import { localizedSchema } from '../../schemas/common';

const summaryResponse = z.object({
  properties: z.object({
    total: z.number(),
    active: z.number(),
    draft: z.number(),
    sold: z.number(),
    rented: z.number(),
  }),
  opportunities: z.object({ total: z.number(), open: z.number() }),
  pipeline: z.object({
    viewingsScheduled: z.number(),
    offersSubmitted: z.number(),
    dealsOpen: z.number(),
  }),
  contracts: z.object({ active: z.number(), expiringSoon: z.number() }),
  leads: z.object({ new7d: z.number() }),
  viewings: z.object({ today: z.number() }),
  generatedRevenue: z.object({
    last7d: z.number(),
    last30d: z.number(),
    year: z.number(),
  }),
  unpaidCommissions: z.object({
    count: z.number(),
    deals: z.array(
      z.object({
        id: z.string().uuid(),
        code: z.string(),
        propertyCode: z.string().nullable(),
        mademCommissionValue: z.number().nullable(),
      }),
    ),
  }),
  reminders: z.object({
    due: z.number(),
    upcoming: z.array(
      z.object({
        id: z.string().uuid(),
        contractId: z.string().uuid(),
        remindAt: z.date(),
        message: z.string().nullable(),
        status: z.string(),
      }),
    ),
  }),
  attention: z.object({
    draftProperties: z.array(
      z.object({ id: z.string().uuid(), propertyCode: z.string(), titleJson: localizedSchema }),
    ),
    viewingsToday: z.array(
      z.object({ id: z.string().uuid(), scheduledAt: z.date(), propertyCode: z.string().nullable() }),
    ),
    expiringContracts: z.array(
      z.object({ id: z.string().uuid(), code: z.string(), endDate: z.string().nullable() }),
    ),
  }),
});

export async function dashboardRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  r.get(
    '/summary',
    { schema: { tags: ['dashboard'], summary: 'KPIs, pipeline counts, and due reminders', response: { 200: summaryResponse } } },
    async () => {
      const propRepo = app.repo(Property);
      const remRepo = app.repo(ContractReminder);
      const viewRepo = app.repo(Viewing);
      const contractRepo = app.repo(Contract);
      const now = new Date();

      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
      const todayStr = toDateStr(now);
      const in30Str = toDateStr(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
      const revenueSince = async (since: Date) => {
        const row = await app.repo(Deal)
          .createQueryBuilder('d')
          .select('COALESCE(SUM(d.madem_commission_value), 0)', 'total')
          .where('d.status = :status', { status: 'CLOSED_WON' })
          .andWhere('d.commission_paid = true')
          .andWhere('d.closed_at >= :since', { since })
          .getRawOne<{ total: string }>();
        return Number(row?.total ?? 0);
      };
      const unpaidCommissionQb = () =>
        app.repo(Deal)
          .createQueryBuilder('d')
          .where('d.status = :status', { status: 'CLOSED_WON' })
          .andWhere('d.commission_paid = false')
          .andWhere('d.madem_commission_value IS NOT NULL')
          .andWhere('d.madem_commission_value > 0');

      const [
        total,
        active,
        draft,
        sold,
        rented,
        oppTotal,
        oppOpen,
        viewingsScheduled,
        offersSubmitted,
        dealsOpen,
        contractsActive,
        contractsExpiring,
        newLeads7d,
        viewingsTodayCount,
        dueCount,
        upcoming,
        draftProperties,
        viewingsTodayList,
        expiringContractsList,
        revenue7d,
        revenue30d,
        revenueYear,
        unpaidCommissionCount,
        unpaidCommissionDeals,
      ] = await Promise.all([
        propRepo.count(),
        propRepo.countBy({ status: 'ACTIVE' }),
        propRepo.countBy({ status: 'DRAFT' }),
        propRepo.countBy({ status: 'SOLD' }),
        propRepo.countBy({ status: 'RENTED' }),
        app.repo(Opportunity).count(),
        app.repo(Opportunity).countBy({ status: Not(In(['WON', 'LOST'])) }),
        viewRepo.countBy({ status: 'SCHEDULED' }),
        app.repo(Offer).countBy({ status: 'SUBMITTED' }),
        app.repo(Deal).countBy({ status: In(['OPEN', 'PENDING']) }),
        contractRepo.countBy({ status: 'ACTIVE' }),
        contractRepo.countBy({ status: 'ACTIVE', endDate: Between(todayStr, in30Str) }),
        app.repo(Contact).countBy({ createdAt: MoreThanOrEqual(sevenDaysAgo) }),
        viewRepo.countBy({ status: 'SCHEDULED', scheduledAt: Between(startOfToday, endOfToday) }),
        remRepo.countBy({ status: In(['PENDING', 'SENT']), remindAt: LessThanOrEqual(now) }),
        remRepo.find({
          where: { status: In(['PENDING', 'SENT']) },
          order: { remindAt: 'ASC' },
          take: 10,
        }),
        propRepo.find({ where: { status: 'DRAFT' }, order: { createdAt: 'DESC' }, take: 5 }),
        viewRepo.find({
          where: { status: 'SCHEDULED', scheduledAt: Between(startOfToday, endOfToday) },
          order: { scheduledAt: 'ASC' },
          take: 5,
          relations: { property: true },
        }),
        contractRepo.find({
          where: { status: 'ACTIVE', endDate: Between(todayStr, in30Str) },
          order: { endDate: 'ASC' },
          take: 5,
        }),
        revenueSince(sevenDaysAgo),
        revenueSince(thirtyDaysAgo),
        revenueSince(startOfYear),
        unpaidCommissionQb().getCount(),
        app.repo(Deal).find({
          where: {
            status: 'CLOSED_WON',
            commissionPaid: false,
            mademCommissionValue: MoreThanOrEqual(0.01),
          },
          relations: { property: true },
          order: { createdAt: 'DESC' },
          take: 5,
        }),
      ]);

      return {
        properties: { total, active, draft, sold, rented },
        opportunities: { total: oppTotal, open: oppOpen },
        pipeline: { viewingsScheduled, offersSubmitted, dealsOpen },
        contracts: { active: contractsActive, expiringSoon: contractsExpiring },
        leads: { new7d: newLeads7d },
        viewings: { today: viewingsTodayCount },
        generatedRevenue: {
          last7d: revenue7d,
          last30d: revenue30d,
          year: revenueYear,
        },
        unpaidCommissions: {
          count: unpaidCommissionCount,
          deals: unpaidCommissionDeals.map((d) => ({
            id: d.id,
            code: d.code,
            propertyCode: d.property?.propertyCode ?? null,
            mademCommissionValue: d.mademCommissionValue,
          })),
        },
        reminders: {
          due: dueCount,
          upcoming: upcoming.map((u) => ({
            id: u.id,
            contractId: u.contractId,
            remindAt: u.remindAt,
            message: u.message,
            status: u.status,
          })),
        },
        attention: {
          draftProperties: draftProperties.map((p) => ({
            id: p.id,
            propertyCode: p.propertyCode,
            titleJson: p.titleJson,
          })),
          viewingsToday: viewingsTodayList.map((v) => ({
            id: v.id,
            scheduledAt: v.scheduledAt,
            propertyCode: v.property?.propertyCode ?? null,
          })),
          expiringContracts: expiringContractsList.map((c) => ({
            id: c.id,
            code: c.code,
            endDate: c.endDate,
          })),
        },
      };
    },
  );

  // Lightweight featured-properties widget for the dashboard landing.
  r.get(
    '/featured',
    {
      schema: {
        tags: ['dashboard'],
        response: {
          200: z.array(z.object({ id: z.string().uuid(), propertyCode: z.string(), titleJson: localizedSchema, price: z.number() })),
        },
      },
    },
    async () =>
      app.repo(Property).find({ where: { isFeatured: true, status: 'ACTIVE' }, take: 6, order: { createdAt: 'DESC' } }),
  );
}
