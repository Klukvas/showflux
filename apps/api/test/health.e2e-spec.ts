import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test'), override: true });
process.env.NODE_ENV = 'development';
process.env.ALLOW_SCHEMA_SYNC = 'true';

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './test-helpers';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health should return status ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /health should include database and redis checks', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(res.body.info).toBeDefined();
  });
});
