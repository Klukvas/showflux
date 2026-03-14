import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test'), override: true });
process.env.NODE_ENV = 'development';
process.env.ALLOW_SCHEMA_SYNC = 'true';

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createTestApp,
  cleanDatabase,
  registerUser,
  loginUser,
  authPost,
} from './test-helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase(app);
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'reg@test.com',
          password: 'TestPass1',
          fullName: 'Reg User',
          workspaceName: 'Reg Workspace',
        })
        .expect(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('reg@test.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'dup@test.com',
          password: 'TestPass1',
          fullName: 'Dup User',
          workspaceName: 'Dup Workspace',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'dup@test.com',
          password: 'TestPass1',
          fullName: 'Dup User 2',
          workspaceName: 'Dup Workspace 2',
        })
        .expect(409);
    });

    it('should reject weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'weak@test.com',
          password: 'weak',
          fullName: 'Weak User',
          workspaceName: 'Weak Workspace',
        })
        .expect(400);
    });

    it('should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: 'TestPass1',
          fullName: 'Bad User',
          workspaceName: 'Bad Workspace',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      await registerUser(app, { email: 'login@test.com', password: 'TestPass1' });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'TestPass1' })
        .expect(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('login@test.com');
    });

    it('should reject wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'WrongPass1' })
        .expect(401);
    });

    it('should reject non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nope@test.com', password: 'TestPass1' })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token', async () => {
      const reg = await registerUser(app, { email: 'refresh@test.com' });
      const cookies = reg.cookies;

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should reject when no refresh token cookie', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and clear cookie', async () => {
      const reg = await registerUser(app, { email: 'logout@test.com' });
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${reg.accessToken}`)
        .set('Cookie', reg.cookies)
        .expect(200);
      expect(res.body.message).toBe('Logged out');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should always return success message', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);
      expect(res.body.message).toContain('reset link');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reject invalid token format', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'invalid', password: 'NewPass1a' })
        .expect(400);
    });

    it('should reject non-existent token', async () => {
      const fakeToken = 'a'.repeat(64);
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: fakeToken, password: 'NewPass1a' })
        .expect(400);
    });
  });
});
