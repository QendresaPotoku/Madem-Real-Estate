import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Deal } from './deal.entity';
import { numericTransformer } from '../lib/transformers';
import { COMMISSION_STATUSES, type CommissionStatus } from '../schemas/enums';

/** Total commission earned from a deal (one per deal). */
@Entity({ name: 'commissions' })
export class Commission extends AbstractEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid', name: 'deal_id' })
  dealId!: string;

  @ManyToOne(() => Deal, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'deal_id' })
  deal?: Deal;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'total_amount', transformer: numericTransformer })
  totalAmount!: number;

  @Column({ type: 'char', length: 3, default: 'EUR' })
  currency!: string;

  @Column({ type: 'enum', enum: COMMISSION_STATUSES, enumName: 'commission_status', default: 'PENDING' })
  status!: CommissionStatus;
}
