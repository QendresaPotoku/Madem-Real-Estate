import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Deal } from './deal.entity';
import { Property } from './property.entity';
import { Contact } from './contact.entity';
import { User } from './user.entity';
import {
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  type ContractStatus,
  type ContractType,
} from '../schemas/enums';

/** Sale/rental contract created after a deal. */
@Entity({ name: 'contracts' })
@Index(['status'])
@Index(['endDate'])
export class Contract extends AbstractEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'uuid', name: 'deal_id', nullable: true })
  dealId!: string | null;

  @ManyToOne(() => Deal, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'deal_id' })
  deal?: Deal;

  @Column({ type: 'uuid', name: 'property_id' })
  propertyId!: string;

  @ManyToOne(() => Property, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @Column({ type: 'uuid', name: 'owner_contact_id' })
  ownerContactId!: string;

  @ManyToOne(() => Contact, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_contact_id' })
  ownerContact?: Contact;

  @Column({ type: 'uuid', name: 'counterparty_contact_id', nullable: true })
  counterpartyContactId!: string | null;

  @ManyToOne(() => Contact, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'counterparty_contact_id' })
  counterpartyContact?: Contact;

  @Column({ type: 'uuid', name: 'agent_user_id', nullable: true })
  agentUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'agent_user_id' })
  agentUser?: User;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate!: string | null;

  @Column({ type: 'enum', enum: CONTRACT_TYPES, enumName: 'contract_type', name: 'contract_type' })
  contractType!: ContractType;

  @Column({ type: 'enum', enum: CONTRACT_STATUSES, enumName: 'contract_status', default: 'DRAFT' })
  status!: ContractStatus;
}
