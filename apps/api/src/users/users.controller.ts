import {
  Controller,
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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { WorkspaceGuard } from '../common/guards/workspace.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, dto);
    return { message: 'Password changed successfully' };
  }

  @Get()
  @UseGuards(WorkspaceGuard, RolesGuard)
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
  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(Role.BROKER)
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.deactivateUser(id, workspaceId, currentUserId);
  }

  @Patch(':id/reactivate')
  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(Role.BROKER)
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.usersService.reactivateUser(id, workspaceId);
  }
}
