/**
 * Contract tests verify that API responses match the shapes
 * expected by the frontend type definitions.
 *
 * These tests catch drift between backend controllers and
 * frontend types/api-client without requiring the web app.
 */
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

/* ─── Shape matchers (mirror frontend type definitions) ──────────── */

const UUID_RE = /^[0-9a-f-]{36}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T/;

function expectUuid(value: unknown) {
  expect(typeof value).toBe('string');
  expect(value).toMatch(UUID_RE);
}

function expectIsoDate(value: unknown) {
  expect(typeof value).toBe('string');
  expect(value).toMatch(ISO_DATE_RE);
}

/** frontend: PaginatedResponse<T> */
function expectPaginatedResponse(body: Record<string, unknown>) {
  expect(Array.isArray(body.data)).toBe(true);
  expect(typeof body.total).toBe('number');
  expect(typeof body.page).toBe('number');
  expect(typeof body.limit).toBe('number');
  expect(body).not.toHaveProperty('meta');
}

/** frontend: AuthResponse */
function expectAuthResponse(body: Record<string, unknown>) {
  expect(typeof body.accessToken).toBe('string');
  expect(body.user).toBeDefined();
  const user = body.user as Record<string, unknown>;
  expectUuid(user.id);
  expect(typeof user.email).toBe('string');
  expect(typeof user.fullName).toBe('string');
  expect(['broker', 'agent']).toContain(user.role);
}

/** frontend: User (full entity) */
function expectUserShape(body: Record<string, unknown>) {
  expectUuid(body.id);
  expectUuid(body.workspaceId);
  expect(typeof body.email).toBe('string');
  expect(['broker', 'agent']).toContain(body.role);
  expect(typeof body.fullName).toBe('string');
  expect(typeof body.isActive).toBe('boolean');
  expectIsoDate(body.createdAt);
  expectIsoDate(body.updatedAt);
}

/** frontend: Listing */
function expectListingShape(body: Record<string, unknown>) {
  expectUuid(body.id);
  expectUuid(body.workspaceId);
  expect(typeof body.address).toBe('string');
  expect(typeof body.city).toBe('string');
  expect(typeof body.state).toBe('string');
  expect(typeof body.zip).toBe('string');
  expect(typeof body.price).toBe('number');
  expect(['active', 'pending', 'sold', 'withdrawn']).toContain(body.status);
  expectUuid(body.listingAgentId);
  expectIsoDate(body.createdAt);
  expectIsoDate(body.updatedAt);
}

/** frontend: Showing */
function expectShowingShape(body: Record<string, unknown>) {
  expectUuid(body.id);
  expectUuid(body.workspaceId);
  expectUuid(body.listingId);
  expectUuid(body.agentId);
  expectIsoDate(body.scheduledAt);
  expect(typeof body.duration).toBe('number');
  expect(['scheduled', 'completed', 'cancelled', 'no_show']).toContain(
    body.status,
  );
  expectIsoDate(body.createdAt);
  expectIsoDate(body.updatedAt);
}

/** frontend: Offer */
function expectOfferShape(body: Record<string, unknown>) {
  expectUuid(body.id);
  expectUuid(body.workspaceId);
  expectUuid(body.listingId);
  expectUuid(body.agentId);
  expect(typeof body.buyerName).toBe('string');
  expect(typeof body.offerAmount).toBe('number');
  expect(
    ['submitted', 'accepted', 'rejected', 'countered', 'withdrawn', 'expired'],
  ).toContain(body.status);
  expectIsoDate(body.createdAt);
  expectIsoDate(body.updatedAt);
}

/** frontend: DashboardSummary */
function expectDashboardSummaryShape(body: Record<string, unknown>) {
  const listings = body.listings as Record<string, unknown>;
  expect(typeof listings.total).toBe('number');
  expect(typeof listings.active).toBe('number');
  expect(typeof listings.pending).toBe('number');
  expect(typeof listings.sold).toBe('number');

  const showings = body.showings as Record<string, unknown>;
  expect(typeof showings.total).toBe('number');
  expect(typeof showings.scheduled).toBe('number');
  expect(typeof showings.completed).toBe('number');

  const offers = body.offers as Record<string, unknown>;
  expect(typeof offers.total).toBe('number');
  expect(typeof offers.submitted).toBe('number');
  expect(typeof offers.accepted).toBe('number');

  const team = body.team as Record<string, unknown>;
  expect(typeof team.total).toBe('number');
  expect(typeof team.active).toBe('number');

  // Must NOT have legacy field names
  expect(body).not.toHaveProperty('agents');
  expect(showings).not.toHaveProperty('upcoming');
  expect(showings).not.toHaveProperty('today');
  expect(offers).not.toHaveProperty('pending');
}

