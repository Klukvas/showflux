import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req['user'] as { id?: string } | undefined;

    if (user?.id) {
      return user.id;
    }

    return (req['ips'] as string[] | undefined)?.length
      ? (req['ips'] as string[])[0]
      : ((req['ip'] as string | undefined) ?? 'unknown');
  }
}
