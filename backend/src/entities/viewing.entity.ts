import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Property } from './property.entity';
import { Opportunity } from './opportunity.entity';
import { Contact } from './contact.entity';
import { User } from './user.entity';
import { VIEWING_STATUSES, type ViewingStatus } from '../schemas/enums';

/** Scheduled property visits and feedback. */
@Entity({ name: 'viewings' })
@Index(['scheduledAt'])
export class Viewing extends AbstractEntity {
  @Column({ type: 'uuid', name: 'property_id' })
  propertyId!: string;

  @ManyToOne(() => Property, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @Column({ type: 'uuid', name: 'opportunity_id', nullable: true })
  opportunityId!: string | null;

  @ManyToOne(() => Opportunity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity?: Opportunity;

  @Column({ type: 'uuid', name: 'contact_id', nullable: true })
  contactId!: string | null;

  @ManyToOne(() => Contact, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @Column({ type: 'uuid', name: 'agent_user_id', nullable: true })
  agentUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_user_id' })
  agentUser?: User;

  @Column({ type: 'timestamptz', name: 'scheduled_at' })
  scheduledAt!: Date;

  @Column({ type: 'enum', enum: VIEWING_STATUSES, enumName: 'viewing_status', default: 'SCHEDULED' })
  status!: ViewingStatus;

  @Column({ type: 'text', nullable: true })
  feedback!: string | null;
}
