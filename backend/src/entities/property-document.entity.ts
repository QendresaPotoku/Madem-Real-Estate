import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { Property } from './property.entity';
import { DocumentType } from './lookups.entity';
import { User } from './user.entity';
import { DOCUMENT_STATUSES, type DocumentStatus } from '../schemas/enums';

/** Property-related legal/internal documents with a verification status. */
@Entity({ name: 'property_documents' })
export class PropertyDocument extends AbstractEntity {
  @Column({ type: 'uuid', name: 'property_id' })
  propertyId!: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @Column({ type: 'smallint', name: 'document_type_id' })
  documentTypeId!: number;

  @ManyToOne(() => DocumentType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'document_type_id' })
  documentType?: DocumentType;

  @Column({ type: 'text', name: 'file_url' })
  fileUrl!: string;

  @Column({ type: 'text', name: 'storage_key', nullable: true })
  storageKey!: string | null;

  @Column({ type: 'enum', enum: DOCUMENT_STATUSES, enumName: 'document_status', default: 'PENDING' })
  status!: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'uploaded_by', nullable: true })
  uploadedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by' })
  uploader?: User;
}
