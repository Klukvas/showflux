import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { WorkspaceGuard } from '../common/guards/workspace.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { WorkspaceService } from './workspace.service.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';

@Controller('workspace')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  getWorkspace(@WorkspaceId() workspaceId: string) {
    return this.workspaceService.findById(workspaceId);
  }

  @Patch()
  @Roles(Role.BROKER)
  updateWorkspace(
    @WorkspaceId() workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.updateName(workspaceId, dto.name);
  }
}
