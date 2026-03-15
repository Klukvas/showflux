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
import { ActiveSubscriptionGuard } from '../common/guards/active-subscription.guard.js';
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { OffersService } from './offers.service.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { OfferFilterDto } from './dto/offer-filter.dto.js';

@Controller('offers')
@UseGuards(JwtAuthGuard, RequiresWorkspaceGuard, RolesGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  findAll(
    @WorkspaceId() workspaceId: string,
    @Query() filters: OfferFilterDto,
  ) {
    return this.offersService.findAll(workspaceId, filters);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.offersService.findById(id, workspaceId);
  }

  @Post()
  @UseGuards(ActiveSubscriptionGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(
    @Body() dto: CreateOfferDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.offersService.create(dto, workspaceId, userId);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.offersService.update(id, dto, workspaceId, userId, userRole);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.BROKER)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.offersService.remove(id, workspaceId);
  }
}
