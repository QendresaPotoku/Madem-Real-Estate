import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { ListingAgreement } from './listing-agreement.entity';
import {
  REMINDER_STATUSES,
  REMINDER_TYPES,
  type ReminderStatus,
  type ReminderType,
} from '../schemas/enums';

/** Reminders for listing-agreement expiry; scanned by the in-process cron. */
@Entity({ name: 'agreement_reminders' })
@Index(['remindAt'])
export class AgreementReminder extends AbstractEntity {
  @Column({ type: 'uuid', name: 'agreement_id' })
  agreementId!: string;

  @ManyToOne(() => ListingAgreement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agreement_id' })
  agreement?: ListingAgreement;

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
