import cron from 'node-cron';
import { In, LessThanOrEqual } from 'typeorm';
import type { EntityManager } from 'typeorm';
import type { FastifyInstance } from 'fastify';
import { AgreementReminder, ContractReminder, DealReminder, User } from '../entities';
import { notify } from '../lib/notifications';


const ADVISORY_LOCK_ID = 4823917;

export interface ReminderScanResult {
  contract: number;
  agreement: number;
  deal: number;
  total: number;
}

/**
 * Scan all due reminders, notify, and mark them SENT. Safe to run concurrently:
 * a Postgres advisory lock makes overlapping invocations no-ops. Called both by
 * the in-process cron (dev) and the POST /internal/run-reminders endpoint (prod,
 * triggered by Cloud Scheduler so the service can scale to zero).
 */
export async function runReminderScan(app: FastifyInstance): Promise<ReminderScanResult> {
  let result: ReminderScanResult = { contract: 0, agreement: 0, deal: 0, total: 0 };

  await app.db.transaction(async (manager) => {
    const [{ locked }] = await manager.query(
      'SELECT pg_try_advisory_xact_lock($1) AS locked',
      [ADVISORY_LOCK_ID],
    );
    if (!locked) return;

    // Resolve the admin fallback list once, lazily, shared across both scans.
    let admins: User[] | null = null;
    const adminIds = async () => {
      if (!admins) admins = await manager.getRepository(User).find({ where: { role: 'ADMIN', status: 'ACTIVE' } });
      return admins.map((u) => u.id);
    };

    const contract = await scanContractReminders(manager, adminIds);
    const agreement = await scanAgreementReminders(manager, adminIds);
    const deal = await scanDealReminders(manager);
    result = { contract, agreement, deal, total: contract + agreement + deal };

    if (result.total > 0) {
      app.log.info(
        `reminder scan: ${result.total} reminder(s) due (${contract} contract, ${agreement} agreement, ${deal} deal) → notified, marked SENT`,
      );
    }
  });

  return result;
}

export function startReminderCron(app: FastifyInstance) {
  cron.schedule('0 * * * *', async () => {
    try {
      await runReminderScan(app);
    } catch (err) {
      app.log.error({ err }, 'reminder cron failed');
    }
  });

  app.log.info('reminder cron scheduled (hourly)');
}

/** Notify on due contract reminders and mark them SENT. Returns the count handled. */
async function scanContractReminders(manager: EntityManager, adminIds: () => Promise<string[]>): Promise<number> {
  const due = await manager.getRepository(ContractReminder).find({
    where: { status: 'PENDING', remindAt: LessThanOrEqual(new Date()) },
    relations: { contract: true },
  });
  if (!due.length) return 0;

  for (const rem of due) {
    const recipients = rem.contract?.agentUserId ? [rem.contract.agentUserId] : await adminIds();
    for (const userId of recipients) {
      await notify(manager, {
        userId,
        type: 'CONTRACT_REMINDER',
        title: 'Contract reminder',
        body: rem.message,
        linkPath: '/contracts',
      });
    }
  }

  await manager
    .getRepository(ContractReminder)
    .update({ id: In(due.map((r) => r.id)) }, { status: 'SENT', sentAt: new Date() });
  return due.length;
}

/** Notify on due rent-deal expiry reminders and mark them SENT. Returns the count handled. */
async function scanDealReminders(manager: EntityManager): Promise<number> {
  const due = await manager.getRepository(DealReminder).find({
    where: { status: 'PENDING', remindAt: LessThanOrEqual(new Date()) },
    relations: { deal: true },
  });
  if (!due.length) return 0;

  // Rent-expiry reminders are a global notification - broadcast to every active user.
  const recipients = (await manager.getRepository(User).find({ where: { status: 'ACTIVE' } })).map((u) => u.id);
  for (const rem of due) {
    for (const userId of recipients) {
      await notify(manager, {
        userId,
        type: 'DEAL_REMINDER',
        title: 'Rental expiry reminder',
        body: rem.message,
        linkPath: rem.deal ? `/deals?dealId=${rem.deal.id}` : '/deals',
      });
    }
  }

  await manager
    .getRepository(DealReminder)
    .update({ id: In(due.map((r) => r.id)) }, { status: 'SENT', sentAt: new Date() });
  return due.length;
}

/** Notify on due agreement-expiry reminders and mark them SENT. Returns the count handled. */
async function scanAgreementReminders(manager: EntityManager, adminIds: () => Promise<string[]>): Promise<number> {
  const due = await manager.getRepository(AgreementReminder).find({
    where: { status: 'PENDING', remindAt: LessThanOrEqual(new Date()) },
    relations: { agreement: true },
  });
  if (!due.length) return 0;

  for (const rem of due) {
    const recipients = rem.agreement?.agentUserId ? [rem.agreement.agentUserId] : await adminIds();
    for (const userId of recipients) {
      await notify(manager, {
        userId,
        type: 'AGREEMENT_REMINDER',
        title: 'Listing agreement reminder',
        body: rem.message,
        linkPath: '/listing-agreements',
      });
    }
  }

  await manager
    .getRepository(AgreementReminder)
    .update({ id: In(due.map((r) => r.id)) }, { status: 'SENT', sentAt: new Date() });
  return due.length;
}
