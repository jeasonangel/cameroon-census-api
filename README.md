# Cameroon Census Data API

RESTful API providing access to Cameroonian census data for NGOs, researchers, and journalists.

## Stack
- Node.js + Express + TypeScript
- PostgreSQL 14+ with PostGIS extension
- Redis 6+
- API-key authentication (bcrypt-hashed, `X-API-Key` header)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env to point to your Postgres + Redis

# 3. Make sure PostGIS is installed in your Postgres database
psql -d cameroon_census -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 4. Run migrations (creates all tables)
npm run migrate

# 5. Seed fictitious data (regions, indicators, data values, admin user)
npm run seed

# 6. Start dev server
npm run dev
```

The seed script prints the bootstrap admin API key — save it. You can also log in
via `POST /api/v1/auth/login` with the credentials from `.env`.

## Deployment

Build: `npm run build`. Start: `npm start`.

Works on Render, Railway, Fly, AWS ECS, or any Node host that can reach a
Postgres-with-PostGIS instance and a Redis instance. Set the env vars from
`.env.example` in the host's dashboard.

## Endpoints

See full route map in the original spec. All routes except `/auth/register` and
`/auth/login` require `X-API-Key: <key>` header.

### Auth
- `POST   /api/v1/auth/register`
- `POST   /api/v1/auth/login`
- `POST   /api/v1/auth/keys`           (auth)
- `GET    /api/v1/auth/keys`           (auth)
- `DELETE /api/v1/auth/keys/:keyId`    (auth)
- `GET    /api/v1/auth/usage`          (auth)

### Geography

- `GET /api/v1/geography/regions`
- `GET /api/v1/geography/regions/:regionCode/departments`
- `GET /api/v1/geography/departments/:departmentCode/districts`
- `GET /api/v1/geography/districts/:districtCode/villages`
- `GET /api/v1/geography/search?q=...`

### Data
- `GET /api/v1/data?geography=...&indicator=...&year=...`
- `GET /api/v1/indicators`
- `GET /api/v1/export?geography=...&indicator=...&year=...&format=csv`

### Admin (ADMIN user_type only)
- `GET    /api/v1/admin/users`
- `POST   /api/v1/admin/users`
- `DELETE /api/v1/admin/users/:userId`
- `POST   /api/v1/admin/import`        (multipart CSV)
- `GET    /api/v1/admin/logs`
- `GET    /api/v1/admin/stats`

## Rate limits (per calendar month)
| User type            | Requests |
|----------------------|----------|
| NGO_DEVELOPER        | 150,000  |
| NGO_DATA_ANALYST     | 60,000   |
| NGO_PROJECT_MANAGER  | 30,000   |
| RESEARCHER           | 15,000   |
| JOURNALIST           | 15,000   |
| ADMIN                | Unlimited|

Counter resets monthly (calendar month). Returns HTTP 429 when exceeded.

## Caching
internal redis URL: redis://red-d8vro9egvqtc738s756g:6379
external db url: postgresql://census_user:4059DP0vfizQRDdNqWLLCenHSlDhF5BN@dpg-d8vsj2ugvqtc738t4uu0-a.oregon-postgres.render.com/cameroon_census

Redis caches:
- Geography responses: 24 h
- Data / indicator responses: 1 h

Cache is invalidated on admin import.
