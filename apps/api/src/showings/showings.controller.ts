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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { WorkspaceGuard } from '../common/guards/workspace.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { ShowingsService } from './showings.service.js';
import { CreateShowingDto } from './dto/create-showing.dto.js';
import { UpdateShowingDto } from './dto/update-showing.dto.js';

@Controller('showings')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class ShowingsController {
  constructor(private readonly showingsService: ShowingsService) {}

  @Get()
  findAll(
    @WorkspaceId() workspaceId: string,
    @Query('listingId') listingId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (listingId) {
      return this.showingsService.findByListing(listingId, workspaceId);
    }
    return this.showingsService.findAll(
      workspaceId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.showingsService.findById(id, workspaceId);
  }

  @Post()
  create(
    @Body() dto: CreateShowingDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.showingsService.create(dto, workspaceId, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShowingDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.showingsService.update(id, dto, workspaceId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.BROKER)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.showingsService.remove(id, workspaceId);
  }
}
