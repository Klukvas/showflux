import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { WorkspaceGuard } from '../common/guards/workspace.guard.js';
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@WorkspaceId() workspaceId: string) {
    return this.dashboardService.getSummary(workspaceId);
  }
}
