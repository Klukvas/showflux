import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { Workspace } from '../entities/workspace.entity.js';
import { Listing } from '../entities/listing.entity.js';
import { Showing } from '../entities/showing.entity.js';
import { Offer } from '../entities/offer.entity.js';
import { Activity } from '../entities/activity.entity.js';

export interface GdprExport {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
  };
  workspace: {
    id: string;
    name: string;
    plan: string;
    createdAt: Date;
  } | null;
  listings: Array<Record<string, unknown>>;
  showings: Array<Record<string, unknown>>;
  offers: Array<Record<string, unknown>>;
  activities: Array<Record<string, unknown>>;
  exportedAt: string;
}

@Injectable()
export class UsersGdprService {
  private readonly logger = new Logger(UsersGdprService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    @InjectRepository(Showing)
    private readonly showingRepo: Repository<Showing>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    private readonly dataSource: DataSource,
  ) {}

  async exportUserData(userId: string): Promise<GdprExport> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: user.workspaceId },
    });

    const [listings, showings, offers, activities] = await Promise.all([
      this.listingRepo.find({ where: { workspaceId: user.workspaceId } }),
      this.showingRepo.find({ where: { workspaceId: user.workspaceId } }),
      this.offerRepo.find({ where: { workspaceId: user.workspaceId } }),
      this.activityRepo.find({ where: { userId } }),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      workspace: workspace
        ? {
            id: workspace.id,
            name: workspace.name,
            plan: workspace.plan,
            createdAt: workspace.createdAt,
          }
        : null,
      listings: listings.map(({ ...l }) => l as Record<string, unknown>),
      showings: showings.map(({ ...s }) => s as Record<string, unknown>),
      offers: offers.map(({ ...o }) => o as Record<string, unknown>),
      activities: activities.map(({ ...a }) => a as Record<string, unknown>),
      exportedAt: new Date().toISOString(),
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.warn(`GDPR data deletion requested for user ${userId}`);

    await this.dataSource.transaction(async (manager) => {
      // Anonymize user data
      await manager.update(User, userId, {
        email: `deleted_${userId}@anonymized.local`,
        fullName: 'Deleted User',
        passwordHash: 'DELETED',
        isActive: false,
        avatarUrl: null,
      });

      // Increment token version to invalidate all sessions
      await manager.increment(User, { id: userId }, 'tokenVersion', 1);

      // Delete personal activity logs
      await manager.delete(Activity, { userId });
    });

    this.logger.log(`GDPR data deletion completed for user ${userId}`);
  }
}
