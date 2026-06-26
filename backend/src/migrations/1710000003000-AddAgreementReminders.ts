import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Expiry reminders for listing agreements. Mirrors contract_reminders but keyed
 * to listing_agreements. Reuses the existing reminder_type / reminder_status PG
 * enums and the shared set_updated_at() trigger fn — no new enums needed.
 */
export class AddAgreementReminders1710000003000 implements MigrationInterface {
  name = 'AddAgreementReminders1710000003000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE agreement_reminders (
        id uuid PRIMARY KEY,
        agreement_id uuid NOT NULL REFERENCES listing_agreements(id) ON DELETE CASCADE,
        type reminder_type NOT NULL DEFAULT 'EXPIRY',
        remind_at timestamptz NOT NULL,
        message text,
        status reminder_status NOT NULL DEFAULT 'PENDING',
        sent_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX ix_agreement_reminders_due ON agreement_reminders (remind_at) WHERE status = 'PENDING'`);
    await q.query(
      `CREATE TRIGGER trg_agreement_reminders_updated BEFORE UPDATE ON agreement_reminders FOR EACH ROW EXECUTE FUNCTION set_updated_at()`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TRIGGER IF EXISTS trg_agreement_reminders_updated ON agreement_reminders`);
    await q.query(`DROP TABLE IF EXISTS agreement_reminders`);
  }
}
