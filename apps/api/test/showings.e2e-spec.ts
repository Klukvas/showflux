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
  authPatch,
  authDelete,
} from './test-helpers';

describe('Showings (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let listingId: string;

  const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();
  const dayAfterTomorrow = () =>
    new Date(Date.now() + 2 * 86_400_000).toISOString();

  const validListing = {
    address: '100 Showing Ln',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    price: 300000,
  };

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase(app);
    const reg = await registerUser(app);
    token = reg.token;

    const listingRes = await authPost(app, token, '/listings', validListing);
    listingId = listingRes.body.id;
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  it('POST /showings creates a showing', async () => {
    const res = await authPost(app, token, '/showings', {
      listingId,
      scheduledAt: tomorrow(),
      duration: 30,
      notes: 'First showing',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.listingId).toBe(listingId);
    expect(res.body.status).toBe('scheduled');
  });

  it('GET /showings returns showings', async () => {
    const res = await authGet(app, token, '/showings');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /showings/:id returns a specific showing', async () => {
    const createRes = await authPost(app, token, '/showings', {
      listingId,
      scheduledAt: dayAfterTomorrow(),
      duration: 60,
    });
    const showingId = createRes.body.id;

    const res = await authGet(app, token, `/showings/${showingId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(showingId);
    expect(res.body.listingId).toBe(listingId);
  });

  it('PATCH /showings/:id updates a showing', async () => {
    const scheduledTime = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const createRes = await authPost(app, token, '/showings', {
      listingId,
      scheduledAt: scheduledTime,
    });
    const showingId = createRes.body.id;

    const res = await authPatch(app, token, `/showings/${showingId}`, {
      notes: 'Updated notes',
      status: 'completed',
    });

    expect(res.status).toBe(200);
    expect(res.body.notes).toBe('Updated notes');
    expect(res.body.status).toBe('completed');
  });

  it('DELETE /showings/:id removes a showing', async () => {
    const scheduledTime = new Date(Date.now() + 4 * 86_400_000).toISOString();
    const createRes = await authPost(app, token, '/showings', {
      listingId,
      scheduledAt: scheduledTime,
    });
    const showingId = createRes.body.id;

    const deleteRes = await authDelete(app, token, `/showings/${showingId}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await authGet(app, token, `/showings/${showingId}`);
    expect(getRes.status).toBe(404);
  });

  it('POST /showings validates listingId exists', async () => {
    const fakeListingId = '00000000-0000-4000-a000-000000000000';

    const res = await authPost(app, token, '/showings', {
      listingId: fakeListingId,
      scheduledAt: tomorrow(),
    });

    expect(res.status).toBe(404);
  });

  it('POST /showings rejects overlapping time slots', async () => {
    const sharedTime = new Date(Date.now() + 5 * 86_400_000).toISOString();

    await authPost(app, token, '/showings', {
      listingId,
      scheduledAt: sharedTime,
      duration: 60,
    });

    const res = await authPost(app, token, '/showings', {
      listingId,
      scheduledAt: sharedTime,
      duration: 60,
    });

    expect(res.status).toBe(409);
  });

  it('POST /showings requires valid ISO date', async () => {
    const res = await authPost(app, token, '/showings', {
      listingId,
      scheduledAt: 'not-a-date',
    });

    expect(res.status).toBe(400);
  });

  it('GET /showings supports pagination', async () => {
    const res = await authGet(app, token, '/showings?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
  });

  it('GET /showings/:id returns 404 for non-existent', async () => {
    const fakeId = '00000000-0000-4000-a000-000000000000';

    const res = await authGet(app, token, `/showings/${fakeId}`);

    expect(res.status).toBe(404);
  });
});
