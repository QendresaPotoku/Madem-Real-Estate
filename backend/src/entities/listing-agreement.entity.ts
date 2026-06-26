import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Property } from './property.entity';
import { Contact } from './contact.entity';
import { User } from './user.entity';
import { numericTransformer } from '../lib/transformers';
import {
  AGREEMENT_STATUSES,
  AGREEMENT_TYPES,
  type AgreementStatus,
  type AgreementType,
} from '../schemas/enums';

/** Owner–agency mandate: open or exclusive listing. */
@Entity({ name: 'listing_agreements' })
export class ListingAgreement extends AbstractEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  code!: string;

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

  @Column({ type: 'uuid', name: 'agent_user_id' })
  agentUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'agent_user_id' })
  agentUser?: User;

  @Column({ type: 'enum', enum: AGREEMENT_TYPES, enumName: 'agreement_type', name: 'agreement_type' })
  agreementType!: AgreementType;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate!: string | null;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    name: 'commission_percentage',
    nullable: true,
    transformer: numericTransformer,
  })
  commissionPercentage!: number | null;

  @Column({ type: 'enum', enum: AGREEMENT_STATUSES, enumName: 'agreement_status', default: 'DRAFT' })
  status!: AgreementStatus;
}
