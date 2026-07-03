import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Deal } from './deal.entity';
import {
  REMINDER_STATUSES,
  REMINDER_TYPES,
  type ReminderStatus,
  type ReminderType,
} from '../schemas/enums';

/** Reminders for a rent deal's contract expiry; scanned by the in-process cron. */
@Entity({ name: 'deal_reminders' })
@Index(['remindAt'])
export class DealReminder extends AbstractEntity {
  @Column({ type: 'uuid', name: 'deal_id' })
  dealId!: string;

  @ManyToOne(() => Deal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deal_id' })
  deal?: Deal;

  @Column({ type: 'enum', enum: REMINDER_TYPES, enumName: 'reminder_type', default: 'EXPIRY' })
  type!: ReminderType;

  @Column({ type: 'timestamptz', name: 'remind_at' })
  remindAt!: Date;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ type: 'enum', enum: REMINDER_STATUSES, enumName: 'reminder_status', default: 'PENDING' })
  status!: ReminderStatus;

  @Column({ type: 'timestamptz', name: 'sent_at', nullable: true })
  sentAt!: Date | null;
}
