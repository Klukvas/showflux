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
import { OfferStatus } from '../common/enums/offer-status.enum.js';
import { Workspace } from './workspace.entity.js';
import { Listing } from './listing.entity.js';
import { User } from './user.entity.js';

const decimalTransformer = {
  to: (v: number) => v,
  from: (v: string) => parseFloat(v),
};

@Entity('offers')
@Index('idx_offers_workspace_status', ['workspaceId', 'status'])
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_offers_workspace_id')
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId!: string;

  @Index('idx_offers_listing_id')
  @Column({ name: 'listing_id', type: 'uuid' })
  listingId!: string;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId!: string;

  @Column({ name: 'buyer_name', length: 255 })
  buyerName!: string;

  @Column({
    name: 'offer_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  offerAmount!: number;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.SUBMITTED,
  })
  status!: OfferStatus;

  @Column({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;

  @Column({
    type: 'timestamptz',
    name: 'expiration_date',
    nullable: true,
  })
  expirationDate!: Date | null;

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
