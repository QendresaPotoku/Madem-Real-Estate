import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationLookups1710000006000 implements MigrationInterface {
  name = 'AddLocationLookups1710000006000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await q.query(`
      CREATE TABLE IF NOT EXISTS location_countries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        CONSTRAINT uq_location_countries_name UNIQUE (name)
      )
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS location_cities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        country_id uuid NOT NULL REFERENCES location_countries(id) ON DELETE CASCADE,
        name text NOT NULL,
        CONSTRAINT uq_location_cities_country_name UNIQUE (country_id, name)
      )
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS location_areas (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        city_id uuid NOT NULL REFERENCES location_cities(id) ON DELETE CASCADE,
        name text NOT NULL,
        CONSTRAINT uq_location_areas_city_name UNIQUE (city_id, name)
      )
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS location_cadastral_zones (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        city_id uuid NOT NULL REFERENCES location_cities(id) ON DELETE CASCADE,
        name text NOT NULL,
        CONSTRAINT uq_location_cadastral_zones_city_name UNIQUE (city_id, name)
      )
    `);

    await q.query(`
      INSERT INTO location_countries (name)
      SELECT DISTINCT trim(country)
      FROM (
        SELECT country FROM properties
        UNION ALL
        SELECT country FROM opportunities WHERE country IS NOT NULL
      ) s
      WHERE trim(country) <> ''
      ON CONFLICT (name) DO NOTHING
    `);
    await q.query(`INSERT INTO location_countries (name) VALUES ('Kosovo') ON CONFLICT (name) DO NOTHING`);
    await q.query(`
      INSERT INTO location_cities (country_id, name)
      SELECT DISTINCT lc.id, trim(s.city)
      FROM (
        SELECT country, city FROM properties
        UNION ALL
        SELECT COALESCE(country, 'Kosovo') AS country, city FROM opportunities WHERE city IS NOT NULL
      ) s
      JOIN location_countries lc ON lc.name = trim(COALESCE(s.country, 'Kosovo'))
      WHERE trim(s.city) <> ''
      ON CONFLICT (country_id, name) DO NOTHING
    `);
    await q.query(`
      INSERT INTO location_areas (city_id, name)
      SELECT DISTINCT lci.id, trim(s.area)
      FROM (
        SELECT country, city, area FROM properties WHERE area IS NOT NULL
        UNION ALL
        SELECT COALESCE(country, 'Kosovo') AS country, city, area FROM opportunities WHERE city IS NOT NULL AND area IS NOT NULL
      ) s
      JOIN location_countries lc ON lc.name = trim(COALESCE(s.country, 'Kosovo'))
      JOIN location_cities lci ON lci.country_id = lc.id AND lci.name = trim(s.city)
      WHERE trim(s.area) <> ''
      ON CONFLICT (city_id, name) DO NOTHING
    `);
    await q.query(`
      INSERT INTO location_cadastral_zones (city_id, name)
      SELECT DISTINCT lci.id, trim(p.cadastral_zone)
      FROM properties p
      JOIN location_countries lc ON lc.name = trim(p.country)
      JOIN location_cities lci ON lci.country_id = lc.id AND lci.name = trim(p.city)
      WHERE p.cadastral_zone IS NOT NULL AND trim(p.cadastral_zone) <> ''
      ON CONFLICT (city_id, name) DO NOTHING
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS location_cadastral_zones CASCADE`);
    await q.query(`DROP TABLE IF EXISTS location_areas CASCADE`);
    await q.query(`DROP TABLE IF EXISTS location_cities CASCADE`);
    await q.query(`DROP TABLE IF EXISTS location_countries CASCADE`);
  }
}