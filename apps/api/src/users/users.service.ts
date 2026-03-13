import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { User } from '../entities/user.entity.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { PaginatedResult } from '../common/interfaces/paginated.interface.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = this.userRepo.create({ ...user, ...dto });
    const saved = await this.userRepo.save(updated);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.userRepo.update(userId, { passwordHash });
  }

  async findByWorkspace(
    workspaceId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<Omit<User, 'passwordHash'>>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const [users, total] = await this.userRepo.findAndCount({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
    });
    const data = users.map(({ passwordHash: _, ...rest }) => rest);
    return { data, total, page: safePage, limit: safeLimit };
  }

  async deactivateUser(
    id: string,
    workspaceId: string,
    currentUserId: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    if (id === currentUserId) {
      throw new ForbiddenException('Cannot deactivate yourself');
    }
    const user = await this.userRepo.findOne({
      where: { id, workspaceId },
    });
    if (!user) {
      throw new NotFoundException('User not found in this workspace');
    }

    await this.userRepo.update(id, { isActive: false });
    const { passwordHash: _, ...result } = { ...user, isActive: false };
    return result;
  }

  async reactivateUser(
    id: string,
    workspaceId: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findOne({
      where: { id, workspaceId },
    });
    if (!user) {
      throw new NotFoundException('User not found in this workspace');
    }

    await this.userRepo.update(id, { isActive: true });
    const { passwordHash: _, ...result } = { ...user, isActive: true };
    return result;
  }
}
