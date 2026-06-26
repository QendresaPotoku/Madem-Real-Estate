import type { EntityManager } from 'typeorm';
import { AgreementReminder, ListingAgreement } from '../../entities';

/** Days-before-end offsets at which expiry reminders fire. */
export const REMINDER_OFFSET_DAYS = [30, 7, 0];

function endDateMinusDays(endDate: string, days: number): Date {
  const d = new Date(`${endDate}T09:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/**
 * (Re)generate EXPIRY reminders for an ACTIVE listing agreement with an end date.
 * Clears existing PENDING expiry reminders first so edits stay consistent and we
 * never create duplicates for the same offset.
 */
export async function regenerateAgreementExpiryReminders(
  manager: EntityManager,
  agreement: ListingAgreement,
): Promise<void> {
  const repo = manager.getRepository(AgreementReminder);
  await repo.delete({ agreementId: agreement.id, type: 'EXPIRY', status: 'PENDING' });

  if (agreement.status !== 'ACTIVE' || !agreement.endDate) return;

  for (const days of REMINDER_OFFSET_DAYS) {
    await repo.save(
      repo.create({
        agreementId: agreement.id,
        type: 'EXPIRY',
        remindAt: endDateMinusDays(agreement.endDate, days),
        message:
          days === 0
            ? `Listing agreement ${agreement.code} expires today — renew or terminate the mandate.`
            : `Listing agreement ${agreement.code} expires in ${days} day(s) — follow up with the owner.`,
        status: 'PENDING',
      }),
    );
  }
}

/** Supersede still-pending reminders when an agreement is expired/terminated. */
export async function dismissPendingAgreementReminders(
  manager: EntityManager,
  agreementId: string,
): Promise<void> {
  await manager
    .getRepository(AgreementReminder)
    .update({ agreementId, status: 'PENDING' }, { status: 'DISMISSED' });
}
