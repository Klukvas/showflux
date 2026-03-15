import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Plan } from '../common/enums/plan.enum.js';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum.js';
import { User } from './user.entity.js';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: Plan, default: Plan.SOLO })
  plan!: Plan;

  @Column({ type: 'varchar', name: 'paddle_customer_id', nullable: true })
  paddleCustomerId!: string | null;

  @Column({ type: 'varchar', name: 'paddle_subscription_id', nullable: true })
  paddleSubscriptionId!: string | null;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    name: 'subscription_status',
    default: SubscriptionStatus.TRIALING,
  })
  subscriptionStatus!: SubscriptionStatus;

  @Column({
    type: 'timestamptz',
    name: 'current_period_end',
    nullable: true,
  })
  currentPeriodEnd!: Date | null;

  @Column({
    type: 'timestamptz',
    name: 'trial_ends_at',
    nullable: true,
  })
  trialEndsAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => User, (user) => user.workspace)
  users!: User[];
}
