import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Property } from './property.entity';
import { Opportunity } from './opportunity.entity';
import { Contact } from './contact.entity';
import { User } from './user.entity';
import { numericTransformer } from '../lib/transformers';
import { DEAL_STATUSES, DEAL_TYPES, type DealStatus, type DealType } from '../schemas/enums';

/** Finalized sale or rent transaction — the central settlement record. */
@Entity({ name: 'deals' })
@Index(['status'])
export class Deal extends AbstractEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  code!: string;

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

  @Column({ type: 'uuid', name: 'buyer_contact_id', nullable: true })
  buyerContactId!: string | null;

  @ManyToOne(() => Contact, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_contact_id' })
  buyerContact?: Contact;

  @Column({ type: 'uuid', name: 'seller_contact_id', nullable: true })
  sellerContactId!: string | null;

  @ManyToOne(() => Contact, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seller_contact_id' })
  sellerContact?: Contact;

  @Column({ type: 'uuid', name: 'agent_user_id' })
  agentUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'agent_user_id' })
  agentUser?: User;

  @Column({ type: 'enum', enum: DEAL_TYPES, enumName: 'deal_type', name: 'deal_type' })
  dealType!: DealType;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'final_price', nullable: true, transformer: numericTransformer })
  finalPrice!: number | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'madem_commission_value', nullable: true, transformer: numericTransformer })
  mademCommissionValue!: number | null;

  @Column({ type: 'boolean', name: 'commission_paid', default: false })
  commissionPaid!: boolean;

  @Column({ type: 'char', length: 3, default: 'EUR' })
  currency!: string;

  @Column({ type: 'enum', enum: DEAL_STATUSES, enumName: 'deal_status', default: 'OPEN' })
  status!: DealStatus;

  @Column({ type: 'timestamptz', name: 'closed_at', nullable: true })
  closedAt!: Date | null;
}
