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
  authPost,
  authDelete,
} from './test-helpers';
import * as request from 'supertest';

describe('Invites (e2e)', () => {
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

  it('POST /invites creates an invite and returns rawToken', async () => {
    const res = await authPost(app, token, '/invites', {
      email: 'agent1@example.com',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('rawToken');
    expect(res.body.email).toBe('agent1@example.com');
    expect(res.body.status).toBe('pending');
  });

  it('GET /invites lists workspace invites', async () => {
    const res = await authGet(app, token, '/invites');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /invites rejects duplicate email within workspace', async () => {
    await authPost(app, token, '/invites', {
      email: 'duplicate@example.com',
    });

    const res = await authPost(app, token, '/invites', {
      email: 'duplicate@example.com',
    });

    expect(res.status).toBe(409);
  });

  it('POST /invites/:token/accept creates user account', async () => {
    const inviteRes = await authPost(app, token, '/invites', {
      email: 'newagent@example.com',
    });
    const rawToken = inviteRes.body.rawToken;

    const res = await request(app.getHttpServer())
      .post(`/invites/${rawToken}/accept`)
      .send({
        password: 'AgentPass1',
        fullName: 'New Agent',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /invites/:token/accept rejects invalid token', async () => {
    const res = await request(app.getHttpServer())
      .post('/invites/invalid-token-value/accept')
      .send({
        password: 'AgentPass1',
        fullName: 'Bad Token Agent',
      });

    expect(res.status).toBe(404);
  });

  it('POST /invites/:token/accept rejects already-used invite', async () => {
    const inviteRes = await authPost(app, token, '/invites', {
      email: 'usedonce@example.com',
    });
    const rawToken = inviteRes.body.rawToken;

    await request(app.getHttpServer())
      .post(`/invites/${rawToken}/accept`)
      .send({
        password: 'AgentPass1',
        fullName: 'First Accept',
      });

    const res = await request(app.getHttpServer())
      .post(`/invites/${rawToken}/accept`)
      .send({
        password: 'AgentPass1',
        fullName: 'Second Accept',
      });

    expect([400, 404, 409]).toContain(res.status);
  });

  it('DELETE /invites/:id revokes a pending invite', async () => {
    const inviteRes = await authPost(app, token, '/invites', {
      email: 'revokeme@example.com',
    });
    const inviteId = inviteRes.body.id;

    const deleteRes = await authDelete(app, token, `/invites/${inviteId}`);
    expect(deleteRes.status).toBe(200);

    const listRes = await authGet(app, token, '/invites');
    const found = listRes.body.data.find(
      (inv: { id: string }) => inv.id === inviteId,
    );
    if (found) {
      expect(found.status).toBe('revoked');
    }
  });

  it('DELETE /invites/:id returns 404 for non-existent', async () => {
    const fakeId = '00000000-0000-4000-a000-000000000000';

    const res = await authDelete(app, token, `/invites/${fakeId}`);

    expect(res.status).toBe(404);
  });
});
