import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Plan } from '../common/enums/plan.enum.js';
import { User } from './user.entity.js';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: Plan, default: Plan.SOLO })
  plan!: Plan;

  @Column({ type: 'varchar', name: 'stripe_customer_id', nullable: true })
  stripeCustomerId!: string | null;

  @Column({ type: 'varchar', name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => User, (user) => user.workspace)
  users!: User[];
}
