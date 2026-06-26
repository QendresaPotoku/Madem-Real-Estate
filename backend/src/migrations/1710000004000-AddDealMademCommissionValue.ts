import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDealMademCommissionValue1710000004000 implements MigrationInterface {
  name = 'AddDealMademCommissionValue1710000004000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE deals
      ADD COLUMN madem_commission_value numeric(14,2) CHECK (madem_commission_value >= 0)
    `);
    await q.query(`CREATE INDEX ix_deals_closed_revenue ON deals (closed_at) WHERE status = 'CLOSED_WON'`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS ix_deals_closed_revenue`);
    await q.query(`ALTER TABLE deals DROP COLUMN IF EXISTS madem_commission_value`);
  }
}
