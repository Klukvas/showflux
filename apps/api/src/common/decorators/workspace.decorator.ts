import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export const WorkspaceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as { workspaceId?: string } | undefined;

    if (!user?.workspaceId) {
      throw new UnauthorizedException('Workspace context required');
    }

    return user.workspaceId;
  },
);
