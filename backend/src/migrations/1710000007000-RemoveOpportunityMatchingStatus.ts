import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Drop 'MATCHING' from the opportunity_status enum. Matching stays a feature/action
 * (the on-demand /opportunities/:id/matches endpoint), not a pipeline stage.
 * Any existing MATCHING opportunities fall back to QUALIFIED.
 *
 * Postgres can't remove an enum value in place, so the type is recreated.
 */
export class RemoveOpportunityMatchingStatus1710000007000 implements MigrationInterface {
  name = 'RemoveOpportunityMatchingStatus1710000007000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `UPDATE opportunities SET status = 'QUALIFIED' WHERE status::text = 'MATCHING'`,
    );

    await q.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'opportunity_status'
        )
        AND EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'opportunity_status'
            AND e.enumlabel = 'MATCHING'
        ) THEN
          ALTER TYPE opportunity_status RENAME TO opportunity_status_old;
          CREATE TYPE opportunity_status AS ENUM ('NEW', 'QUALIFIED', 'VIEWING', 'NEGOTIATING', 'WON', 'LOST');
          ALTER TABLE opportunities ALTER COLUMN status DROP DEFAULT;
          ALTER TABLE opportunities ALTER COLUMN status TYPE opportunity_status USING status::text::opportunity_status;
          ALTER TABLE opportunities ALTER COLUMN status SET DEFAULT 'NEW';
          DROP TYPE opportunity_status_old;
        END IF;
      END $$;
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'opportunity_status'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'opportunity_status'
            AND e.enumlabel = 'MATCHING'
        ) THEN
          ALTER TYPE opportunity_status RENAME TO opportunity_status_old;
          CREATE TYPE opportunity_status AS ENUM ('NEW', 'QUALIFIED', 'MATCHING', 'VIEWING', 'NEGOTIATING', 'WON', 'LOST');
          ALTER TABLE opportunities ALTER COLUMN status DROP DEFAULT;
          ALTER TABLE opportunities ALTER COLUMN status TYPE opportunity_status USING status::text::opportunity_status;
          ALTER TABLE opportunities ALTER COLUMN status SET DEFAULT 'NEW';
          DROP TYPE opportunity_status_old;
        END IF;
      END $$;
    `);
  }
}
