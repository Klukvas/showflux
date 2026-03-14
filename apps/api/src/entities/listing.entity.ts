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
import { ListingStatus } from '../common/enums/listing-status.enum.js';
import { Workspace } from './workspace.entity.js';
import { User } from './user.entity.js';

const decimalTransformer = {
  to: (v: number) => v,
  from: (v: string) => parseFloat(v),
};

@Entity('listings')
@Index('idx_listings_workspace_status', ['workspaceId', 'status'])
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_listings_workspace_id')
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId!: string;

  @Column({ length: 255 })
  address!: string;

  @Column({ length: 100 })
  city!: string;

  @Column({ length: 2 })
  state!: string;

  @Column({ length: 10 })
  zip!: string;

  @Column({ type: 'varchar', name: 'mls_number', length: 50, nullable: true })
  mlsNumber!: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  price!: number;

  @Column({ type: 'smallint', nullable: true })
  bedrooms!: number | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
    transformer: decimalTransformer,
  })
  bathrooms!: number | null;

  @Column({ type: 'int', nullable: true })
  sqft!: number | null;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.ACTIVE,
  })
  status!: ListingStatus;

  @Column({ name: 'listing_agent_id', type: 'uuid' })
  listingAgentId!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'listing_agent_id' })
  listingAgent!: User;
}
