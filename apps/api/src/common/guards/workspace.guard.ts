import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return !!user?.workspaceId;
  }
}
