import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { User } from '../entities/user.entity.js';
import { Workspace } from '../entities/workspace.entity.js';
import { Role } from '../common/enums/role.enum.js';
import { Plan } from '../common/enums/plan.enum.js';
import { RegisterDto } from './dto/register.dto.js';

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = '$2b$12$000000000000000000000uGlBcfGFG50mCEdvLqMgaHNJD4qjzSsO';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  workspaceId: string;
  type: 'access' | 'refresh';
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: Role; fullName: string };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
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

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
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
  ): Record<string, string> {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
      type,
    };
  }
}
