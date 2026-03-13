import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { WorkspaceGuard } from '../common/guards/workspace.guard.js';
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { ActivityService } from './activity.service.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@Controller('activity')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findAll(
    @WorkspaceId() workspaceId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.activityService.findAll(
      workspaceId,
      query.page,
      query.limit,
    );
  }
}
