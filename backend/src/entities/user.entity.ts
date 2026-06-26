import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from './base.entity';
import {
  USER_ROLES,
  USER_STATUSES,
  type Localized,
  type UserRole,
  type UserStatus,
} from '../schemas/enums';

/** Staff + agents. Agents are users with role='AGENT'; profile fields null for admins. */
@Entity({ name: 'users' })
export class User extends AbstractEntity {
  @Column({ type: 'text', name: 'full_name' })
  fullName!: string;

  @Index({ unique: true })
  @Column({ type: 'citext' })
  email!: string;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column({ type: 'text', name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: USER_ROLES, enumName: 'user_role', default: 'AGENT' })
  role!: UserRole;

  @Column({ type: 'enum', enum: USER_STATUSES, enumName: 'user_status', default: 'ACTIVE' })
  status!: UserStatus;

  @Column({ type: 'text', name: 'photo_url', nullable: true })
  photoUrl!: string | null;

  @Column({ type: 'jsonb', name: 'title_json', nullable: true })
  titleJson!: Localized | null;

  @Column({ type: 'jsonb', name: 'bio_json', nullable: true })
  bioJson!: Localized | null;
}
