import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Property } from './property.entity';

/** Property videos: explicit ordering. The first (lowest sort_order) is used for the
 *  hover preview on the public website. */
@Entity({ name: 'property_videos' })
@Index(['propertyId', 'sortOrder'])
export class PropertyVideo extends AbstractEntity {
  @Column({ type: 'uuid', name: 'property_id' })
  propertyId!: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @Column({ type: 'text', name: 'video_url' })
  videoUrl!: string;

  @Column({ type: 'text', name: 'storage_key', nullable: true })
  storageKey!: string | null;

  @Column({ type: 'integer', name: 'sort_order', default: 0 })
  sortOrder!: number;
}
