import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({
  path: path.resolve(__dirname, '..', '.env.test'),
  override: true,
});
process.env.NODE_ENV = 'development';
process.env.ALLOW_SCHEMA_SYNC = 'true';

import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  cleanDatabase,
  registerUser,
  authGet,
} from './test-helpers';
import * as request from 'supertest';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase(app);
    const reg = await registerUser(app);
    token = reg.token;
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  it('GET /dashboard/summary returns summary', async () => {
    const res = await authGet(app, token, '/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('GET /dashboard/summary has correct structure', async () => {
    const res = await authGet(app, token, '/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('listings');
    expect(res.body).toHaveProperty('showings');
    expect(res.body).toHaveProperty('offers');
    expect(res.body).toHaveProperty('team');

    expect(res.body.listings).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        active: expect.any(Number),
      }),
    );
    expect(res.body.showings).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        scheduled: expect.any(Number),
      }),
    );
    expect(res.body.offers).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        submitted: expect.any(Number),
      }),
    );
    expect(res.body.team).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        active: expect.any(Number),
      }),
    );
  });

  it('GET /dashboard/summary requires authentication', async () => {
    const res = await request(app.getHttpServer()).get('/dashboard/summary');

    expect(res.status).toBe(401);
  });
});
