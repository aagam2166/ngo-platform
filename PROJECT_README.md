# 📋 Smart NGO Resource Platform — Project Documentation

> **Note:** This is a comprehensive documentation file. The original `README.md` is unchanged.

---

## 📌 Project Overview

A full-stack web platform that connects **citizens in need** with **NGOs** that can help them. Citizens submit resource requests (food, shelter, medical, etc.), NGOs review and fulfil them, and a Super Admin oversees the entire platform.

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + TailwindCSS v4 + shadcn/ui |
| Backend | Node.js + Express 5 + TypeScript |
| Database | MySQL / MariaDB via Prisma v7 |
| ORM | Prisma 7 with `@prisma/adapter-mariadb` (driver-adapter pattern) |
| Auth | JWT (7-day expiry) + bcryptjs |
| Validation | Zod |
| State (FE) | Redux Toolkit + localStorage persistence |
| Testing | Jest + Supertest |

---

## 🏗️ Complete Folder Structure

```
ngo-platform/                          ← Monorepo root
├── .git/
├── .gitignore
├── README.md                          ← Original README (untouched)
├── PROJECT_README.md                  ← This file
├── package.json                       ← Root (minimal, workspace marker)
├── package-lock.json
├── prisma.config.ts                   ← Root-level Prisma config (reads DATABASE_URL)
│
├── prisma/                            ← Shared Prisma schema & migrations
│   ├── migrations/
│   │   ├── migration_lock.toml
│   │   └── 20260512155310_init_day3/
│   │       └── migration.sql          ← Full DB schema (5 tables)
│   └── schema.prisma                  ← Prisma data model
│
├── shared/                            ← Shared types (currently empty, reserved)
│
├── backend/                           ← Express API server
│   ├── .env                           ← Local secrets (gitignored)
│   ├── .env.example                   ← Template for env vars
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.test.json
│   ├── jest.config.js
│   ├── prisma.config.ts               ← Backend-local Prisma config
│   │
│   └── src/
│       ├── server.ts                  ← Entry point (boots Express on PORT)
│       ├── app.ts                     ← Express app setup (middleware + routes)
│       │
│       ├── config/
│       │   └── prisma.ts              ← Singleton Prisma client (MariaDB adapter)
│       │
│       ├── utils/
│       │   ├── jwt.ts                 ← generateToken / verifyToken (7d expiry)
│       │   └── apiResponse.ts         ← sendSuccess() / sendError() helpers
│       │
│       ├── middleware/
│       │   ├── authenticate.ts        ← Validates Bearer JWT, attaches req.user
│       │   ├── authorize.ts           ← Role-based guard (variadic roles)
│       │   ├── requireRole.ts         ← Alias role guard used by NGO/Admin routers
│       │   ├── validate.ts            ← Zod schema body validator
│       │   └── errorHandler.ts        ← Global error handler (AppError + ZodError)
│       │
│       ├── modules/
│       │   ├── auth/
│       │   │   ├── auth.routes.ts     ← POST /register, POST /login, GET /me
│       │   │   ├── auth.controller.ts ← Thin controllers calling service
│       │   │   ├── auth.service.ts    ← Business logic (hash, token, DB)
│       │   │   └── auth.schema.ts     ← Zod schemas: registerSchema, loginSchema
│       │   │
│       │   ├── requests/
│       │   │   ├── request.routes.ts  ← All /requests endpoints
│       │   │   ├── request.controller.ts
│       │   │   ├── request.service.ts ← CRUD + status logic + stats
│       │   │   └── request.schema.ts  ← createRequestSchema (Zod)
│       │   │
│       │   ├── ngo/
│       │   │   ├── ngo.routes.ts      ← NGO_ADMIN-only endpoints
│       │   │   ├── ngo.controller.ts
│       │   │   └── ngo.service.ts     ← Queue, accept, status update logic
│       │   │
│       │   └── admin/
│       │       ├── admin.routes.ts    ← SUPER_ADMIN-only endpoints
│       │       ├── admin.controller.ts
│       │       └── admin.service.ts   ← List, approve, revoke NGOs
│       │
│       └── __tests__/
│           ├── auth.test.ts           ← 12 integration tests for auth
│           └── requests.test.ts       ← 13 integration tests for requests
│
└── frontend/                          ← React + Vite SPA
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
    ├── eslint.config.js
    ├── components.json                ← shadcn/ui config
    ├── package.json
    │
    └── src/
        ├── main.tsx                   ← React root, Redux Provider
        ├── App.tsx                    ← Renders <AppRouter />
        ├── index.css                  ← Global styles + Tailwind imports
        ├── App.css
        │
        ├── store/
        │   ├── index.ts               ← Redux store setup
        │   └── authSlice.ts           ← Auth state (user, token, isAuthenticated)
        │
        ├── routes/
        │   ├── index.tsx              ← BrowserRouter + all Route definitions
        │   ├── PrivateRoute.tsx       ← Redirects unauthenticated users to /login
        │   └── RoleRoute.tsx          ← Redirects unauthorized roles to /dashboard
        │
        ├── components/
        │   ├── StatusBadge.tsx        ← Coloured badge for request statuses
        │   ├── layout/
        │   │   └── Navbar.tsx         ← Top navigation bar
        │   └── ui/                    ← shadcn/ui primitives
        │       ├── button.tsx
        │       ├── card.tsx
        │       ├── input.tsx
        │       └── label.tsx
        │
        ├── pages/
        │   ├── LandingPage.tsx        ← Public home page
        │   ├── Dashboard.tsx          ← Role-aware dashboard redirect hub
        │   ├── auth/
        │   │   ├── LoginPage.tsx      ← Login form
        │   │   └── RegisterPage.tsx   ← Register form (citizen / NGO / volunteer)
        │   ├── citizen/
        │   │   ├── SubmitRequestPage.tsx ← Submit a new help request
        │   │   └── MyRequestsPage.tsx    ← View own requests + status
        │   ├── ngo/
        │   │   └── NGODashboard.tsx   ← Full NGO workflow UI
        │   └── admin/
        │       └── AdminPanel.tsx     ← NGO management for Super Admin
        │
        ├── assets/                    ← Static assets
        └── lib/                       ← Utility helpers
```

