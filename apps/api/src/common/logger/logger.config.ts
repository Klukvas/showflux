import { createLogger, format, transports } from 'winston';
import { WinstonModule } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';

export function createWinstonLogger(): LoggerService {
  const isProduction = process.env.NODE_ENV === 'production';

  const winstonInstance = createLogger({
    level: isProduction ? 'info' : 'debug',
    transports: [
      new transports.Console({
        format: isProduction
          ? format.combine(format.timestamp(), format.json())
          : format.combine(
              format.colorize(),
              format.timestamp({ format: 'HH:mm:ss' }),
              format.printf(
                ({ timestamp, level, message, context, ...meta }) => {
                  const ctx = context ? `[${context}]` : '';
                  const metaStr = Object.keys(meta).length
                    ? ` ${JSON.stringify(meta)}`
                    : '';
                  return `${timestamp} ${level} ${ctx} ${message}${metaStr}`;
                },
              ),
            ),
      }),
    ],
  });

  return WinstonModule.createLogger({ instance: winstonInstance });
}
