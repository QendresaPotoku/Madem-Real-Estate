import { MigrationInterface, QueryRunner } from 'typeorm';

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
    await q.query(`UPDATE opportunities SET status = 'QUALIFIED' WHERE status = 'MATCHING'`);
    await q.query(`ALTER TYPE opportunity_status RENAME TO opportunity_status_old`);
    await q.query(`CREATE TYPE opportunity_status AS ENUM ('NEW', 'QUALIFIED', 'VIEWING', 'NEGOTIATING', 'WON', 'LOST')`);
    await q.query(`ALTER TABLE opportunities ALTER COLUMN status DROP DEFAULT`);
    await q.query(`ALTER TABLE opportunities ALTER COLUMN status TYPE opportunity_status USING status::text::opportunity_status`);
    await q.query(`ALTER TABLE opportunities ALTER COLUMN status SET DEFAULT 'NEW'`);
    await q.query(`DROP TYPE opportunity_status_old`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TYPE opportunity_status RENAME TO opportunity_status_old`);
    await q.query(`CREATE TYPE opportunity_status AS ENUM ('NEW', 'QUALIFIED', 'MATCHING', 'VIEWING', 'NEGOTIATING', 'WON', 'LOST')`);
    await q.query(`ALTER TABLE opportunities ALTER COLUMN status DROP DEFAULT`);
    await q.query(`ALTER TABLE opportunities ALTER COLUMN status TYPE opportunity_status USING status::text::opportunity_status`);
    await q.query(`ALTER TABLE opportunities ALTER COLUMN status SET DEFAULT 'NEW'`);
    await q.query(`DROP TYPE opportunity_status_old`);
  }
}