---

## 🗄️ Database Schema

Five tables created in the `20260512155310_init_day3` migration:

### `User`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(191) PK | UUID |
| email | VARCHAR(191) UNIQUE | Indexed |
| passwordHash | VARCHAR(191) | bcrypt, 12 rounds |
| role | ENUM | `CITIZEN`, `NGO_ADMIN`, `VOLUNTEER`, `SUPER_ADMIN` |
| firstName | VARCHAR(191) | |
| lastName | VARCHAR(191) | |
| phone | VARCHAR(191) NULL | |
| isActive | BOOLEAN | Default `true` |
| createdAt / updatedAt | DATETIME | Auto-managed |

### `NGO`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(191) PK | |
| userId | VARCHAR(191) UNIQUE FK | → User (CASCADE delete) |
| name | VARCHAR(191) | |
| registrationNo | VARCHAR(191) UNIQUE | |
| description | TEXT NULL | |
| address / city / state | VARCHAR(191) | |
| isVerified | BOOLEAN | Default `false`, toggled by Admin |

### `Volunteer`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(191) PK | |
| userId | VARCHAR(191) UNIQUE FK | → User (CASCADE delete) |
| skills | JSON NULL | Array of skill strings |
| bio | TEXT NULL | |
| isAvailable | BOOLEAN | Default `true` |

### `Request`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(191) PK | |
| citizenId | VARCHAR(191) FK | → User (RESTRICT delete) |
| ngoId | VARCHAR(191) NULL FK | → NGO (SET NULL on delete) |
| title | VARCHAR(191) | min 5 chars |
| description | TEXT | min 20 chars |
| category | VARCHAR(191) | FOOD, MEDICAL, SHELTER, EDUCATION, CLOTHING, FINANCIAL, OTHER |
| status | ENUM | `PENDING → UNDER_REVIEW → APPROVED/REJECTED → IN_PROGRESS → COMPLETED/CANCELLED` |
| urgencyLevel | INTEGER | 1–5, default 1 |
| address / city / state | VARCHAR(191) | |
| reviewedAt | DATETIME NULL | Set when NGO/Admin acts |
| rejectionReason | VARCHAR(191) NULL | Required when status = REJECTED |

