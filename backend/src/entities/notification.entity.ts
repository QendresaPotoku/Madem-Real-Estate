import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from './base.entity';
import { User } from './user.entity';

/**
 * In-app notification for a single recipient. Type is a free-text tag (not a PG
 * enum) so new producers can be added without a migration. `linkPath` is a CRM
 * route to open on click.
 */
@Entity({ name: 'notifications' })
@Index(['userId', 'isRead', 'createdAt'])
export class Notification extends AbstractEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'text' })
  type!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ type: 'text', name: 'link_path', nullable: true })
  linkPath!: string | null;

  @Column({ type: 'boolean', name: 'is_read', default: false })
  isRead!: boolean;
}
