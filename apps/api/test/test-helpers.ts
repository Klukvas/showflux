import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();
  return app;
}

export async function cleanDatabase(app: INestApplication): Promise<void> {
  const ds = app.get(DataSource);
  const entities = ds.entityMetadatas;
  for (const entity of entities) {
    const repository = ds.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
  }
}

export async function registerUser(
  app: INestApplication,
  overrides: Partial<{
    email: string;
    password: string;
    fullName: string;
    workspaceName: string;
  }> = {},
) {
  const body = {
    email: overrides.email ?? `user-${Date.now()}@test.com`,
    password: overrides.password ?? 'TestPass1',
    fullName: overrides.fullName ?? 'Test User',
    workspaceName: overrides.workspaceName ?? 'Test Workspace',
  };
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send(body)
    .expect(201);
  return {
    ...res.body,
    token: res.body.accessToken,
    cookies: res.headers['set-cookie'],
  };
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);
  return { ...res.body, cookies: res.headers['set-cookie'] };
}

export function authGet(app: INestApplication, token: string, url: string) {
  return request(app.getHttpServer())
    .get(url)
    .set('Authorization', `Bearer ${token}`);
}

export function authPost(
  app: INestApplication,
  token: string,
  url: string,
  body?: Record<string, unknown>,
) {
  const req = request(app.getHttpServer())
    .post(url)
    .set('Authorization', `Bearer ${token}`);
  if (body) req.send(body);
  return req;
}

export function authPatch(
  app: INestApplication,
  token: string,
  url: string,
  body?: Record<string, unknown>,
) {
  const req = request(app.getHttpServer())
    .patch(url)
    .set('Authorization', `Bearer ${token}`);
  if (body) req.send(body);
  return req;
}

export function authDelete(app: INestApplication, token: string, url: string) {
  return request(app.getHttpServer())
    .delete(url)
    .set('Authorization', `Bearer ${token}`);
}
