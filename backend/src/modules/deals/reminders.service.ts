import type { EntityManager } from 'typeorm';
import { Deal, DealReminder } from '../../entities';

/** Days-before-expiry offsets at which rent-deal reminders fire (1 month / 1 week / day-of). */
export const REMINDER_OFFSET_DAYS = [30, 7, 0];

function expiryMinusDays(expiryDate: string, days: number): Date {
  const d = new Date(`${expiryDate}T09:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/**
 * (Re)generate EXPIRY reminders for a RENT deal with a contract expiry date.
 * Clears existing PENDING expiry reminders first so edits stay consistent.
 * Mirrors the retired contract-reminder logic.
 */
export async function regenerateDealExpiryReminders(manager: EntityManager, deal: Deal): Promise<void> {
  const repo = manager.getRepository(DealReminder);
  await repo.delete({ dealId: deal.id, type: 'EXPIRY', status: 'PENDING' });

  if (deal.dealType !== 'RENT' || !deal.contractExpiryDate) return;
  if (['CLOSED_LOST', 'CANCELLED'].includes(deal.status)) return;

  for (const days of REMINDER_OFFSET_DAYS) {
    await repo.save(
      repo.create({
        dealId: deal.id,
        type: 'EXPIRY',
        remindAt: expiryMinusDays(deal.contractExpiryDate, days),
        message:
          days === 0
            ? `Rental contract for deal ${deal.code} ends today. Confirm if the property is free or still rented.`
            : `Rental contract for deal ${deal.code} ends in ${days} day(s). Follow up with the parties.`,
        status: 'PENDING',
      }),
    );
  }
}
