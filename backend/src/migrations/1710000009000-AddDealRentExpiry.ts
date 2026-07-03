import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rent-deal contract expiry: a date on the deal plus its own reminder rows
 * (mirrors contract_reminders), so rent deals notify the agent before expiry
 * now that the standalone Contracts section is retired.
 */
export class AddDealRentExpiry1710000009000 implements MigrationInterface {
  name = 'AddDealRentExpiry1710000009000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE deals ADD COLUMN contract_expiry_date date`);

    await q.query(`
      CREATE TABLE deal_reminders (
        id uuid PRIMARY KEY,
        deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
        type reminder_type NOT NULL DEFAULT 'EXPIRY',
        remind_at timestamptz NOT NULL,
        message text,
        status reminder_status NOT NULL DEFAULT 'PENDING',
        sent_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX ix_deal_reminders_due ON deal_reminders (remind_at) WHERE status = 'PENDING'`);
    await q.query(
      `CREATE TRIGGER trg_deal_reminders_updated BEFORE UPDATE ON deal_reminders FOR EACH ROW EXECUTE FUNCTION set_updated_at()`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS deal_reminders CASCADE`);
    await q.query(`ALTER TABLE deals DROP COLUMN IF EXISTS contract_expiry_date`);
  }
}
