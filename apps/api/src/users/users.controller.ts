import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RequiresWorkspaceGuard } from '../common/guards/workspace.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { UsersService } from './users.service.js';
import { UsersGdprService } from './users-gdpr.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersGdprService: UsersGdprService,
  ) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, dto);
    return { message: 'Password changed successfully' };
  }

  @Get('me/data-export')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  exportData(@CurrentUser('id') userId: string) {
    return this.usersGdprService.exportUserData(userId);
  }

  @Delete('me/data')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  async deleteData(@CurrentUser('id') userId: string) {
    await this.usersGdprService.deleteUserData(userId);
    return { message: 'Your data has been anonymized and deleted' };
  }

  @Get()
  @UseGuards(RequiresWorkspaceGuard, RolesGuard)
  @Roles(Role.BROKER)
  findAll(
    @WorkspaceId() workspaceId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.usersService.findByWorkspace(
      workspaceId,
      query.page,
      query.limit,
    );
  }

  @Patch(':id/deactivate')
  @UseGuards(RequiresWorkspaceGuard, RolesGuard)
  @Roles(Role.BROKER)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.deactivateUser(id, workspaceId, currentUserId);
  }

  @Patch(':id/reactivate')
  @UseGuards(RequiresWorkspaceGuard, RolesGuard)
  @Roles(Role.BROKER)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.usersService.reactivateUser(id, workspaceId);
  }
}