/** frontend: Invite (create response) */
function expectInviteCreateResponse(body: Record<string, unknown>) {
  expectUuid(body.id);
  expect(typeof body.email).toBe('string');
  expect(typeof body.token).toBe('string');
  expect(body.status).toBe('pending');
  expectIsoDate(body.expiresAt);
  expectIsoDate(body.createdAt);
  // Must NOT expose the hashed token as "rawToken"
  expect(body).not.toHaveProperty('rawToken');
}

/* ─── Tests ──────────────────────────────────────────────────────── */

describe('API Contract Tests', () => {
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

  /* ── Auth ──────────────────────────────────────────────────────── */

  describe('Auth contracts', () => {
    it('POST /auth/register returns AuthResponse shape', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `contract-${Date.now()}@test.com`,
          password: 'TestPass1',
          fullName: 'Contract User',
          workspaceName: 'Contract WS',
        })
        .expect(201);

      expectAuthResponse(res.body);
    });

    it('POST /auth/login returns AuthResponse shape', async () => {
      const email = `login-contract-${Date.now()}@test.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'TestPass1',
          fullName: 'Login User',
          workspaceName: 'Login WS',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'TestPass1' })
        .expect(200);

      expectAuthResponse(res.body);
    });
  });

  /* ── Listings ─────────────────────────────────────────────────── */

  describe('Listing contracts', () => {
    const validListing = {
      address: '1 Contract St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      price: 300000,
    };

    it('POST /listings returns Listing shape', async () => {
      const res = await authPost(app, token, '/listings', validListing);
      expect(res.status).toBe(201);
      expectListingShape(res.body);
    });

    it('GET /listings returns PaginatedResponse<Listing>', async () => {
      const res = await authGet(app, token, '/listings');
      expect(res.status).toBe(200);
      expectPaginatedResponse(res.body);
      if (res.body.data.length > 0) {
        expectListingShape(res.body.data[0]);
      }
    });

    it('GET /listings/:id returns Listing shape', async () => {
      const createRes = await authPost(app, token, '/listings', {
        ...validListing,
        address: '2 Contract St',
      });
      const res = await authGet(
        app,
        token,
        `/listings/${createRes.body.id}`,
      );
      expect(res.status).toBe(200);
      expectListingShape(res.body);
    });

    it('PATCH /listings/:id returns Listing shape', async () => {
      const createRes = await authPost(app, token, '/listings', {
        ...validListing,
        address: '3 Contract St',
      });
      const res = await authPatch(
        app,
        token,
        `/listings/${createRes.body.id}`,
        { price: 310000 },
      );
      expect(res.status).toBe(200);
      expectListingShape(res.body);
    });

    it('DELETE /listings/:id returns 204 No Content', async () => {
      const createRes = await authPost(app, token, '/listings', {
        ...validListing,
        address: '4 Contract St',
      });
      const res = await authDelete(
        app,
        token,
        `/listings/${createRes.body.id}`,
      );
      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });
  });

  /* ── Showings ─────────────────────────────────────────────────── */

  describe('Showing contracts', () => {
    let listingId: string;

    beforeAll(async () => {
      const res = await authPost(app, token, '/listings', {
        address: '10 Showing Contract Ln',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        price: 400000,
      });
      listingId = res.body.id;
    });

    it('POST /showings returns Showing shape', async () => {
      const res = await authPost(app, token, '/showings', {
        listingId,
        scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
        duration: 30,
      });
      expect(res.status).toBe(201);
      expectShowingShape(res.body);
    });

    it('GET /showings returns PaginatedResponse<Showing>', async () => {
      const res = await authGet(app, token, '/showings');
      expect(res.status).toBe(200);
      expectPaginatedResponse(res.body);
      if (res.body.data.length > 0) {
        expectShowingShape(res.body.data[0]);
      }
    });

    it('DELETE /showings/:id returns 204 No Content', async () => {
      const createRes = await authPost(app, token, '/showings', {
        listingId,
        scheduledAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      });
      const res = await authDelete(
        app,
        token,
        `/showings/${createRes.body.id}`,
      );
      expect(res.status).toBe(204);
    });
  });

  /* ── Offers ───────────────────────────────────────────────────── */

  describe('Offer contracts', () => {
    let listingId: string;

    beforeAll(async () => {
      const res = await authPost(app, token, '/listings', {
        address: '20 Offer Contract Ave',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        price: 500000,
      });
      listingId = res.body.id;
    });

    it('POST /offers returns Offer shape', async () => {
      const res = await authPost(app, token, '/offers', {
        listingId,
        buyerName: 'Contract Buyer',
        offerAmount: 490000,
      });
      expect(res.status).toBe(201);
      expectOfferShape(res.body);
    });

    it('GET /offers returns PaginatedResponse<Offer>', async () => {
      const res = await authGet(app, token, '/offers');
      expect(res.status).toBe(200);
      expectPaginatedResponse(res.body);
      if (res.body.data.length > 0) {
        expectOfferShape(res.body.data[0]);
      }
    });

    it('DELETE /offers/:id returns 204 No Content', async () => {
      const createRes = await authPost(app, token, '/offers', {
        listingId,
        buyerName: 'Delete Contract Buyer',
        offerAmount: 480000,
      });
      const res = await authDelete(
        app,
        token,
        `/offers/${createRes.body.id}`,
      );
      expect(res.status).toBe(204);
    });
  });

  /* ── Invites ──────────────────────────────────────────────────── */

  describe('Invite contracts', () => {
    it('POST /invites returns invite create response shape', async () => {
      const res = await authPost(app, token, '/invites', {
        email: `contract-invite-${Date.now()}@test.com`,
      });
      expect(res.status).toBe(201);
      expectInviteCreateResponse(res.body);
    });

    it('GET /invites returns PaginatedResponse<Invite>', async () => {
      const res = await authGet(app, token, '/invites');
      expect(res.status).toBe(200);
      expectPaginatedResponse(res.body);
    });

    it('POST /invites/:token/accept returns User shape', async () => {
      const inviteRes = await authPost(app, token, '/invites', {
        email: `accept-contract-${Date.now()}@test.com`,
      });
      const inviteToken = inviteRes.body.token;

      const res = await request(app.getHttpServer())
        .post(`/invites/${inviteToken}/accept`)
        .send({
          password: 'AgentPass1',
          fullName: 'Contract Agent',
        })
        .expect(201);

      expectUserShape(res.body);
    });

    it('DELETE /invites/:id returns 204 No Content', async () => {
      const inviteRes = await authPost(app, token, '/invites', {
        email: `revoke-contract-${Date.now()}@test.com`,
      });
      const res = await authDelete(
        app,
        token,
        `/invites/${inviteRes.body.id}`,
      );
      expect(res.status).toBe(204);
    });
  });

  /* ── Dashboard ────────────────────────────────────────────────── */

  describe('Dashboard contracts', () => {
    it('GET /dashboard/summary returns DashboardSummary shape', async () => {
      const res = await authGet(app, token, '/dashboard/summary');
      expect(res.status).toBe(200);
      expectDashboardSummaryShape(res.body);
    });
  });

  /* ── Users ────────────────────────────────────────────────────── */

  describe('User contracts', () => {
    it('GET /users/me returns User shape', async () => {
      const res = await authGet(app, token, '/users/me');
      expect(res.status).toBe(200);
      expectUserShape(res.body);
    });

    it('GET /users returns PaginatedResponse<User>', async () => {
      const res = await authGet(app, token, '/users');
      expect(res.status).toBe(200);
      expectPaginatedResponse(res.body);
      if (res.body.data.length > 0) {
        expectUserShape(res.body.data[0]);
      }
    });
  });

  /* ── Workspace ────────────────────────────────────────────────── */

  describe('Workspace contracts', () => {
    it('GET /workspace returns Workspace shape', async () => {
      const res = await authGet(app, token, '/workspace');
      expect(res.status).toBe(200);
      expectUuid(res.body.id);
      expect(typeof res.body.name).toBe('string');
      expect(['solo', 'team', 'agency']).toContain(res.body.plan);
      expectIsoDate(res.body.createdAt);
      expectIsoDate(res.body.updatedAt);
    });
  });

  /* ── Error shape ──────────────────────────────────────────────── */

  describe('Error response contracts', () => {
    it('401 returns ApiError shape', async () => {
      const res = await request(app.getHttpServer()).get('/listings');
      expect(res.status).toBe(401);
      expect(typeof res.body.statusCode).toBe('number');
      expect(res.body.message).toBeDefined();
    });

    it('400 returns ApiError shape with validation details', async () => {
      const res = await authPost(app, token, '/listings', {});
      expect(res.status).toBe(400);
      expect(typeof res.body.statusCode).toBe('number');
      expect(res.body.message).toBeDefined();
    });
  });
});