### `Resource`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(191) PK | |
| ngoId | VARCHAR(191) FK | → NGO (RESTRICT delete) |
| name / type | VARCHAR(191) | |
| quantity | DOUBLE | |
| unit | VARCHAR(191) NULL | |
| description | TEXT NULL | |

---

## 🔌 API Endpoints — Complete Reference

Base URL: `http://localhost:3000`

### Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Returns `{ status: "ok" }` |

---

### Auth — `/api/v1/auth`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | None | — | Register a new user |
| POST | `/api/v1/auth/login` | None | — | Login, receive JWT |
| GET | `/api/v1/auth/me` | Bearer JWT | Any | Get own profile |

#### `POST /api/v1/auth/register` — Request Body
```json
{
  "email": "user@example.com",
  "password": "min6chars",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "CITIZEN",          // optional: CITIZEN (default) | NGO_ADMIN | VOLUNTEER
  "phone": "+91...",           // optional

  // Only if role = NGO_ADMIN:
  "ngoProfile": {
    "name": "Help India NGO",
    "registrationNo": "NGO-2025-001",
    "description": "...",      // optional
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra"
  },

  // Only if role = VOLUNTEER:
  "volunteerProfile": {
    "bio": "...",              // optional
    "skills": ["Teaching"]    // optional
  }
}
```
**Response:** `201` `{ success: true, data: { user, token } }`

#### `POST /api/v1/auth/login` — Request Body
```json
{ "email": "user@example.com", "password": "yourpassword" }
```
**Response:** `200` `{ success: true, data: { user, token } }`

---

### Requests — `/api/v1/requests`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/v1/requests` | Bearer JWT | Any authenticated | Create a help request |
| GET | `/api/v1/requests/mine` | Bearer JWT | Any authenticated | Get own requests |
| GET | `/api/v1/requests/stats` | Bearer JWT | NGO_ADMIN, SUPER_ADMIN | Get request counts by status |
| GET | `/api/v1/requests` | Bearer JWT | NGO_ADMIN, SUPER_ADMIN | Get all PENDING + UNDER_REVIEW |
| PATCH | `/api/v1/requests/:id/status` | Bearer JWT | NGO_ADMIN, SUPER_ADMIN | Update request status |
| GET | `/api/v1/requests/:id` | Bearer JWT | Any authenticated | Get single request (ownership enforced for citizens) |

#### `POST /api/v1/requests` — Request Body
```json
{
  "title": "Need food urgently",       // min 5 chars
  "description": "My family...",       // min 20 chars
  "category": "FOOD",                  // FOOD | MEDICAL | SHELTER | EDUCATION | CLOTHING | FINANCIAL | OTHER
  "urgencyLevel": 5,                   // 1–5, default 1
  "address": "88 Poverty Lane",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

#### `PATCH /api/v1/requests/:id/status` — Request Body
```json
{
  "status": "APPROVED",               // UNDER_REVIEW | APPROVED | REJECTED | IN_PROGRESS | COMPLETED | CANCELLED
  "rejectionReason": "..."            // Required only when status = REJECTED
}
```

#### Stats Response Shape
```json
{
  "PENDING": 10, "UNDER_REVIEW": 3, "APPROVED": 5,
  "REJECTED": 2, "IN_PROGRESS": 1, "COMPLETED": 8, "CANCELLED": 0,
  "TOTAL": 29
}
```

---

### NGO — `/api/v1/ngo`

> All routes require `Bearer JWT` + role `NGO_ADMIN`

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/ngo/profile` | Get own NGO organisation profile |
| GET | `/api/v1/ngo/queue` | Get PENDING requests with no NGO assigned yet (sorted by urgency desc, date asc) |
| GET | `/api/v1/ngo/my-requests` | Get all requests assigned to this NGO |
| PATCH | `/api/v1/ngo/requests/:id/accept` | Accept a PENDING request → sets status to `UNDER_REVIEW` |
| PATCH | `/api/v1/ngo/requests/:id/status` | Update status of own NGO's request |

