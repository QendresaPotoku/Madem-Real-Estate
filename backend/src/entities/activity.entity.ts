import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Contact } from './contact.entity';
import { Property } from './property.entity';
import { Opportunity } from './opportunity.entity';
import { Deal } from './deal.entity';
import { User } from './user.entity';
import { ACTIVITY_TYPES, type ActivityType } from '../schemas/enums';

/** History: calls, meetings, messages, notes — linked to any pipeline entity. */
@Entity({ name: 'activities' })
@Index(['contactId'])
@Index(['propertyId'])
@Index(['opportunityId'])
@Index(['dealId'])
export class Activity extends AbstractEntity {
  @Column({ type: 'enum', enum: ACTIVITY_TYPES, enumName: 'activity_type' })
  type!: ActivityType;

  @Column({ type: 'uuid', name: 'contact_id', nullable: true })
  contactId!: string | null;

  @ManyToOne(() => Contact, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @Column({ type: 'uuid', name: 'property_id', nullable: true })
  propertyId!: string | null;

  @ManyToOne(() => Property, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @Column({ type: 'uuid', name: 'opportunity_id', nullable: true })
  opportunityId!: string | null;

  @ManyToOne(() => Opportunity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity?: Opportunity;

  @Column({ type: 'uuid', name: 'deal_id', nullable: true })
  dealId!: string | null;

  @ManyToOne(() => Deal, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deal_id' })
  deal?: Deal;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator?: User;
}
