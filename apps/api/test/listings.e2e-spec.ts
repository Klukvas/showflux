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
import * as request from 'supertest';

describe('Listings (e2e)', () => {
  let app: INestApplication;
  let token: string;

  const validListing = {
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    price: 350000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
  };

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

  it('POST /listings creates a listing', async () => {
    const res = await authPost(app, token, '/listings', validListing);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.address).toBe(validListing.address);
    expect(res.body.city).toBe(validListing.city);
    expect(res.body.state).toBe(validListing.state);
    expect(res.body.zip).toBe(validListing.zip);
    expect(res.body.price).toBe(validListing.price);
    expect(res.body.bedrooms).toBe(validListing.bedrooms);
    expect(res.body.bathrooms).toBe(validListing.bathrooms);
    expect(res.body.sqft).toBe(validListing.sqft);
  });

  it('GET /listings returns all listings', async () => {
    const res = await authGet(app, token, '/listings');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /listings/:id returns a specific listing', async () => {
    const createRes = await authPost(app, token, '/listings', {
      ...validListing,
      address: '456 Oak Ave',
    });
    const listingId = createRes.body.id;

    const res = await authGet(app, token, `/listings/${listingId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(listingId);
    expect(res.body.address).toBe('456 Oak Ave');
  });

  it('PATCH /listings/:id updates a listing', async () => {
    const createRes = await authPost(app, token, '/listings', {
      ...validListing,
      address: '789 Pine Rd',
    });
    const listingId = createRes.body.id;

    const res = await authPatch(app, token, `/listings/${listingId}`, {
      price: 400000,
      bedrooms: 4,
    });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(400000);
    expect(res.body.bedrooms).toBe(4);
  });

  it('DELETE /listings/:id removes a listing', async () => {
    const createRes = await authPost(app, token, '/listings', {
      ...validListing,
      address: '101 Elm Blvd',
    });
    const listingId = createRes.body.id;

    const deleteRes = await authDelete(app, token, `/listings/${listingId}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await authGet(app, token, `/listings/${listingId}`);
    expect(getRes.status).toBe(404);
  });

  it('POST /listings validates required fields', async () => {
    const res = await authPost(app, token, '/listings', {});

    expect(res.status).toBe(400);
  });

  it('GET /listings supports status filter', async () => {
    await authPost(app, token, '/listings', {
      ...validListing,
      address: '200 Status St',
      status: 'active',
    });

    const res = await authGet(app, token, '/listings?status=active');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((listing: { status: string }) => {
      expect(listing.status).toBe('active');
    });
  });

  it('GET /listings supports pagination', async () => {
    const res = await authGet(app, token, '/listings?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
  });

  it('GET /listings/:id returns 404 for non-existent', async () => {
    const fakeId = '00000000-0000-4000-a000-000000000000';

    const res = await authGet(app, token, `/listings/${fakeId}`);

    expect(res.status).toBe(404);
  });

  it('DELETE /listings requires authentication', async () => {
    const createRes = await authPost(app, token, '/listings', {
      ...validListing,
      address: '999 No Auth Ln',
    });
    const listingId = createRes.body.id;

    const res = await request(app.getHttpServer()).delete(
      `/listings/${listingId}`,
    );

    expect(res.status).toBe(401);
  });
});
