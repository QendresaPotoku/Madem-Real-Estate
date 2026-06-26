import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Contact } from './contact.entity';
import { User } from './user.entity';
import { numericTransformer } from '../lib/transformers';
import {
  LISTING_TYPES,
  OPPORTUNITY_STATUSES,
  PROPERTY_TYPES,
  type ListingType,
  type OpportunityStatus,
  type PropertyType,
} from '../schemas/enums';

/** What a buyer or tenant is looking for. Type-specific fields live in requirements_json. */
@Entity({ name: 'opportunities' })
@Index(['status'])
export class Opportunity extends AbstractEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'uuid', name: 'contact_id' })
  contactId!: string;

  @ManyToOne(() => Contact, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @Column({ type: 'uuid', name: 'assigned_agent_id', nullable: true })
  assignedAgentId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_agent_id' })
  assignedAgent?: User;

  @Column({ type: 'enum', enum: PROPERTY_TYPES, enumName: 'property_type', name: 'property_type' })
  propertyType!: PropertyType;

  @Column({ type: 'enum', enum: LISTING_TYPES, enumName: 'listing_type', name: 'listing_type' })
  listingType!: ListingType;

  @Column({ type: 'text', nullable: true })
  country!: string | null;

  @Column({ type: 'text', nullable: true })
  city!: string | null;

  @Column({ type: 'text', nullable: true })
  area!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'budget_min', nullable: true, transformer: numericTransformer })
  budgetMin!: number | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'budget_max', nullable: true, transformer: numericTransformer })
  budgetMax!: number | null;

  @Column({ type: 'char', length: 3, default: 'EUR' })
  currency!: string;

  @Column({ type: 'enum', enum: OPPORTUNITY_STATUSES, enumName: 'opportunity_status', default: 'NEW' })
  status!: OpportunityStatus;

  @Column({ type: 'jsonb', name: 'requirements_json', default: () => "'{}'::jsonb" })
  requirementsJson!: Record<string, unknown>;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy!: string | null;
}
