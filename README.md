# NGO Platform

A full-stack web platform that connects citizens in need with NGOs and volunteers. Citizens can submit help requests, NGOs can review and manage them, and volunteers can offer assistance.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, Redux Toolkit |
| Backend | Node.js, Express 5, TypeScript |
| Database | MariaDB via Prisma ORM |
| Auth | JWT (7-day expiry), bcrypt password hashing |
| Validation | Zod |

## Project Structure

```
ngo-platform/
├── backend/          # Express REST API
│   ├── prisma/       # Schema, migrations, seed
│   └── src/
│       ├── config/       # Prisma client
│       ├── middleware/   # Auth, error handler
│       ├── modules/
│       │   ├── auth/     # Register, login, /me
│       │   └── requests/ # CRUD for help requests
│       ├── utils/        # JWT, API response helpers
│       └── __tests__/    # Integration tests
└── frontend/         # React SPA
    └── src/
        ├── components/   # Reusable UI components
        ├── pages/        # Route-level pages
        ├── routes/       # React Router config
        └── store/        # Redux auth slice
```

## Getting Started

### Prerequisites

- Node.js 18+
- MariaDB / MySQL server
- npm

### 1. Clone the repository

```bash
git clone https://github.com/aagam2166/ngo-platform.git
cd ngo-platform
```

### 2. Configure environment variables

Create `backend/.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/ngo_platform"
JWT_SECRET="your-secret-key-min-32-chars"
PORT=3000
```

### 3. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run database migrations

```bash
cd backend
npx prisma migrate deploy
```

### 5. Seed the database (optional)

Populates the database with demo users and requests.

```bash
npm run seed
```

**Demo credentials after seeding:**

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@ngoplatform.com | admin123 |
| Citizen | rahul.sharma@example.com | citizen123 |
| Citizen | priya.singh@example.com | citizen123 |
| NGO Admin | meera@helpfoundation.org | ngo123 |
| NGO Admin | director@carekids.in | ngo123 |
| Volunteer | amit.kumar@volunteer.com | volunteer123 |

### 6. Start the servers

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

- API: `http://localhost:3000`
- App: `http://localhost:5173`

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a new user |
| POST | `/auth/login` | No | Login and receive JWT |
| GET | `/auth/me` | Yes | Get current user profile |

**Register payload:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "CITIZEN",
  "phone": "9876543210"
}
```

For `NGO_ADMIN`, include an `ngoProfile` object:

```json
{
  "ngoProfile": {
    "name": "Help Foundation",
    "registrationNo": "NGO-MH-2020-001",
    "description": "...",
    "address": "15 Bandra West",
    "city": "Mumbai",
    "state": "Maharashtra"
  }
}
```

For `VOLUNTEER`, include a `volunteerProfile` object:

```json
{
  "volunteerProfile": {
    "bio": "Retired doctor",
    "skills": ["Medical", "First Aid"]
  }
}
```

### Requests

All request routes require a `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/requests` | Submit a new help request |
| GET | `/requests/mine` | Get your own requests |
| GET | `/requests/:id` | Get a single request by ID |
| GET | `/requests` | Get all PENDING / UNDER_REVIEW requests |

**Create request payload:**

```json
{
  "title": "Need food assistance",
  "description": "My family of five has been struggling...",
  "category": "FOOD",
  "urgencyLevel": 4,
  "address": "45 Dharavi Nagar",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

Valid categories: `FOOD`, `MEDICAL`, `SHELTER`, `EDUCATION`, `CLOTHING`, `FINANCIAL`, `OTHER`

Urgency level: `1` (low) – `5` (critical)

**Access control:**

- Citizens can only view their own requests.
- NGO admins and above can view all requests.

### Response shape

All endpoints return:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```

## Database Schema

```
User ──< Request
User 1─1 NGO ──< Request
               └─< Resource
User 1─1 Volunteer
```

| Model | Key fields |
|---|---|
| User | id, email, passwordHash, role, firstName, lastName |
| NGO | id, userId, name, registrationNo, isVerified |
| Volunteer | id, userId, skills (JSON), bio, isAvailable |
| Request | id, citizenId, ngoId, category, status, urgencyLevel |
| Resource | id, ngoId, name, type, quantity |

Request statuses: `PENDING → UNDER_REVIEW → APPROVED → IN_PROGRESS → COMPLETED` (or `REJECTED` / `CANCELLED`)

## Running Tests

Integration tests run against a real database. Make sure `backend/.env` is configured before running.

```bash
cd backend
npm test
```

Tests clean up all data they create (prefixed emails are deleted in `afterAll`). Running tests against your development database is safe.

## Roles

| Role | Capabilities |
|---|---|
| `CITIZEN` | Submit requests, view own requests |
| `NGO_ADMIN` | View all PENDING/UNDER_REVIEW requests, manage NGO profile |
| `VOLUNTEER` | View requests (future: accept assignments) |
| `SUPER_ADMIN` | Platform-wide admin access |

## License

MIT
