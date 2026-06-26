import type { EntityManager } from 'typeorm';
import { Contract, ContractReminder } from '../../entities';

/** Days-before-end offsets at which expiry reminders fire. */
export const REMINDER_OFFSET_DAYS = [30, 7, 0];

function endDateMinusDays(endDate: string, days: number): Date {
  const d = new Date(`${endDate}T09:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/**
 * (Re)generate EXPIRY reminders for a RENTAL contract with an end date.
 * Clears existing PENDING expiry reminders first so edits stay consistent.
 */
export async function regenerateExpiryReminders(manager: EntityManager, contract: Contract): Promise<void> {
  const repo = manager.getRepository(ContractReminder);
  await repo.delete({ contractId: contract.id, type: 'EXPIRY', status: 'PENDING' });

  if (contract.contractType !== 'RENTAL' || !contract.endDate) return;
  if (['TERMINATED', 'RENEWED', 'COMPLETED'].includes(contract.status)) return;

  for (const days of REMINDER_OFFSET_DAYS) {
    await repo.save(
      repo.create({
        contractId: contract.id,
        type: 'EXPIRY',
        remindAt: endDateMinusDays(contract.endDate, days),
        message:
          days === 0
            ? `Rental contract ${contract.code} ends today — confirm if the property is free or still rented.`
            : `Rental contract ${contract.code} ends in ${days} day(s) — follow up with the parties.`,
        status: 'PENDING',
      }),
    );
  }
}

/** Supersede still-pending reminders when a contract is terminated/renewed. */
export async function dismissPendingReminders(manager: EntityManager, contractId: string): Promise<void> {
  await manager
    .getRepository(ContractReminder)
    .update({ contractId, status: 'PENDING' }, { status: 'DISMISSED' });
}
