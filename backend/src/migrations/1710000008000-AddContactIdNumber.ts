import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContactIdNumber1710000008000 implements MigrationInterface {
  name = "AddContactIdNumber1710000008000";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE contacts
      ADD COLUMN IF NOT EXISTS id_number text
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS id_number`);
  }
}
