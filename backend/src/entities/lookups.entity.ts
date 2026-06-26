import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DOCUMENT_CATEGORIES, type DocumentCategory, type Localized } from '../schemas/enums';

/** Admin-extensible heating options (lookup). */
@Entity({ name: 'heating_types' })
export class HeatingType {
  @PrimaryGeneratedColumn({ type: 'smallint' })
  id!: number;

  @Column({ type: 'text', unique: true })
  key!: string;

  @Column({ type: 'jsonb', name: 'label_json' })
  labelJson!: Localized;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'smallint', name: 'sort_order', default: 0 })
  sortOrder!: number;
}

/** Predefined document categories + types (lookup), backs property_documents. */
@Entity({ name: 'document_types' })
export class DocumentType {
  @PrimaryGeneratedColumn({ type: 'smallint' })
  id!: number;

  @Column({ type: 'enum', enum: DOCUMENT_CATEGORIES, enumName: 'document_category' })
  category!: DocumentCategory;

  @Column({ type: 'text', unique: true })
  key!: string;

  @Column({ type: 'jsonb', name: 'label_json' })
  labelJson!: Localized;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;
}
