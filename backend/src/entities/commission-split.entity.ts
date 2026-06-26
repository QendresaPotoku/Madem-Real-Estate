import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Commission } from './commission.entity';
import { User } from './user.entity';
import { numericTransformer } from '../lib/transformers';
import { RECEIVER_TYPES, type ReceiverType } from '../schemas/enums';

/** How a commission is divided between company, agent, or partner company. */
@Entity({ name: 'commission_splits' })
@Index(['commissionId'])
export class CommissionSplit extends AbstractEntity {
  @Column({ type: 'uuid', name: 'commission_id' })
  commissionId!: string;

  @ManyToOne(() => Commission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commission_id' })
  commission?: Commission;

  @Column({ type: 'enum', enum: RECEIVER_TYPES, enumName: 'receiver_type', name: 'receiver_type' })
  receiverType!: ReceiverType;

  @Column({ type: 'uuid', name: 'receiver_user_id', nullable: true })
  receiverUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'receiver_user_id' })
  receiverUser?: User;

  @Column({ type: 'text', name: 'receiver_label', nullable: true })
  receiverLabel!: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: numericTransformer })
  percentage!: number | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true, transformer: numericTransformer })
  amount!: number | null;
}
