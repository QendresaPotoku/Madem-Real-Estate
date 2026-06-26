import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * In-app notifications table. `type` is plain text (no PG enum) so new producers
 * can be added without a migration. Reuses the shared set_updated_at() trigger fn.
 */
export class AddNotifications1710000002000 implements MigrationInterface {
  name = 'AddNotifications1710000002000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE notifications (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type text NOT NULL,
        title text NOT NULL,
        body text,
        link_path text,
        is_read boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX ix_notifications_user ON notifications (user_id, is_read, created_at)`);
    await q.query(
      `CREATE TRIGGER trg_notifications_updated BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION set_updated_at()`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TRIGGER IF EXISTS trg_notifications_updated ON notifications`);
    await q.query(`DROP TABLE IF EXISTS notifications`);
  }
}
