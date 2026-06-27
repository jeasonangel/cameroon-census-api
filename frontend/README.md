# Cameroon Census Data API — Frontend Portal

Modern React + TypeScript developer portal for the Cameroon Census Data API.

## Stack
- Vite + React 18 + TypeScript
- Tailwind CSS (Cameroon flag palette: green, red, yellow)
- React Router · Axios · Recharts

## Setup

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173 (proxies /api → :3000)
```

Build for production:
```bash
npm run build         # outputs dist/
npm run preview
```

## Environment

Optional `frontend/.env`:
```
VITE_API_BASE=https://api.your-domain.com/api/v1
```

If omitted, the app calls `/api/v1` on the same origin (use a reverse proxy in production, e.g. nginx → backend on :3000).

## Pages

| Route                | Purpose                                                                 |
|----------------------|-------------------------------------------------------------------------|
| `/`                  | Public landing — features, plans, CTA                                   |
| `/login` `/register` | Auth (issues JWT session)                                               |
| `/dashboard`         | Usage overview, quota bar, 30-day chart                                 |
| `/keys`              | **Create / list / revoke API keys**. Plaintext key shown ONCE.          |
| `/explorer`          | Region charts (bar + pie), CSV export                                   |
| `/playground`        | Live "try it" against real endpoints with the user's key                |
| `/docs`              | REST reference and rate limits                                          |
| `/admin/import`      | Admin only — CSV import                                                 |

## Auth model

- **Dashboard pages** → JWT in `Authorization: Bearer <token>` (from `/auth/login`)
- **Data endpoints** → `X-API-Key: ck_live_...` header
- **Admin** → JWT only. Admins do NOT use API keys; they have full dashboard access.
- **New accounts** start on the **PUBLIC** tier with **50 requests/month**. No key is auto-issued — the user must click **Create API Key**.

## Deploy

Static host (Vercel, Netlify, S3+CloudFront, nginx):
```bash
npm run build
# upload dist/ — make sure SPA fallback rewrites all paths to /index.html
```
