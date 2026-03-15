import './instrument.js';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { createWinstonLogger } from './common/logger/logger.config.js';

const REQUIRED_ENV_VARS = [
  'DATABASE_HOST',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
  'JWT_SECRET',
] as const;

function validateEnvironment(configService: ConfigService): void {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !configService.get<string>(key),
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const jwtSecret = configService.get<string>('JWT_SECRET');
  if (jwtSecret === 'change-me-in-production') {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    if (isProduction) {
      throw new Error('JWT_SECRET must be changed in production');
    }
  }
}

async function bootstrap() {
  const winstonLogger = createWinstonLogger();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: winstonLogger,
    rawBody: true,
  });
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  validateEnvironment(configService);

  // Trust first proxy (load balancer) for correct client IP in rate limiting
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          baseUri: ["'self'"],
        },
      },
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ limit: '1mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // CORS — validate origin, reject wildcard with credentials
  const corsOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:3000',
  );
  if (corsOrigin === '*') {
    logger.warn(
      'CORS_ORIGIN=* is not allowed with credentials; defaulting to http://localhost:3000',
    );
  }
  app.enableCors({
    origin: corsOrigin === '*' ? 'http://localhost:3000' : corsOrigin,
    credentials: true,
  });

  // Swagger — only in non-production environments
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ShowFlux API')
      .setDescription('Real estate showing & offer management')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('API_PORT', 3001);
  const timeoutMs = configService.get<number>('REQUEST_TIMEOUT_MS', 30_000);

  await app.listen(port);

  const server = app.getHttpServer();
  server.setTimeout(timeoutMs);
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down gracefully…`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.log(`API listening on port ${port}`);
}
bootstrap();