#### `PATCH /api/v1/ngo/requests/:id/status` — Request Body
```json
{
  "status": "IN_PROGRESS"  // UNDER_REVIEW | APPROVED | REJECTED | IN_PROGRESS | COMPLETED | CANCELLED
}
```

---

### Admin — `/api/v1/admin`

> All routes require `Bearer JWT` + role `SUPER_ADMIN`

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/ngos` | List all NGOs with user info and request count |
| PATCH | `/api/v1/admin/ngos/:id/approve` | Set NGO `isVerified = true` |
| PATCH | `/api/v1/admin/ngos/:id/revoke` | Set NGO `isVerified = false` |

---

## 🔐 Middleware Stack

| Middleware | File | Purpose |
|---|---|---|
| `helmet` | npm | Sets secure HTTP headers |
| `cors` | npm | Allows `localhost:*` origins only |
| `morgan` | npm | HTTP request logging (`dev` format) |
| `authenticate` | `middleware/authenticate.ts` | Verifies Bearer JWT, populates `req.user` |
| `authorize` | `middleware/authorize.ts` | Variadic role check (used in requests router) |
| `requireRole` | `middleware/requireRole.ts` | Variadic role check (used in ngo/admin routers) |
| `validate` | `middleware/validate.ts` | Parses `req.body` against a Zod schema |
| `errorHandler` | `middleware/errorHandler.ts` | Global handler for `AppError`, `ZodError`, and unexpected errors |

### Standard API Response Shape
```json
// Success
{ "success": true, "data": { ... } }

// Error (AppError)
{ "success": false, "message": "Human-readable error" }

// Validation Error (ZodError)
{ "success": false, "message": "Validation failed", "errors": [...] }
```

---

## 🖥️ Frontend Routes

| Path | Component | Access |
|---|---|---|
| `/` | `LandingPage` | Public |
| `/login` | `LoginPage` | Public only (redirects to /dashboard if logged in) |
| `/register` | `RegisterPage` | Public only |
| `/dashboard` | `Dashboard` | Private (any authenticated user) |
| `/requests/new` | `SubmitRequestPage` | Private |
| `/requests/mine` | `MyRequestsPage` | Private |
| `/ngo/dashboard` | `NGODashboard` | Private — NGO_ADMIN or SUPER_ADMIN |
| `/ngo/requests` | `NGODashboard` | Private — NGO_ADMIN |
| `/admin` | `AdminPanel` | Private — SUPER_ADMIN only |
| `*` | Redirect to `/` | — |

### Redux Auth State Shape
```ts
{
  user: { id, email, firstName, lastName, role } | null,
  token: string | null,
  isAuthenticated: boolean
}
```
Token and user are persisted to `localStorage` on login and cleared on logout.

---

## 🧪 Test Suite

Located in `backend/src/__tests__/`. Run with:
```bash
cd backend
npm test
```

### `auth.test.ts` — 12 tests
| Group | Tests |
|---|---|
| `POST /register` | registers citizen ✓, registers NGO_ADMIN with profile ✓, registers VOLUNTEER ✓, rejects duplicate email ✓, rejects invalid email format ✓, rejects short password ✓, rejects missing firstName ✓ |
| `POST /login` | returns token for valid credentials ✓, rejects wrong password ✓, rejects non-existent email ✓, rejects missing password field ✓ |
| `GET /me` | returns profile with valid token ✓, returns 401 without token ✓, returns 401 for tampered token ✓, returns 401 for missing Bearer prefix ✓ |

### `requests.test.ts` — 13 tests
| Group | Tests |
|---|---|
| `POST /requests` | creates request as citizen ✓, 401 without token ✓, 400 title too short ✓, 400 description too short ✓, 400 invalid category ✓, 400 missing address fields ✓ |
| `GET /requests/mine` | returns own requests ✓, empty array for no requests ✓, 401 without token ✓ |
| `GET /requests/:id` | citizen views own request ✓, NGO views any request ✓, 403 citizen views other's request ✓, 404 non-existent ID ✓, 401 without token ✓ |
| `GET /requests` | returns PENDING + UNDER_REVIEW only ✓, includes citizen details ✓, 401 without token ✓ |

> Tests self-clean: prefix `test_auth_` / `test_req_` records are deleted in `afterAll`.

---

## ⚙️ Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# MySQL / MariaDB connection string
DATABASE_URL="mysql://root:yourpassword@localhost:3306/ngo_platform"

# JWT secret — use a long random string in production (min 32 chars)
JWT_SECRET="change-this-to-a-long-random-secret-min-32-chars"

# Server port (optional, defaults to 3000)
PORT=3000
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL or MariaDB running locally
- Create database: `CREATE DATABASE ngo_platform;`

### Backend Setup
```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL + JWT_SECRET
npm install
npm run db:push             # push Prisma schema to DB
npm run seed                # (optional) seed test data
npm run dev                 # starts on http://localhost:3000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

