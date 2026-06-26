import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'location_countries' })
export class LocationCountry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  name!: string;
}

@Entity({ name: 'location_cities' })
@Index(['countryId', 'name'], { unique: true })
export class LocationCity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'country_id' })
  countryId!: string;

  @ManyToOne(() => LocationCountry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'country_id' })
  country!: LocationCountry;

  @Column({ type: 'text' })
  name!: string;
}

@Entity({ name: 'location_areas' })
@Index(['cityId', 'name'], { unique: true })
export class LocationArea {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'city_id' })
  cityId!: string;

  @ManyToOne(() => LocationCity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city!: LocationCity;

  @Column({ type: 'text' })
  name!: string;
}

@Entity({ name: 'location_cadastral_zones' })
@Index(['cityId', 'name'], { unique: true })
export class LocationCadastralZone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'city_id' })
  cityId!: string;

  @ManyToOne(() => LocationCity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city!: LocationCity;

  @Column({ type: 'text' })
  name!: string;
}
