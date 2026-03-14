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
    expect(typeof res.body.listings).toBe('number');
    expect(typeof res.body.showings).toBe('number');
    expect(typeof res.body.offers).toBe('number');
  });

  it('GET /dashboard/summary requires authentication', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard/summary');

    expect(res.status).toBe(401);
  });
});
