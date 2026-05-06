# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development
npm run dev              # Vite dev server (frontend, port 5173)
npm run server           # Express backend (port 3006)
npm run server:dev       # Express with nodemon hot reload
npm run lint             # ESLint across all files
npm run build            # tsc -b && vite build
npm run preview          # Preview built frontend (vite preview)

# Testing
npm test                 # Jest server tests (server/tests/*.test.ts)
npm run test:server      # Same as above
npx jest server/tests/customers.test.ts        # Run a single test file
npx jest -t "should create a customer"         # Run by test name pattern
npm run test:e2e         # Playwright E2E tests (starts both servers)
npm run test:e2e:ui      # Playwright UI mode

# Database
npx prisma generate                     # Regenerate Prisma client (required after schema changes or fresh clone)
npx prisma migrate dev --name <name>    # Create migration from schema changes
npx prisma migrate deploy               # Apply migrations (production-safe)
npx prisma db push                      # Push schema without migration file

# Docker
docker-compose up --build -d                        # Production (PostgreSQL + app)
docker-compose -f docker-compose.dev.yml up -d db-dev  # Dev DB only (port 5434)
```

## Architecture

This is **辰航卓越 CRM**, a full-stack CRM application running as a single process (Express serves both API and built frontend).

### Dev/Prod Database Isolation

There are **two completely separate PostgreSQL 16 instances**:
- **Production**: Container `crm-db-prod`, internal Docker network only, no host port exposed
- **Development**: Container `crm-db-dev`, mapped to `127.0.0.1:5434`, database `crm_dev`

The `.env` file points to the dev database (same content as `.env.development`). After first clone, run `npx prisma generate` then `npx prisma migrate deploy` (or `npx prisma db push`) to set up the schema. Never connect the dev backend to the production database.

### Backend (`server/`)

Express 5 with ESM (`"type": "module"` in package.json). All server source files use `.ts` extension but `import` statements use `.js` extensions (standard for TS ESM output).

**Request flow**: `middleware/auth.ts` (JWT) → optional `middleware/validator.ts` → route handler in `server/routes/*.ts`. The `middleware/cache.ts` provides a simple in-memory cache (30s TTL) for GET /customers and GET /leads — call `invalidateCache()` on any write operation (POST/PUT/DELETE).

**Auth**: JWT tokens (7-day expiry) via `jsonwebtoken`. `authMiddleware` extracts the Bearer token and sets `req.user`. `requireRole(...roles)` gates endpoints by role (SALES, MANAGER, EXECUTIVE, ADMIN). On first startup, `seedUsers()` creates 4 users if the user table is empty (admin/sales1/sales2/manager, all password `password`). The login endpoint has a "demo mode" — if user not found but password is ≥4 chars, it creates a new SALES role user on the fly. This means anyone can register by providing username + password ≥4 chars.

**Response helpers**: `middleware/response.ts` provides `sendSuccess(res, data, statusCode?)` and `sendError(res, message, statusCode?, code?)` that wrap responses in `{ success, data/message/error }`. Some routes use these, others use raw `res.json()`/`res.status().json()`. When adding new endpoints, prefer the helpers for consistency.

**Validation**: `middleware/validator.ts` provides `validateBody(schema)` where schema is `Record<string, 'string' | 'number' | 'boolean' | 'email'>` — checks presence and type for each key. Also exports `sanitizeString()` for XSS prevention.

**Database**: Single Prisma client instance in `server/db.ts` (query logging enabled, except suppressed in test env). All models, enums, and relations are in `prisma/schema.prisma`. One migration exists: `prisma/migrations/20260428000000_init_postgresql/`.

**Excel import/export**: Customer list supports Excel import via `xlsx` library (POST `/api/customers/import`, accepts base64 buffer), and CSV export via `streamCsv()` utility (GET `/api/customers/export`).

**Testing**: Jest with `ts-jest` ESM preset. `moduleNameMapper` strips `.js` from imports so tests can resolve `.ts` source files. `server/tests/setup.ts` truncates all tables in CASCADE-safe order (leaf tables first: notifications → payments → stage_histories → achievements → targets → opportunities → activities → leads → contacts → business_info → customers) before each test, then removes test users (id > 4). Uses `supertest` for HTTP assertions.

### Frontend (`src/`)

React 19 + Vite + Tailwind CSS 3 + React Router 7 + lucide-react icons.

**Routing**: Defined in `src/App.tsx`. Pages are code-split with `React.lazy()`. `PrivateRoute` checks auth; `AdminRoute` adds role check. The app renders different layouts based on `useMediaQuery` — `Layout` (desktop sidebar+header) vs `MobileLayout` (mobile tab bar).

**Auth state**: `src/context/AuthContext.tsx` — stores token in `localStorage` key `crm_token`, provides user object and login/logout functions. The API base URL is hardcoded as `http://localhost:3006/api` in `src/api/*.ts` files and `AuthContext.tsx`.

**API layer**: Each `src/api/*.ts` file wraps `fetch` calls with typed request/response interfaces. They read the token from localStorage and attach the `Authorization: Bearer` header.

**State management**: No global state library — each page uses local `useState` and fetches its own data.

### Docker / Production

The `Dockerfile` is multi-stage: builds frontend in one stage, copies `dist/` + `server/` + `prisma/` into a Node 22 Alpine runtime. The Express server serves `dist/` as static files and falls back to `index.html` for non-API routes (SPA routing). `nginx.conf` exists as an optional reverse proxy.

On first deploy, run `docker-compose exec app npx prisma migrate deploy` to apply migrations.

### Key Conventions

- **Pagination**: List endpoints use `page`/`pageSize`/`keyword` query params, return `{ data, pagination: { page, pageSize, total, totalPages } }`
- **ESM imports**: Server files import with `.js` extension (`import { prisma } from '../db.js'`)
- **Error shape**: Two conventions exist in the code — some routes return `{ error: string, message?: string }`, others use the response helpers' `{ success: false, message, error }`. When adding endpoints, use `sendError()` from `middleware/response.ts` for consistency.
- **Role hierarchy**: SALES < MANAGER < EXECUTIVE < ADMIN. `requireRole` checks exact match, not hierarchy — pass all allowed roles explicitly.
- **Ownership**: Routes check ownership via a `canModify()` helper — user can modify if they own the record OR their role is MANAGER/EXECUTIVE/ADMIN.
- **Hardcoded frontend API URL**: `http://localhost:3006/api` in every `src/api/*.ts` file and `AuthContext.tsx` — must be changed for production or a proxy/Vite env var approach should be added.
- **Environment files**: `.env` (default) and `.env.development` (alternative) both point to dev database. The `.env` is loaded by Prisma automatically; for the Express server, the values are read from `process.env`.
