import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Opportunity } from './opportunity.entity';
import { Property } from './property.entity';
import { numericTransformer } from '../lib/transformers';
import { MATCH_STATUSES, type MatchStatus } from '../schemas/enums';

/** Suggested properties for a specific opportunity. */
@Entity({ name: 'matches' })
@Unique(['opportunityId', 'propertyId'])
export class Match extends AbstractEntity {
  @Column({ type: 'uuid', name: 'opportunity_id' })
  opportunityId!: string;

  @ManyToOne(() => Opportunity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity?: Opportunity;

  @Column({ type: 'uuid', name: 'property_id' })
  propertyId!: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @Column({ type: 'enum', enum: MATCH_STATUSES, enumName: 'match_status', default: 'SUGGESTED' })
  status!: MatchStatus;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'match_score', nullable: true, transformer: numericTransformer })
  matchScore!: number | null;
}
