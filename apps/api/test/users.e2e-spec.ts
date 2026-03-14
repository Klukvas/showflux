import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test'), override: true });
process.env.NODE_ENV = 'development';
process.env.ALLOW_SCHEMA_SYNC = 'true';

import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  cleanDatabase,
  registerUser,
  authGet,
  authPatch,
  authPost,
} from './test-helpers';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase(app);
    const reg = await registerUser(app, {
      email: 'userstest@test.com',
      password: 'TestPass1',
      fullName: 'Users Test',
    });
    token = reg.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should return current user', async () => {
      const res = await authGet(app, '/users/me', token).expect(200);
      expect(res.body.email).toBe('userstest@test.com');
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('should reject unauthenticated request', async () => {
      const request = await import('supertest');
      await request.default(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update profile', async () => {
      const res = await authPatch(app, '/users/me', token, {
        fullName: 'Updated Name',
      }).expect(200);
      expect(res.body.fullName).toBe('Updated Name');
    });

    it('should reject invalid data', async () => {
      await authPatch(app, '/users/me', token, {
        fullName: 'A',
      }).expect(400);
    });
  });

  describe('POST /users/me/change-password', () => {
    it('should change password', async () => {
      const res = await authPost(app, '/users/me/change-password', token, {
        currentPassword: 'TestPass1',
        newPassword: 'NewPass1a',
      }).expect(200);
      expect(res.body.message).toContain('Password changed');
    });

    it('should reject wrong current password', async () => {
      await authPost(app, '/users/me/change-password', token, {
        currentPassword: 'WrongOld1',
        newPassword: 'NewPass2b',
      }).expect(400);
    });
  });

  describe('GET /users', () => {
    it('should list workspace users (broker only)', async () => {
      const res = await authGet(app, '/users', token).expect(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const res = await authGet(app, '/users?page=1&limit=10', token).expect(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
    });
  });

  describe('PATCH /users/:id/deactivate', () => {
    it('should reject self-deactivation', async () => {
      const me = await authGet(app, '/users/me', token).expect(200);
      await authPatch(app, `/users/${me.body.id}/deactivate`, token).expect(403);
    });
  });
});
