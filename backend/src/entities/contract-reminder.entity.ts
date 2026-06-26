import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Contract } from './contract.entity';
import {
  REMINDER_STATUSES,
  REMINDER_TYPES,
  type ReminderStatus,
  type ReminderType,
} from '../schemas/enums';

/** Reminders for contract expiry or follow-up; scanned by the in-process cron. */
@Entity({ name: 'contract_reminders' })
@Index(['remindAt'])
export class ContractReminder extends AbstractEntity {
  @Column({ type: 'uuid', name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract;

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
