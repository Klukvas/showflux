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
  authPost,
  loginUser,
} from './test-helpers';
import * as request from 'supertest';

describe('Subscription (e2e)', () => {
  let app: INestApplication;
  let brokerToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase(app);
    const reg = await registerUser(app);
    brokerToken = reg.token;
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  describe('GET /subscription', () => {
    it('returns subscription status (trialing by default)', async () => {
      const res = await authGet(app, brokerToken, '/subscription');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('plan', 'solo');
      expect(res.body).toHaveProperty('status', 'trialing');
      expect(res.body).toHaveProperty('hasSubscription', false);
      expect(res.body).toHaveProperty('currentPeriodEnd');
      expect(res.body).toHaveProperty('trialEndsAt');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app.getHttpServer()).get('/subscription');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /subscription/checkout', () => {
    it('returns 400 with invalid plan', async () => {
      const res = await authPost(app, brokerToken, '/subscription/checkout', {
        plan: 'invalid_plan',
      });

      expect(res.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app.getHttpServer())
        .post('/subscription/checkout')
        .send({ plan: 'solo' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /subscription/cancel', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app.getHttpServer()).post(
        '/subscription/cancel',
      );

      expect(res.status).toBe(401);
    });
  });

  describe('POST /subscription/update-plan', () => {
    it('returns 400 with invalid plan', async () => {
      const res = await authPost(
        app,
        brokerToken,
        '/subscription/update-plan',
        { plan: 'invalid_plan' },
      );

      expect(res.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app.getHttpServer())
        .post('/subscription/update-plan')
        .send({ plan: 'team' });

      expect(res.status).toBe(401);
    });
  });

  describe('Agent role restrictions', () => {
    let agentToken: string;

    beforeAll(async () => {
      // Create invite, accept it, and login as agent
      const inviteRes = await authPost(app, brokerToken, '/invites', {
        email: 'agent-sub-test@example.com',
      });
      const inviteToken = inviteRes.body.token;

      await request(app.getHttpServer())
        .post(`/invites/${inviteToken}/accept`)
        .send({
          password: 'AgentPass1',
          fullName: 'Test Agent',
        });

      const login = await loginUser(
        app,
        'agent-sub-test@example.com',
        'AgentPass1',
      );
      agentToken = login.accessToken;
    });

    it('agent cannot cancel subscription (403)', async () => {
      const res = await authPost(app, agentToken, '/subscription/cancel');

      expect(res.status).toBe(403);
    });

    it('agent cannot create checkout (403)', async () => {
      const res = await authPost(app, agentToken, '/subscription/checkout', {
        plan: 'team',
      });

      expect(res.status).toBe(403);
    });

    it('agent cannot update plan (403)', async () => {
      const res = await authPost(
        app,
        agentToken,
        '/subscription/update-plan',
        { plan: 'team' },
      );

      expect(res.status).toBe(403);
    });
  });
});
