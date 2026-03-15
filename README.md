# ShowFlux

Real estate showing & offer management platform.

## Stack

- **API**: NestJS 11 + TypeORM 0.3 + PostgreSQL 16 + Redis 7
- **Web**: Next.js 16 + React 19 + Tailwind CSS 4
- **Testing**: Jest 30 + ts-jest 29 + supertest 7

## Quick Start

```bash
# Install dependencies
npm install

# Start infrastructure
docker compose up -d postgres redis

# Configure environment
cp .env.example apps/api/.env

# Start dev servers
npm run dev:api   # API on :3001
npm run dev:web   # Web on :3000
```

## Docker (Full Stack)

```bash
docker compose up -d          # start all services
docker compose up -d --build  # rebuild and start
```

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL | showflux-postgres | 5433 |
| Redis | showflux-redis | 6380 |
| API | showflux-api | 3001 |
| Web | showflux-web | 3000 |

<!-- AUTO-GENERATED:SCRIPTS -->
## Scripts

### Root

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start API in watch mode |
| `npm run dev:web` | Start Next.js dev server |
| `npm run build:api` | Production build for API |
| `npm run build:web` | Production build for web |

### API (`apps/api`)

| Command | Description |
|---------|-------------|
| `npm run build` | Compile with `nest build` |
| `npm run start:dev` | Start with hot reload |
| `npm run start:prod` | Start production build |
| `npm run test` | Run unit tests |
| `npm run test:cov` | Tests with coverage (80%+ required) |
| `npm run test:e2e` | End-to-end tests |
| `npm run lint` | Lint TypeScript files |
| `npm run format` | Format with Prettier |
| `npm run migration:generate` | Generate TypeORM migration |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |

### Web (`apps/web`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run test` | Run unit tests |
| `npm run test:cov` | Tests with coverage |
| `npm run lint` | Lint with ESLint |

### Load Tests (`load-tests/`)

| Command | Description |
|---------|-------------|
| `k6 run load-tests/k6-smoke.js` | Smoke test: 10 VU, 30s, p95 < 500ms |
| `k6 run load-tests/k6-load.js` | Load test: ramp to 50 VU, 2min |
<!-- /AUTO-GENERATED:SCRIPTS -->

<!-- AUTO-GENERATED:ENV -->
## Environment Variables

Copy `.env.example` to `apps/api/.env`. See `.env.example` for defaults.

### Database & Cache

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_HOST` | Yes | PostgreSQL host (`localhost` local, `postgres` Docker) |
| `DATABASE_PORT` | Yes | PostgreSQL port (`5433` local, `5432` Docker) |
| `DATABASE_USER` | Yes | PostgreSQL user |
| `DATABASE_PASSWORD` | Yes | PostgreSQL password |
| `DATABASE_NAME` | Yes | PostgreSQL database |
| `DATABASE_SSL` | No | Enable SSL (default: `false`) |
| `DATABASE_POOL_MAX` | No | Max DB connections (default: `20`) |
| `REDIS_HOST` | Yes | Redis host (`localhost` local, `redis` Docker) |
| `REDIS_PORT` | Yes | Redis port (`6380` local, `6379` Docker) |
| `REDIS_PASSWORD` | No | Redis password (default: none) |

### Auth & Security

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret for signing JWTs — generate with `openssl rand -base64 48` |
| `JWT_EXPIRATION` | No | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRATION` | No | Refresh token TTL (default: `30d`) |
| `CORS_ORIGIN` | No | CORS origin (default: `http://localhost:3000`) |

### Application

| Variable | Required | Description |
|----------|----------|-------------|
| `API_PORT` | No | API port (default: `3001`) |
| `NODE_ENV` | No | Environment (default: `development`) |
| `ALLOW_SCHEMA_SYNC` | No | Enable TypeORM schema sync in development (default: `false`) |
| `REQUEST_TIMEOUT_MS` | No | Request timeout in ms (default: `30000`) |

### Email (Resend)

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Resend email API key |
| `RESEND_FROM_EMAIL` | Yes | Sender email address |
| `FRONTEND_URL` | Yes | Frontend URL for email links |

### Paddle Billing

| Variable | Required | Description |
|----------|----------|-------------|
| `PADDLE_API_KEY` | Yes | Paddle billing API key |
| `PADDLE_WEBHOOK_SECRET` | Yes | Paddle webhook signature secret |
| `PADDLE_ENVIRONMENT` | No | `sandbox` or `production` (default: `sandbox`) |
| `PADDLE_PRICE_SOLO` | Yes | Paddle price ID for Solo plan |
| `PADDLE_PRICE_TEAM` | Yes | Paddle price ID for Team plan |
| `PADDLE_PRICE_AGENCY` | Yes | Paddle price ID for Agency plan |

