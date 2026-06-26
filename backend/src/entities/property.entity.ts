import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { User } from './user.entity';
import { Contact } from './contact.entity';
import { HeatingType } from './lookups.entity';
import { numericTransformer } from '../lib/transformers';
import {
  BUILDING_CONDITIONS,
  LISTING_TYPES,
  ORIENTATIONS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type BuildingCondition,
  type ListingType,
  type Localized,
  type Orientation,
  type PropertyStatus,
  type PropertyType,
} from '../schemas/enums';

/** All real-estate listings and property details. */
@Entity({ name: 'properties' })
@Index(['city', 'area'])
@Index(['status'])
@Index(['listingType'])
@Index(['propertyType'])
@Index(['price'])
export class Property extends AbstractEntity {
  @Index({ unique: true })
  @Column({ type: 'text', name: 'property_code' })
  propertyCode!: string;

  @Column({ type: 'enum', enum: PROPERTY_STATUSES, enumName: 'property_status', default: 'DRAFT' })
  status!: PropertyStatus;

  @Column({ type: 'enum', enum: LISTING_TYPES, enumName: 'listing_type', name: 'listing_type' })
  listingType!: ListingType;

  @Column({ type: 'enum', enum: PROPERTY_TYPES, enumName: 'property_type', name: 'property_type' })
  propertyType!: PropertyType;

  @Column({ type: 'jsonb', name: 'title_json' })
  titleJson!: Localized;

  @Column({ type: 'jsonb', name: 'description_json', nullable: true })
  descriptionJson!: Localized | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  price!: number;

  @Column({ type: 'char', length: 3, default: 'EUR' })
  currency!: string;

  @Column({ type: 'text' })
  country!: string;

  @Column({ type: 'text' })
  city!: string;

  @Column({ type: 'text', nullable: true })
  area!: string | null;

  @Column({ type: 'text', name: 'cadastral_zone', nullable: true })
  cadastralZone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true, transformer: numericTransformer })
  latitude!: number | null;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true, transformer: numericTransformer })
  longitude!: number | null;

  @Column({ type: 'smallint', nullable: true })
  bedrooms!: number | null;

  @Column({ type: 'smallint', nullable: true })
  bathrooms!: number | null;

  @Column({ type: 'smallint', nullable: true })
  toilets!: number | null;

  @Column({ type: 'smallint', nullable: true })
  floor!: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'size_m2', nullable: true, transformer: numericTransformer })
  sizeM2!: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'lot_size_m2', nullable: true, transformer: numericTransformer })
  lotSizeM2!: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'terrace_m2', nullable: true, transformer: numericTransformer })
  terraceM2!: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'basement_m2', nullable: true, transformer: numericTransformer })
  basementM2!: number | null;

  @Column({ type: 'smallint', nullable: true })
  garage!: number | null;

  @Column({ type: 'boolean', default: false })
  parking!: boolean;

  @Column({ type: 'boolean', default: false })
  elevator!: boolean;

  @Column({ type: 'smallint', nullable: true })
  balconies!: number | null;

  @Column({ type: 'boolean', default: false })
  storage!: boolean;

  @Column({ type: 'boolean', default: false })
  furnished!: boolean;

  @Column({ type: 'smallint', name: 'heating_type_id', nullable: true })
  heatingTypeId!: number | null;

  @ManyToOne(() => HeatingType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'heating_type_id' })
  heatingType?: HeatingType;

  @Column({ type: 'enum', enum: ORIENTATIONS, enumName: 'orientation', nullable: true })
  orientation!: Orientation | null;

  @Column({
    type: 'enum',
    enum: BUILDING_CONDITIONS,
    enumName: 'building_condition',
    name: 'building_condition',
    nullable: true,
  })
  buildingCondition!: BuildingCondition | null;

  @Column({ type: 'smallint', name: 'year_built', nullable: true })
  yearBuilt!: number | null;

  @Column({ type: 'boolean', name: 'is_featured', default: false })
  isFeatured!: boolean;

  @Column({ type: 'jsonb', name: 'attributes_json', default: () => "'{}'::jsonb" })
  attributesJson!: Record<string, unknown>;

  @Column({ type: 'uuid', name: 'agent_user_id' })
  agentUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'agent_user_id' })
  agentUser?: User;

  @Column({ type: 'uuid', name: 'owner_contact_id', nullable: true })
  ownerContactId!: string | null;

  @ManyToOne(() => Contact, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_contact_id' })
  ownerContact?: Contact;

  @Column({ type: 'date', name: 'published_date', nullable: true })
  publishedDate!: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy!: string | null;
}
