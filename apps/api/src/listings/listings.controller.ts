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
import { RequiresWorkspaceGuard } from '../common/guards/workspace.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { ListingsService } from './listings.service.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { UpdateListingDto } from './dto/update-listing.dto.js';
import { ListingFilterDto } from './dto/listing-filter.dto.js';

@Controller('listings')
@UseGuards(JwtAuthGuard, RequiresWorkspaceGuard, RolesGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  findAll(
    @WorkspaceId() workspaceId: string,
    @Query() filters: ListingFilterDto,
  ) {
    return this.listingsService.findAll(workspaceId, filters);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.listingsService.findById(id, workspaceId);
  }

  @Post()
  create(
    @Body() dto: CreateListingDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.listingsService.create(dto, workspaceId, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.listingsService.update(id, dto, workspaceId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.BROKER)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.listingsService.remove(id, workspaceId, userId);
  }
}
