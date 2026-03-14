import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InviteStatus } from '../common/enums/invite-status.enum.js';
import { Workspace } from './workspace.entity.js';
import { User } from './user.entity.js';

@Entity('invites')
@Index('idx_invites_token', ['token'], { unique: true })
@Index('idx_invites_workspace_id', ['workspaceId'])
@Index('idx_invites_workspace_email_pending', ['workspaceId', 'email'], {
  unique: true,
  where: `"status" = 'pending'`,
})
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId!: string;

  @Column({ name: 'invited_by', type: 'uuid' })
  invitedBy!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ unique: true })
  token!: string;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  status!: InviteStatus;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by' })
  inviter!: User;
}
