import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `activities` had ON DELETE SET NULL on its entity FKs AND a CHECK requiring at
 * least one entity link. Deleting a parent (e.g. a contact) that owned an activity
 * linked ONLY to it would null the FK and violate the CHECK, blocking the delete.
 * Drop the DB-level CHECK; creation-time validation still enforces a link in the API.
 */
export class DropActivityEntityCheck1710000001000 implements MigrationInterface {
  name = 'DropActivityEntityCheck1710000001000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE activities DROP CONSTRAINT IF EXISTS ck_activity_entity`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE activities ADD CONSTRAINT ck_activity_entity CHECK (
        contact_id IS NOT NULL OR property_id IS NOT NULL OR opportunity_id IS NOT NULL OR deal_id IS NOT NULL
      )
    `);
  }
}
