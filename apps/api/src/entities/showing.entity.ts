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
import { ShowingStatus } from '../common/enums/showing-status.enum.js';
import { Workspace } from './workspace.entity.js';
import { Listing } from './listing.entity.js';
import { User } from './user.entity.js';

@Entity('showings')
@Index('idx_showings_workspace_scheduled', ['workspaceId', 'scheduledAt'])
export class Showing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_showings_workspace_id')
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId!: string;

  @Index('idx_showings_listing_id')
  @Column({ name: 'listing_id', type: 'uuid' })
  listingId!: string;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId!: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'smallint', default: 30 })
  duration!: number;

  @Column({
    type: 'enum',
    enum: ShowingStatus,
    default: ShowingStatus.SCHEDULED,
  })
  status!: ShowingStatus;

  @Column({ type: 'text', nullable: true })
  feedback!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Listing)
  @JoinColumn({ name: 'listing_id' })
  listing!: Listing;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'agent_id' })
  agent!: User;
}
