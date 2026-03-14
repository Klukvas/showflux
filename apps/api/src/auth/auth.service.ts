import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import { User } from '../entities/user.entity.js';
import { Workspace } from '../entities/workspace.entity.js';
import { PasswordReset } from '../entities/password-reset.entity.js';
import { Role } from '../common/enums/role.enum.js';
import { Plan } from '../common/enums/plan.enum.js';
import { RegisterDto } from './dto/register.dto.js';
import { RedisCacheService } from '../common/cache/redis-cache.service.js';
import { CACHE_KEY_PREFIX } from '../common/cache/redis-cache.constants.js';

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH =
  '$2b$12$000000000000000000000uGlBcfGFG50mCEdvLqMgaHNJD4qjzSsO';
const RESET_TOKEN_EXPIRY_HOURS = 1;

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  workspaceId: string;
  tokenVersion: number;
  type: 'access' | 'refresh';
  jti: string;
  /** Set by JWT library on verification */
  exp?: number;
  iat?: number;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: Role; fullName: string };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepo: Repository<PasswordReset>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const savedUser = await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(User, {
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email already registered');
      }

      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

      const workspace = manager.create(Workspace, {
        name: dto.workspaceName,
        plan: Plan.SOLO,
      });
      const savedWorkspace = await manager.save(workspace);

      const user = manager.create(User, {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: Role.BROKER,
        workspaceId: savedWorkspace.id,
      });

      try {
        return await manager.save(user);
      } catch (error: unknown) {
        const dbError = error as { code?: string };
        if (dbError.code === '23505') {
          throw new ConflictException('Email already registered');
        }
        throw error;
      }
    });

    return this.buildAuthResult(savedUser);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hash);

    if (!user || !user.isActive || !isMatch) {
      return null;
    }
    return user;
  }

  async login(user: User): Promise<AuthResult> {
    return this.buildAuthResult(user);
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Check if the refresh token has been blacklisted
      if (payload.jti) {
        const blacklisted = await this.redisCacheService.get(
          `${CACHE_KEY_PREFIX.BLACKLIST}:${payload.jti}`,
        );
        if (blacklisted) {
          throw new UnauthorizedException('Token has been revoked');
        }
      }

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      if (payload.tokenVersion !== user.tokenVersion) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    // Blacklist the refresh token JTI in Redis if provided
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        });
        if (payload.jti && payload.exp) {
          const remainingTtl = payload.exp - Math.floor(Date.now() / 1000);
          if (remainingTtl > 0) {
            await this.redisCacheService.set(
              `${CACHE_KEY_PREFIX.BLACKLIST}:${payload.jti}`,
              '1',
              remainingTtl,
            );
          }
        }
      } catch {
        // Token may be expired or invalid — still increment tokenVersion below
      }
    }

    await this.userRepo.increment({ id: userId }, 'tokenVersion', 1);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return; // Always return silently to prevent email enumeration
    }

    const rawToken = randomBytes(32).toString('hex');
    const token = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    const reset = this.passwordResetRepo.create({
      userId: user.id,
      token,
      expiresAt,
    });
    await this.passwordResetRepo.save(reset);

    const isDev = this.configService.get('NODE_ENV') !== 'production';
    if (isDev) {
      this.logger.log(`Password reset token for ${email}: ${rawToken}`);
    }
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const token = hashToken(rawToken);

    await this.dataSource.transaction(async (manager) => {
      const reset = await manager.findOne(PasswordReset, {
        where: { token, usedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reset) {
        throw new BadRequestException('Invalid or already used token');
      }

      if (new Date() > reset.expiresAt) {
        throw new BadRequestException('Reset token has expired');
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await manager.update(User, reset.userId, { passwordHash });
      await manager.increment(User, { id: reset.userId }, 'tokenVersion', 1);

      // Mark ALL pending tokens for this user as used
      await manager
        .createQueryBuilder()
        .update(PasswordReset)
        .set({ usedAt: new Date() })
        .where('user_id = :userId AND used_at IS NULL', {
          userId: reset.userId,
        })
        .execute();

      // Invalidate user cache after password reset
      await this.redisCacheService
        .del(`${CACHE_KEY_PREFIX.USER}:${reset.userId}`)
        .catch(() => {});
    });
  }

  private buildAuthResult(user: User): AuthResult {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  private generateAccessToken(user: User): string {
    return this.jwtService.sign(this.buildPayload(user, 'access'));
  }

  private generateRefreshToken(user: User): string {
    return this.jwtService.sign(this.buildPayload(user, 'refresh'), {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '30d'),
    });
  }

  private buildPayload(
    user: User,
    type: 'access' | 'refresh',
  ): Record<string, string | number> {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
      tokenVersion: user.tokenVersion,
      type,
      jti: randomUUID(),
    };
  }
}
