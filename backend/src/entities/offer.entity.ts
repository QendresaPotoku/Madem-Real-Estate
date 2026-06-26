import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Property } from './property.entity';
import { Opportunity } from './opportunity.entity';
import { Contact } from './contact.entity';
import { numericTransformer } from '../lib/transformers';
import { OFFER_STATUSES, type OfferStatus } from '../schemas/enums';

/** Buyer/tenant price offers and negotiation status. */
@Entity({ name: 'offers' })
export class Offer extends AbstractEntity {
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

  @Column({ type: 'uuid', name: 'buyer_contact_id' })
  buyerContactId!: string;

  @ManyToOne(() => Contact, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_contact_id' })
  buyerContact?: Contact;

  @Column({ type: 'numeric', precision: 14, scale: 2, name: 'offered_amount', transformer: numericTransformer })
  offeredAmount!: number;

  @Column({ type: 'char', length: 3, default: 'EUR' })
  currency!: string;

  @Column({ type: 'enum', enum: OFFER_STATUSES, enumName: 'offer_status', default: 'SUBMITTED' })
  status!: OfferStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy!: string | null;
}
