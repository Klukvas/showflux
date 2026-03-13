import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import { Invite } from '../entities/invite.entity.js';
import { User } from '../entities/user.entity.js';
import { InviteStatus } from '../common/enums/invite-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateInviteDto } from './dto/create-invite.dto.js';
import { AcceptInviteDto } from './dto/accept-invite.dto.js';

const BCRYPT_ROUNDS = 12;
const INVITE_EXPIRY_DAYS = 7;

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepo: Repository<Invite>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    workspaceId: string,
    page = 1,
    limit = 50,
  ): Promise<Invite[]> {
    return this.inviteRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      skip: (page - 1) * limit,
    });
  }

  async create(
    dto: CreateInviteDto,
    workspaceId: string,
    invitedBy: string,
  ): Promise<{ invite: Invite; rawToken: string }> {
    const existingUser = await this.userRepo.findOne({
      where: { email: dto.email, workspaceId },
    });
    if (existingUser) {
      throw new ConflictException('User already exists in this workspace');
    }

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
  ): Promise<Omit<User, 'passwordHash'>> {
    const token = hashToken(rawToken);

    return this.dataSource.transaction(async (manager) => {
      const invite = await manager.findOne(Invite, {
        where: { token, status: InviteStatus.PENDING },
        lock: { mode: 'pessimistic_write' },
      });
      if (!invite) {
        throw new NotFoundException('Invite not found or already used');
      }

      if (new Date() > invite.expiresAt) {
        await manager.save(Invite, {
          ...invite,
          status: InviteStatus.EXPIRED,
        });
        throw new BadRequestException('Invite has expired');
      }

      const existingUser = await manager.findOne(User, {
        where: { email: invite.email },
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

        const { passwordHash: _, ...result } = savedUser;
        return result;
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
  }

  async revoke(id: string, workspaceId: string): Promise<Invite> {
    const invite = await this.inviteRepo.findOne({
      where: { id, workspaceId, status: InviteStatus.PENDING },
    });
    if (!invite) {
      throw new NotFoundException('Pending invite not found');
    }

    const revoked = this.inviteRepo.create({
      ...invite,
      status: InviteStatus.REVOKED,
    });
    return this.inviteRepo.save(revoked);
  }
}
