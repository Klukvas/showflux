import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const WorkspaceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request.user as { workspaceId: string }).workspaceId;
  },
);
