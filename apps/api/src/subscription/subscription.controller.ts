import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RequiresWorkspaceGuard } from '../common/guards/workspace.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { WorkspaceId } from '../common/decorators/workspace.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { SubscriptionService } from './subscription.service.js';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';

@Controller('subscription')
@UseGuards(JwtAuthGuard, RequiresWorkspaceGuard, RolesGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  getStatus(@WorkspaceId() workspaceId: string) {
    return this.subscriptionService.getSubscriptionStatus(workspaceId);
  }

  @Post('checkout')
  @Roles(Role.BROKER)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createCheckout(
    @Body() dto: CreateCheckoutDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.subscriptionService.createCheckoutSession(
      workspaceId,
      dto.plan,
    );
  }

  @Post('cancel')
  @Roles(Role.BROKER)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  cancel(@WorkspaceId() workspaceId: string) {
    return this.subscriptionService.cancelSubscription(workspaceId);
  }

  @Post('update-plan')
  @Roles(Role.BROKER)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  updatePlan(
    @Body() dto: UpdatePlanDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.subscriptionService.updatePlan(workspaceId, dto.plan);
  }
}