### Monitoring

| Variable | Required | Description |
|----------|----------|-------------|
| `SENTRY_DSN` | No | Sentry DSN for API error tracking |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for frontend error tracking |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | API URL for frontend (default: `http://localhost:3001`) |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL (default: `https://showflux.com`) |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Yes | Paddle client-side token for checkout |
| `NEXT_PUBLIC_PADDLE_ENVIRONMENT` | No | Paddle environment for frontend (default: `sandbox`) |
<!-- /AUTO-GENERATED:ENV -->

<!-- AUTO-GENERATED:ENDPOINTS -->
## API Endpoints

Swagger UI: `http://localhost:3001/api/docs`

### Auth (no auth required)

| Method | Path | Rate Limit |
|--------|------|------------|
| POST | `/auth/register` | 5/min |
| POST | `/auth/login` | 10/min |
| POST | `/auth/refresh` | 10/min |
| POST | `/auth/logout` | - |
| POST | `/auth/forgot-password` | 3/min |
| POST | `/auth/reset-password` | 5/min |

### Workspace (JWT required)

| Method | Path | Role |
|--------|------|------|
| GET | `/workspace` | Any |
| PATCH | `/workspace` | BROKER (5/min) |

### Users (JWT required)

| Method | Path | Role | Rate Limit |
|--------|------|------|------------|
| GET | `/users/me` | Any | - |
| PATCH | `/users/me` | Any | 10/min |
| POST | `/users/me/change-password` | Any | 5/min |
| GET | `/users/me/data-export` | Any | 3/min |
| DELETE | `/users/me/data` | Any | 1/min |
| GET | `/users` | BROKER | - |
| PATCH | `/users/:id/deactivate` | BROKER | 5/min |
| PATCH | `/users/:id/reactivate` | BROKER | 5/min |

### Listings (JWT + workspace required)

| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | `/listings` | Any | |
| GET | `/listings/:id` | Any | |
| POST | `/listings` | Any | Requires active subscription + plan limits |
| PATCH | `/listings/:id` | Any | 15/min |
| DELETE | `/listings/:id` | BROKER | 5/min |

### Showings (JWT + workspace required)

| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | `/showings` | Any | |
| GET | `/showings/:id` | Any | |
| POST | `/showings` | Any | Requires active subscription + plan limits |
| PATCH | `/showings/:id` | Any | 15/min |
| DELETE | `/showings/:id` | BROKER | 5/min |

### Offers (JWT + workspace required)

| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | `/offers` | Any | |
| GET | `/offers/:id` | Any | |
| POST | `/offers` | Any | Requires active subscription |
| PATCH | `/offers/:id` | Any | 15/min |
| DELETE | `/offers/:id` | BROKER | 5/min |

### Invites (JWT required)

| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | `/invites` | BROKER | |
| POST | `/invites` | BROKER | Requires active subscription + plan limits (5/min) |
| POST | `/invites/:token/accept` | No auth | 5/min |
| DELETE | `/invites/:id` | BROKER | 5/min |

### Dashboard & Activity (JWT + workspace required)

| Method | Path |
|--------|------|
| GET | `/dashboard/summary` |
| GET | `/activity` |

### Subscription (JWT + workspace required)

| Method | Path | Role | Rate Limit |
|--------|------|------|------------|
| GET | `/subscription` | Any | - |
| POST | `/subscription/checkout` | BROKER | 5/min |
| POST | `/subscription/cancel` | BROKER | 3/min |
| POST | `/subscription/update-plan` | BROKER | 5/min |

### Webhooks (no auth)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/webhooks/paddle` | Validated via Paddle signature header |

### Health (no auth)

| Method | Path |
|--------|------|
| GET | `/health` |
<!-- /AUTO-GENERATED:ENDPOINTS -->

## Health Check

```bash
curl http://localhost:3001/health
# {"status":"ok","info":{"database":{"status":"up"},"redis":{"status":"up"}},...}
```

## Pagination

List endpoints accept `page` and `limit` query params. Response: `{ data, total, page, limit }`.

## Roles

- **BROKER**: Full access, can manage team, delete resources
- **AGENT**: Standard access, CRUD on own resources
