import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Contacts no longer carry a `contact_type`. A contact's role (owner, buyer, tenant…)
 * is derived from relationships instead: owner = a property's owner_contact, buyer =
 * an opportunity's / deal's contact, seller = a deal's seller_contact.
 */
export class RemoveContactType1710000011000 implements MigrationInterface {
  name = 'RemoveContactType1710000011000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS contact_type`);
    await q.query(`DROP TYPE IF EXISTS contact_type`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_type') THEN
          CREATE TYPE contact_type AS ENUM ('OWNER', 'BUYER', 'TENANT', 'LANDLORD', 'INVESTOR');
        END IF;
      END$$;
    `);
    await q.query(
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type contact_type NOT NULL DEFAULT 'OWNER'`,
    );
    await q.query(`ALTER TABLE contacts ALTER COLUMN contact_type DROP DEFAULT`);
  }
}
