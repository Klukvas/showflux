import { randomUUID } from 'node:crypto';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, _res: Response, next: NextFunction): void {
    const requestId = randomUUID();
    (req as Request & { requestId: string }).requestId = requestId;

    const start = Date.now();
    const { method, originalUrl } = req;

    this.logger.log(`→ ${method} ${originalUrl}`, { requestId });

    _res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `← ${method} ${originalUrl} ${_res.statusCode} ${duration}ms`,
        { requestId },
      );
    });

    next();
  }
}