---

## 📅 Development Progress

### Phase 1 — Project Foundation
- Monorepo structure established (`backend/`, `frontend/`, `prisma/`, `shared/`)
- Backend: Express 5 + TypeScript + Prisma v7 configured with MariaDB driver-adapter pattern
- Root `prisma.config.ts` for running migrations from root
- `.env.example` with all required variables documented

### Phase 2 — Database & Auth
- Prisma schema defined with 5 models: `User`, `NGO`, `Volunteer`, `Request`, `Resource`
- Migration `20260512155310_init_day3` applied — full MySQL schema created
- Auth module built: register (citizen/NGO_ADMIN/VOLUNTEER), login, get-me
- JWT utility with 7-day expiry; bcrypt password hashing (12 rounds)
- Zod validation schemas for all inputs
- Global error handler for `AppError` and `ZodError`

### Phase 3 — Core Request Lifecycle
- Request module: create, list-mine, get-by-id, get-all (NGO), update-status, stats
- NGO module: profile, queue (PENDING unassigned sorted by urgency), accept, update-status
- Admin module: list NGOs, approve/revoke NGO verification
- Role-based middleware (`authenticate`, `authorize`, `requireRole`)
- Full integration test suite (25 tests across auth and requests)

### Phase 4 — Frontend
- React 19 + Vite + TailwindCSS v4 + shadcn/ui setup
- Redux Toolkit auth slice with localStorage persistence
- Route structure: public, private, role-gated
- Pages: LandingPage, LoginPage, RegisterPage, Dashboard
- Citizen pages: SubmitRequestPage, MyRequestsPage
- NGO page: NGODashboard (full workflow — queue, accept, update status)
- Admin page: AdminPanel (list, approve, revoke NGOs)
- Layout: Navbar, StatusBadge component
- shadcn/ui primitives: Button, Card, Input, Label

### Known Issues / Prisma Configuration Notes
- Prisma v7 requires the **driver-adapter pattern** — `PrismaClient` must receive a `PrismaMariaDb` adapter instance. The old `datasource` block in `schema.prisma` is not used for the runtime client.
- `prisma.config.ts` at root is required for CLI commands (`prisma migrate`, `prisma db push`) to read `DATABASE_URL`.
- Both root and `backend/` each have their own `prisma.config.ts`.

---

## 🛣️ Planned Next (Days 8–17)

| Area | Planned Features |
|---|---|
| Volunteer Module | Volunteer profile endpoints, skill-based matching |
| Resources Module | NGO resource CRUD (food stock, medicine, etc.) |
| Notifications | In-app / email notifications on status changes |
| NGO Verification Flow | Stricter gating — only `isVerified` NGOs can accept requests |
| Pagination | Cursor-based pagination on list endpoints |
| Search & Filter | Filter requests by category, city, urgency, status |
| Frontend Polish | Toast notifications, loading states, form error display |
| Deployment | Docker compose for DB + backend, Vercel/Netlify for frontend |
