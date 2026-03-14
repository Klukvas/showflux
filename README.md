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
| `npm run test` | Run unit tests |
| `npm run test:cov` | Tests with coverage |
| `npm run lint` | Lint with ESLint |
<!-- /AUTO-GENERATED:SCRIPTS -->

<!-- AUTO-GENERATED:ENV -->
## Environment Variables

Copy `.env.example` to `apps/api/.env`. See `.env.example` for defaults.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_HOST` | Yes | PostgreSQL host (`localhost` local, `postgres` Docker) |
| `DATABASE_PORT` | Yes | PostgreSQL port (`5433` local, `5432` Docker) |
| `DATABASE_USER` | Yes | PostgreSQL user |
| `DATABASE_PASSWORD` | Yes | PostgreSQL password |
| `DATABASE_NAME` | Yes | PostgreSQL database |
| `REDIS_HOST` | Yes | Redis host (`localhost` local, `redis` Docker) |
| `REDIS_PORT` | Yes | Redis port (`6380` local, `6379` Docker) |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `JWT_EXPIRATION` | No | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRATION` | No | Refresh token TTL (default: `30d`) |
| `API_PORT` | No | API port (default: `3001`) |
| `NODE_ENV` | No | Environment (default: `development`) |
| `CORS_ORIGIN` | No | CORS origin (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | No | API URL for frontend (default: `http://localhost:3001`) |
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
| PATCH | `/workspace` | BROKER |

### Users (JWT required)

| Method | Path | Role |
|--------|------|------|
| GET | `/users/me` | Any |
| PATCH | `/users/me` | Any |
| POST | `/users/me/change-password` | Any |
| GET | `/users` | BROKER |
| PATCH | `/users/:id/deactivate` | BROKER |
| PATCH | `/users/:id/reactivate` | BROKER |

### Listings (JWT required)

| Method | Path | Role |
|--------|------|------|
| GET | `/listings` | Any |
| GET | `/listings/:id` | Any |
| POST | `/listings` | Any |
| PATCH | `/listings/:id` | Any |
| DELETE | `/listings/:id` | BROKER |

### Showings (JWT required)

| Method | Path | Role |
|--------|------|------|
| GET | `/showings` | Any |
| GET | `/showings/:id` | Any |
| POST | `/showings` | Any |
| PATCH | `/showings/:id` | Any |
| DELETE | `/showings/:id` | BROKER |

### Offers (JWT required)

| Method | Path | Role |
|--------|------|------|
| GET | `/offers` | Any |
| GET | `/offers/:id` | Any |
| POST | `/offers` | Any |
| PATCH | `/offers/:id` | Any |
| DELETE | `/offers/:id` | BROKER |

### Invites (JWT required)

| Method | Path | Role |
|--------|------|------|
| GET | `/invites` | BROKER |
| POST | `/invites` | BROKER |
| POST | `/invites/:token/accept` | No auth (5/min) |
| DELETE | `/invites/:id` | BROKER |

### Dashboard & Activity (JWT required)

| Method | Path |
|--------|------|
| GET | `/dashboard/summary` |
| GET | `/activity` |

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
