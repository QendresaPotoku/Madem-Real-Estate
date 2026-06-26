import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { User } from './user.entity';
import { Contact } from './contact.entity';
import { Property } from './property.entity';
import { Opportunity } from './opportunity.entity';
import { Deal } from './deal.entity';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../schemas/enums';

/** Work items assigned to staff/agents. */
@Entity({ name: 'tasks' })
@Index(['assignedTo', 'status', 'dueDate'])
export class Task extends AbstractEntity {
  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'uuid', name: 'assigned_to', nullable: true })
  assignedTo!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to' })
  assignee?: User;

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

  @Column({ type: 'timestamptz', name: 'due_date', nullable: true })
  dueDate!: Date | null;

  @Column({ type: 'enum', enum: TASK_PRIORITIES, enumName: 'task_priority', default: 'MEDIUM' })
  priority!: TaskPriority;

  @Column({ type: 'enum', enum: TASK_STATUSES, enumName: 'task_status', default: 'OPEN' })
  status!: TaskStatus;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy!: string | null;
}
