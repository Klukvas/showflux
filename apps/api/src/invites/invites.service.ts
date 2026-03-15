import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { Invite } from '../entities/invite.entity.js';
import { User } from '../entities/user.entity.js';
import { Workspace } from '../entities/workspace.entity.js';
import { InviteStatus } from '../common/enums/invite-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateInviteDto } from './dto/create-invite.dto.js';
import { AcceptInviteDto } from './dto/accept-invite.dto.js';
import { PaginatedResult } from '../common/interfaces/paginated.interface.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityAction } from '../common/enums/activity-action.enum.js';
import { EmailService } from '../common/email/email.service.js';
import { BCRYPT_ROUNDS, hashToken } from '../common/utils/crypto.util.js';

const INVITE_EXPIRY_DAYS = 7;

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepo: Repository<Invite>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly dataSource: DataSource,
    private readonly activityService: ActivityService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(
    workspaceId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<Invite>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const [data, total] = await this.inviteRepo.findAndCount({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }

  async create(
    dto: CreateInviteDto,
    workspaceId: string,
    invitedBy: string,
  ): Promise<{ invite: Invite; rawToken: string }> {
    const [existingUser, workspace] = await Promise.all([
      this.userRepo.findOne({ where: { email: dto.email, workspaceId } }),
      this.workspaceRepo.findOne({ where: { id: workspaceId } }),
    ]);
    if (existingUser) {
      throw new ConflictException('User already exists in this workspace');
    }

    const workspaceName = workspace?.name ?? 'ShowFlux';
    const rawToken = randomBytes(32).toString('hex');
    const token = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    try {
      const invite = this.inviteRepo.create({
        email: dto.email,
        workspaceId,
        invitedBy,
        token,
        expiresAt,
      });
      const saved = await this.inviteRepo.save(invite);
      try {
        await this.activityService.log({
          workspaceId,
          userId: invitedBy,
          action: ActivityAction.INVITE_SENT,
          entityType: 'invite',
          entityId: saved.id,
          metadata: { email: dto.email },
        });
      } catch {
        // Activity logging is best-effort
      }
      this.emailService
        .sendInvite(dto.email, rawToken, workspaceName)
        .catch((err) =>
          this.logger.warn(`Email dispatch failed: ${(err as Error)?.message}`),
        );
      return { invite: saved, rawToken };
    } catch (error: unknown) {
      const dbError = error as { code?: string };
      if (dbError.code === '23505') {
        throw new ConflictException(
          'Pending invite already exists for this email',
        );
      }
      throw error;
    }
  }

  async accept(
    rawToken: string,
    dto: AcceptInviteDto,
  ): Promise<
    Pick<
      User,
      | 'id'
      | 'email'
      | 'fullName'
      | 'role'
      | 'workspaceId'
      | 'isActive'
      | 'createdAt'
      | 'updatedAt'
    >
  > {
    const token = hashToken(rawToken);

    const result = await this.dataSource.transaction(async (manager) => {
      const invite = await manager.findOne(Invite, {
        where: { token, status: InviteStatus.PENDING },
        lock: { mode: 'pessimistic_write' },
      });
      if (!invite) {
        throw new BadRequestException('Invalid or expired invite');
      }

      if (new Date() > invite.expiresAt) {
        await manager.update(Invite, invite.id, {
          status: InviteStatus.EXPIRED,
        });
        throw new BadRequestException('Invalid or expired invite');
      }

      const existingUser = await manager.findOne(User, {
        where: { email: invite.email, workspaceId: invite.workspaceId },
      });
      if (existingUser) {
        throw new ConflictException('Account already exists with this email');
      }

      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

      try {
        const user = manager.create(User, {
          email: invite.email,
          passwordHash,
          fullName: dto.fullName,
          role: Role.AGENT,
          workspaceId: invite.workspaceId,
        });
        const savedUser = await manager.save(user);

        await manager.save(Invite, {
          ...invite,
          status: InviteStatus.ACCEPTED,
        });

        const { passwordHash: _, ...userResult } = savedUser;
        return {
          user: userResult,
          inviteId: invite.id,
          email: invite.email,
          workspaceId: invite.workspaceId,
        };
      } catch (error: unknown) {
        if (
          error instanceof ConflictException ||
          error instanceof BadRequestException
        ) {
          throw error;
        }
        const dbError = error as { code?: string };
        if (dbError.code === '23505') {
          throw new ConflictException('Account already exists');
        }
        throw new InternalServerErrorException('Failed to accept invite');
      }
    });

    // Activity log outside transaction (best-effort)
    try {
      await this.activityService.log({
        workspaceId: result.workspaceId,
        userId: result.user.id,
        action: ActivityAction.INVITE_ACCEPTED,
        entityType: 'invite',
        entityId: result.inviteId,
        metadata: { email: result.email },
      });
    } catch {
      // Activity logging is best-effort
    }

    const {
      id,
      email,
      fullName,
      role,
      workspaceId,
      isActive,
      createdAt,
      updatedAt,
    } = result.user;
    return {
      id,
      email,
      fullName,
      role,
      workspaceId,
      isActive,
      createdAt,
      updatedAt,
    };
  }

  async revoke(id: string, workspaceId: string): Promise<Invite> {
    const invite = await this.inviteRepo.findOne({
      where: { id, workspaceId, status: InviteStatus.PENDING },
    });
    if (!invite) {
      throw new NotFoundException('Pending invite not found');
    }

    await this.inviteRepo.update(invite.id, {
      status: InviteStatus.REVOKED,
    });
    return { ...invite, status: InviteStatus.REVOKED } as Invite;
  }
}
