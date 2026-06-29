import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { User } from './user.entity';
import {
  CONTACT_SOURCES,
  CONTACT_TYPES,
  type ContactSource,
  type ContactType,
} from '../schemas/enums';

/** External people: owners, buyers, tenants, landlords, investors. */
@Entity({ name: 'contacts' })
export class Contact extends AbstractEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'text', name: 'full_name' })
  fullName!: string;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column({ type: 'citext', nullable: true })
  email!: string | null;

  @Column({ type: 'text', name: 'id_number', nullable: true })
  idNumber!: string | null;

  @Column({ type: 'enum', enum: CONTACT_TYPES, enumName: 'contact_type' })
  contactType!: ContactType;

  @Column({ type: 'enum', enum: CONTACT_SOURCES, enumName: 'contact_source', default: 'OTHER' })
  source!: ContactSource;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator?: User;
}
