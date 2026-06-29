import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDealCommissionPaid1710000005000 implements MigrationInterface {
  name = "AddDealCommissionPaid1710000005000";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE deals 
      ADD COLUMN IF NOT EXISTS commission_paid boolean NOT NULL DEFAULT false
    `);

    await q.query(`
      CREATE INDEX IF NOT EXISTS ix_deals_unpaid_commissions
      ON deals (created_at DESC)
      WHERE status = 'CLOSED_WON'
        AND commission_paid = false
        AND madem_commission_value IS NOT NULL
        AND madem_commission_value > 0
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS ix_deals_unpaid_commissions`);
    await q.query(`ALTER TABLE deals DROP COLUMN IF EXISTS commission_paid`);
  }
}
