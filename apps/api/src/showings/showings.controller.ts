import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { ShowingsService } from './showings.service.js';
import { CreateShowingDto } from './dto/create-showing.dto.js';
import { UpdateShowingDto } from './dto/update-showing.dto.js';
import { ShowingFilterDto } from './dto/showing-filter.dto.js';

@Controller('showings')
@UseGuards(JwtAuthGuard, RequiresWorkspaceGuard, RolesGuard)
export class ShowingsController {
  constructor(private readonly showingsService: ShowingsService) {}

  @Get()
  findAll(
    @WorkspaceId() workspaceId: string,
    @Query() filters: ShowingFilterDto,
  ) {
    return this.showingsService.findAll(workspaceId, filters);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.showingsService.findById(id, workspaceId);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(
    @Body() dto: CreateShowingDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.showingsService.create(dto, workspaceId, userId);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShowingDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.showingsService.update(id, dto, workspaceId, userId, userRole);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.BROKER)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.showingsService.remove(id, workspaceId);
  }
}
