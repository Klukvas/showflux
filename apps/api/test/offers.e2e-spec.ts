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

describe('Offers (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let listingId: string;

  const validListing = {
    address: '500 Offer Blvd',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    price: 450000,
  };

  const validOffer = (overrides: Record<string, unknown> = {}) => ({
    listingId,
    buyerName: 'John Doe',
    offerAmount: 440000,
    expirationDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    notes: 'Serious buyer',
    ...overrides,
  });

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

  it('POST /offers creates an offer', async () => {
    const res = await authPost(app, token, '/offers', validOffer());

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.listingId).toBe(listingId);
    expect(res.body.buyerName).toBe('John Doe');
    expect(res.body.offerAmount).toBe(440000);
    expect(res.body.status).toBe('submitted');
  });

  it('GET /offers returns offers', async () => {
    const res = await authGet(app, token, '/offers');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /offers/:id returns a specific offer', async () => {
    const createRes = await authPost(
      app,
      token,
      '/offers',
      validOffer({
        buyerName: 'Jane Smith',
        offerAmount: 445000,
      }),
    );
    const offerId = createRes.body.id;

    const res = await authGet(app, token, `/offers/${offerId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(offerId);
    expect(res.body.buyerName).toBe('Jane Smith');
  });

  it('PATCH /offers/:id updates an offer', async () => {
    const createRes = await authPost(
      app,
      token,
      '/offers',
      validOffer({
        buyerName: 'Update Buyer',
      }),
    );
    const offerId = createRes.body.id;

    const res = await authPatch(app, token, `/offers/${offerId}`, {
      offerAmount: 455000,
      notes: 'Increased offer',
    });

    expect(res.status).toBe(200);
    expect(res.body.offerAmount).toBe(455000);
    expect(res.body.notes).toBe('Increased offer');
  });

  it('DELETE /offers/:id removes an offer', async () => {
    const createRes = await authPost(
      app,
      token,
      '/offers',
      validOffer({
        buyerName: 'Delete Buyer',
      }),
    );
    const offerId = createRes.body.id;

    const deleteRes = await authDelete(app, token, `/offers/${offerId}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await authGet(app, token, `/offers/${offerId}`);
    expect(getRes.status).toBe(404);
  });

  it('POST /offers validates listingId exists', async () => {
    const fakeListingId = '00000000-0000-4000-a000-000000000000';

    const res = await authPost(
      app,
      token,
      '/offers',
      validOffer({
        listingId: fakeListingId,
      }),
    );

    expect(res.status).toBe(404);
  });

  it('PATCH /offers/:id accepts an offer', async () => {
    const createRes = await authPost(
      app,
      token,
      '/offers',
      validOffer({
        buyerName: 'Accept Buyer',
      }),
    );
    const offerId = createRes.body.id;

    const res = await authPatch(app, token, `/offers/${offerId}`, {
      status: 'accepted',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
  });

  it('PATCH /offers/:id rejects accepting if another already accepted', async () => {
    const listing2Res = await authPost(app, token, '/listings', {
      ...validListing,
      address: '600 Conflict Ave',
    });
    const listing2Id = listing2Res.body.id;

    const offer1Res = await authPost(
      app,
      token,
      '/offers',
      validOffer({
        listingId: listing2Id,
        buyerName: 'First Accepted',
      }),
    );
    await authPatch(app, token, `/offers/${offer1Res.body.id}`, {
      status: 'accepted',
    });

    const offer2Res = await authPost(
      app,
      token,
      '/offers',
      validOffer({
        listingId: listing2Id,
        buyerName: 'Second Attempt',
      }),
    );
    const res = await authPatch(app, token, `/offers/${offer2Res.body.id}`, {
      status: 'accepted',
    });

    expect(res.status).toBe(409);
  });

  it('POST /offers requires buyerName', async () => {
    const res = await authPost(app, token, '/offers', {
      listingId,
      offerAmount: 400000,
    });

    expect(res.status).toBe(400);
  });

  it('GET /offers supports pagination', async () => {
    const res = await authGet(app, token, '/offers?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
  });
});
