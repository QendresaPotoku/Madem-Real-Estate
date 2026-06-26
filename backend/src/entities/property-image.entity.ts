import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Property } from './property.entity';

/** Property photos: cover flag + explicit ordering. */
@Entity({ name: 'property_images' })
@Index(['propertyId', 'sortOrder'])
export class PropertyImage extends AbstractEntity {
  @Column({ type: 'uuid', name: 'property_id' })
  propertyId!: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @Column({ type: 'text', name: 'image_url' })
  imageUrl!: string;

  @Column({ type: 'text', name: 'storage_key', nullable: true })
  storageKey!: string | null;

  @Column({ type: 'boolean', name: 'is_cover', default: false })
  isCover!: boolean;

  @Column({ type: 'integer', name: 'sort_order', default: 0 })
  sortOrder!: number;
}
