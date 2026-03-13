import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { WorkspaceGuard } from '../common/guards/workspace.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { InvitesService } from './invites.service.js';
import { CreateInviteDto } from './dto/create-invite.dto.js';
import { AcceptInviteDto } from './dto/accept-invite.dto.js';

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
  @Roles(Role.BROKER)
  findAll(@WorkspaceId() workspaceId: string) {
    return this.invitesService.findAll(workspaceId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
  @Roles(Role.BROKER)
  async create(
    @Body() dto: CreateInviteDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    const { invite, rawToken } = await this.invitesService.create(
      dto,
      workspaceId,
      userId,
    );
    return {
      id: invite.id,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      token: rawToken,
    };
  }

  @Post(':token/accept')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  accept(@Param('token') token: string, @Body() dto: AcceptInviteDto) {
    if (!TOKEN_PATTERN.test(token)) {
      throw new BadRequestException('Invalid token format');
    }
    return this.invitesService.accept(token, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
  @Roles(Role.BROKER)
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.invitesService.revoke(id, workspaceId);
  }
}
