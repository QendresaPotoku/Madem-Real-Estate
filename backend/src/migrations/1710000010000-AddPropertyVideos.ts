import { MigrationInterface, QueryRunner } from 'typeorm';

/** Property videos gallery (mirrors property_images, minus the cover flag). */
export class AddPropertyVideos1710000010000 implements MigrationInterface {
  name = 'AddPropertyVideos1710000010000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE property_videos (
        id uuid PRIMARY KEY,
        property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        video_url text NOT NULL,
        storage_key text,
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX ix_property_videos_property_sort ON property_videos (property_id, sort_order)`);
    await q.query(
      `CREATE TRIGGER trg_property_videos_updated BEFORE UPDATE ON property_videos FOR EACH ROW EXECUTE FUNCTION set_updated_at()`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS property_videos CASCADE`);
  }
}
