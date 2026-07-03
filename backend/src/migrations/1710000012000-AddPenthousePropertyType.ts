import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add `PENTHOUSE` to the `property_type` enum. Idempotent (IF NOT EXISTS) so it is
 * safe to re-run during deployment. Postgres cannot drop an enum value, so the
 * down migration is intentionally a no-op.
 */
export class AddPenthousePropertyType1710000012000 implements MigrationInterface {
  name = 'AddPenthousePropertyType1710000012000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'PENTHOUSE'`);
  }

  public async down(): Promise<void> {
    // Postgres has no `ALTER TYPE ... DROP VALUE`; removing an in-use enum value
    // would require recreating the type and is unsafe to automate. No-op.
  }
}
