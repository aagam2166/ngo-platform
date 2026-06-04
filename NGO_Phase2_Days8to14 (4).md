# NGO Platform — Phase 2 Roadmap
## Days 8–14 | Both Developers Work Every Day

---

## What You Finished in Phase 1

| Feature | Status |
|---|---|
| Project setup, MySQL, Prisma, GitHub workflow | ✅ Done |
| Auth backend — register, login, JWT, `/me` route | ✅ Done |
| Auth frontend — login page, register page, Redux store, localStorage | ✅ Done |
| Dashboard with role-based welcome | ✅ Done |
| Request backend — create, list, view | ✅ Done |
| Citizen UI — submit form, my requests page, status badge | ✅ Done |
| Seed data — 8 users, 5 requests, 2 NGOs, 2 volunteers | ✅ Done |

---

## What Phase 2 Builds

| Day | Dev A | Dev B | End State |
|---|---|---|---|
| 8 | NGO Approval Backend | NGO Dashboard Frontend (UI + connect GET) | NGO sees requests in browser |
| 9 | Volunteer Management Backend | Wire up approve/reject + complete NGO dashboard | Full approve/reject works in browser |
| 10 | Resource / Inventory Backend | Volunteer Dashboard Frontend | Volunteers see assignments |
| 11 | NGO Enhanced Dashboard Backend | Resource Management Frontend | NGO manages resources |
| 12 | Admin Backend | Notification Backend | Admin + notification endpoints done |
| 13 | Search & Filter Backend | Admin Dashboard + Notification Frontend | Admin panel works |
| 14 | API polish + README + seed update | Mobile responsiveness + error states + 404 page | v0.2.0 released |

---

## The Daily Rule

Both devs work every single day.
Dev A owns backend one day, Dev B owns it the next — roles swap constantly.
Neither person is just "reviewing". Reviews are 10 minutes at most.

---

# DAY 8

## Dev A — NGO Approval Backend

**Branch:** `feature/ngo-approval-backend`

### What to build

**1. Schema migration — add 2 fields to Request model**

Add to `backend/prisma/schema.prisma` inside the Request model:
```prisma
rejectionReason String?   @db.Text
reviewedAt      DateTime?
```

Run:
```bash
npx prisma migrate dev --name add-rejection-reviewed-fields
```

**2. Create `backend/src/middleware/authorize.ts`**

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { AppError } from './errorHandler';

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(
        `Access denied. Required: ${roles.join(' or ')}. You are: ${req.user.role}`, 403
      ));
    }
    next();
  };
};
```

**3. Add to `request.service.ts`**

```typescript
export const updateRequestStatus = async (
  requestId: string,
  status: string,
  ngoId: string,
  rejectionReason?: string
) => {
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError('Request not found', 404);

  if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
    throw new AppError(`Cannot update a ${request.status.toLowerCase()} request`, 400);
  }

  if (status === 'REJECTED' && !rejectionReason) {
    throw new AppError('Rejection reason is required', 400);
  }

  return prisma.request.update({
    where: { id: requestId },
    data: {
      status: status as any,
      ngoId,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      reviewedAt: new Date(),
    },
    include: {
      citizen: { select: { firstName: true, lastName: true, email: true } },
    },
  });
};

export const getRequestStats = async () => {
  const statuses = ['PENDING','UNDER_REVIEW','APPROVED','REJECTED','IN_PROGRESS','COMPLETED','CANCELLED'];
  const counts = await Promise.all(
    statuses.map(s => prisma.request.count({ where: { status: s as any } }))
  );
  const stats: Record<string, number> = {};
  statuses.forEach((s, i) => { stats[s] = counts[i]; });
  stats.TOTAL = counts.reduce((a, b) => a + b, 0);
  return stats;
};
```

**4. Add to `request.controller.ts`**

```typescript
export const updateStatusHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, rejectionReason } = req.body;
    const validStatuses = ['PENDING','UNDER_REVIEW','APPROVED','REJECTED','IN_PROGRESS','COMPLETED','CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return next(new AppError(`Invalid status`, 400));
    }
    const ngoProfile = await prisma.nGO.findUnique({ where: { userId: req.user!.userId } });
    if (!ngoProfile) return next(new AppError('NGO profile not found', 404));
    const updated = await updateRequestStatus(req.params.id, status, ngoProfile.id, rejectionReason);
    sendSuccess(res, updated);
  } catch (err) { next(err); }
};

export const getStatsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getRequestStats();
    sendSuccess(res, stats);
  } catch (err) { next(err); }
};
```

**5. Update `request.routes.ts`**

Add these routes. Order matters — specific paths before `/:id`:
```typescript
import { authorize } from '../../middleware/authorize';

// Add these lines (specific paths first)
router.get('/stats', authenticate, authorize('NGO_ADMIN', 'SUPER_ADMIN'), getStatsHandler);
router.get('/', authenticate, authorize('NGO_ADMIN', 'SUPER_ADMIN'), getAllRequestsHandler);
router.patch('/:id/status', authenticate, authorize('NGO_ADMIN', 'SUPER_ADMIN'), updateStatusHandler);
```

**6. Postman tests to run**

| # | Request | Expected |
|---|---|---|
| 1 | `GET /requests/stats` with NGO token | 200, counts per status |
| 2 | `GET /requests/stats` with citizen token | 403 access denied |
| 3 | `PATCH /requests/seed-request-001/status` `{ "status": "APPROVED" }` | 200, reviewedAt filled |
| 4 | `PATCH /requests/seed-request-004/status` `{ "status": "REJECTED", "rejectionReason": "Out of area" }` | 200, rejectionReason filled |
| 5 | Reject without a reason | 400 |
| 6 | PATCH with citizen token | 403 |
| 7 | `GET /requests/stats` again | Counts updated |

---

## Dev B — NGO Dashboard Frontend

**Branch:** `feature/ngo-dashboard-ui`

> Dev B works on this at the same time as Dev A. Use seeded data for GET requests — those already work. The PATCH endpoint will be merged from Dev A at end of day, then Dev B hooks it up on Day 9.

### What to build

**1. Create `frontend/src/routes/RoleRoute.tsx`**

```tsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../store';

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
```

**2. Create `frontend/src/pages/ngo/NGODashboardPage.tsx`**

Build the full page layout:
- Stats bar at the top — 4 boxes: Pending / Under Review / Approved / Rejected (show `—` for now, will wire up Day 9)
- Request list below — one card per request showing:
  - Citizen name (from `citizen.firstName + lastName`)
  - Request title
  - Category badge
  - `<StatusBadge />` component (already exists)
  - Urgency level in colored text
  - Date formatted
  - Two buttons: green "Approve" + red "Reject" — `onClick` logs to console for now
- Loading spinner while fetching
- Empty state if no requests

```tsx
import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../lib/api';

interface Request {
  id: string;
  title: string;
  category: string;
  status: string;
  urgencyLevel: number;
  city: string;
  state: string;
  createdAt: string;
  citizen: { firstName: string; lastName: string; email: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: '🍱 Food', MEDICAL: '🏥 Medical', SHELTER: '🏠 Shelter',
  EDUCATION: '📚 Education', CLOTHING: '👕 Clothing',
  FINANCIAL: '💰 Financial', OTHER: '📦 Other',
};

const URGENCY_COLORS: Record<number, string> = {
  1: 'text-green-600', 2: 'text-lime-600', 3: 'text-yellow-600',
  4: 'text-orange-600', 5: 'text-red-600',
};

export default function NGODashboardPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests');
      setRequests(res.data.data);
    } catch {
      setError('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">NGO Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Review and act on incoming help requests</p>
        </div>

        {/* Stats bar — static for now, wired up Day 9 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending', value: '—', color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Under Review', value: '—', color: 'text-blue-600 bg-blue-50' },
            { label: 'Approved', value: '—', color: 'text-green-600 bg-green-50' },
            { label: 'Rejected', value: '—', color: 'text-red-600 bg-red-50' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl p-4 ${stat.color} border border-opacity-20`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-semibold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
        )}

        {/* Empty */}
        {!loading && !error && requests.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400">No pending requests right now</p>
          </div>
        )}

        {/* Request cards */}
        {!loading && !error && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {CATEGORY_LABELS[req.category] ?? req.category}
                      </span>
                      <span className={`text-xs font-semibold ${URGENCY_COLORS[req.urgencyLevel]}`}>
                        Urgency {req.urgencyLevel}/5
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{req.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      By {req.citizen.firstName} {req.citizen.lastName} · {req.city}, {req.state} · {formatDate(req.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={req.status} />
                  </div>
                </div>

                {/* Action buttons — console.log for now, wired up on Day 9 */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => console.log('Approve', req.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => console.log('Reject', req.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**3. Add route in `routes/index.tsx`**

```tsx
import RoleRoute from './RoleRoute';
import NGODashboardPage from '../pages/ngo/NGODashboardPage';

// Add inside <Routes>:
<Route
  path="/ngo/dashboard"
  element={
    <RoleRoute allowedRoles={['NGO_ADMIN', 'SUPER_ADMIN']}>
      <NGODashboardPage />
    </RoleRoute>
  }
/>
```

**4. Update Dashboard.tsx NGO actions link**

The NGO section in Dashboard.tsx has a "View Pending Requests" button. Change its `href` to `/ngo/dashboard`.

**5. Test in browser**

- Login as `meera@helpfoundation.org` / `ngo123`
- Click "View Pending Requests" from dashboard
- Should land on `/ngo/dashboard`
- Should see the 3 seeded requests (PENDING + UNDER_REVIEW ones)
- Approve/Reject buttons are visible but log to console — fully wired on Day 9

---

## End of Day 8

Both push their branches, create PRs, merge both to main. Pull main. Tomorrow Dev B hooks up the real API calls using Dev A's endpoints.

---

# DAY 9

## Dev A — Volunteer Management Backend

**Branch:** `feature/volunteer-backend`

### What to build

**1. Schema migration — add VolunteerAssignment model**

Add to `schema.prisma`:
```prisma
model VolunteerAssignment {
  id          String    @id @default(uuid())
  requestId   String
  request     Request   @relation(fields: [requestId], references: [id])
  volunteerId String
  volunteer   Volunteer @relation(fields: [volunteerId], references: [id])
  assignedBy  String
  assignedAt  DateTime  @default(now())
  status      String    @default("ASSIGNED")
  notes       String?   @db.Text
  updatedAt   DateTime  @updatedAt

  @@unique([requestId, volunteerId])
  @@index([volunteerId])
  @@index([requestId])
}
```

Also add this relation line inside the existing `Request` model:
```prisma
assignments VolunteerAssignment[]
```

And inside the existing `Volunteer` model:
```prisma
assignments VolunteerAssignment[]
```

Run:
```bash
npx prisma migrate dev --name add-volunteer-assignments
```

**2. Create `backend/src/modules/volunteers/volunteer.service.ts`**

```typescript
import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export const getAvailableVolunteers = async () => {
  return prisma.volunteer.findMany({
    where: { isAvailable: true },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
    },
  });
};

export const assignVolunteer = async (
  requestId: string,
  volunteerId: string,
  assignedBy: string,
  notes?: string
) => {
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError('Request not found', 404);

  const volunteer = await prisma.volunteer.findUnique({ where: { id: volunteerId } });
  if (!volunteer) throw new AppError('Volunteer not found', 404);

  const existing = await prisma.volunteerAssignment.findUnique({
    where: { requestId_volunteerId: { requestId, volunteerId } },
  });
  if (existing) throw new AppError('This volunteer is already assigned to this request', 400);

  const assignment = await prisma.volunteerAssignment.create({
    data: { requestId, volunteerId, assignedBy, notes },
    include: {
      volunteer: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
      request: { select: { title: true, status: true } },
    },
  });

  // Update request status to IN_PROGRESS
  await prisma.request.update({
    where: { id: requestId },
    data: { status: 'IN_PROGRESS' },
  });

  return assignment;
};

export const getMyAssignments = async (userId: string) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
  if (!volunteer) throw new AppError('Volunteer profile not found', 404);

  return prisma.volunteerAssignment.findMany({
    where: { volunteerId: volunteer.id },
    include: {
      request: {
        include: {
          citizen: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });
};

export const updateAssignmentStatus = async (
  assignmentId: string,
  status: string,
  volunteerId: string
) => {
  const assignment = await prisma.volunteerAssignment.findUnique({
    where: { id: assignmentId },
    include: { volunteer: true },
  });

  if (!assignment) throw new AppError('Assignment not found', 404);
  if (assignment.volunteer.userId !== volunteerId) throw new AppError('Forbidden', 403);

  return prisma.volunteerAssignment.update({
    where: { id: assignmentId },
    data: { status },
  });
};
```

**3. Create `volunteer.controller.ts`, `volunteer.routes.ts`** — same pattern as auth/requests.

Routes:
```typescript
router.get('/', authenticate, authorize('NGO_ADMIN', 'SUPER_ADMIN'), getVolunteersHandler);
router.post('/assign', authenticate, authorize('NGO_ADMIN', 'SUPER_ADMIN'), assignVolunteerHandler);
router.get('/assignments', authenticate, authorize('VOLUNTEER'), getMyAssignmentsHandler);
router.patch('/assignments/:id', authenticate, authorize('VOLUNTEER'), updateAssignmentHandler);
```

Mount in `app.ts`:
```typescript
import volunteerRoutes from './modules/volunteers/volunteer.routes';
app.use('/api/v1/volunteers', volunteerRoutes);
```

**4. Postman tests to run**

| # | Request | Expected |
|---|---|---|
| 1 | `GET /volunteers` with NGO token | 200, list of volunteers |
| 2 | `GET /volunteers` with citizen token | 403 |
| 3 | `POST /volunteers/assign` `{ "requestId": "seed-request-001", "volunteerId": "<id>" }` | 200, assignment created, request → IN_PROGRESS |
| 4 | Assign same volunteer to same request again | 400 duplicate |
| 5 | `GET /volunteers/assignments` with volunteer token | 200, their assignments |
| 6 | `PATCH /volunteers/assignments/:id` `{ "status": "COMPLETED" }` | 200 |

---

## Dev B — Wire Up Approve/Reject + Complete NGO Dashboard

**Branch:** `feature/ngo-dashboard-complete`

> Start this after pulling Dev A's Day 8 backend merge from main.

### What to build

**1. Pull main first**
```bash
git checkout main && git pull origin main
git checkout -b feature/ngo-dashboard-complete
```

**2. Add rejection modal state to NGODashboardPage**

Replace the console.log buttons with real API calls. Add state for the rejection modal:

```tsx
const [approvingId, setApprovingId] = useState<string | null>(null);
const [rejectingId, setRejectingId] = useState<string | null>(null);
const [rejectionReason, setRejectionReason] = useState('');
const [actionLoading, setActionLoading] = useState(false);
const [actionError, setActionError] = useState('');

const handleApprove = async (id: string) => {
  setActionLoading(true);
  setActionError('');
  try {
    await api.patch(`/requests/${id}/status`, { status: 'APPROVED' });
    await fetchRequests(); // refresh list
  } catch (err: any) {
    setActionError(err.response?.data?.message || 'Failed to approve');
  } finally {
    setActionLoading(false);
    setApprovingId(null);
  }
};

const handleReject = async (id: string) => {
  if (!rejectionReason.trim()) {
    setActionError('Please enter a rejection reason');
    return;
  }
  setActionLoading(true);
  setActionError('');
  try {
    await api.patch(`/requests/${id}/status`, { status: 'REJECTED', rejectionReason });
    setRejectionReason('');
    setRejectingId(null);
    await fetchRequests();
  } catch (err: any) {
    setActionError(err.response?.data?.message || 'Failed to reject');
  } finally {
    setActionLoading(false);
  }
};
```

Replace the button onClick handlers:
```tsx
onClick={() => setApprovingId(req.id)}   // Approve button
onClick={() => setRejectingId(req.id)}   // Reject button
```

Add confirmation UI below the buttons (shown only when approvingId or rejectingId matches this card's id):
```tsx
{approvingId === req.id && (
  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
    <p className="text-sm text-green-700 font-medium mb-2">Confirm approval?</p>
    {actionError && <p className="text-xs text-red-500 mb-2">{actionError}</p>}
    <div className="flex gap-2">
      <button onClick={() => handleApprove(req.id)} disabled={actionLoading}
        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-1.5 rounded-lg">
        {actionLoading ? 'Approving…' : 'Yes, Approve'}
      </button>
      <button onClick={() => setApprovingId(null)}
        className="flex-1 border border-gray-300 text-gray-600 text-sm py-1.5 rounded-lg hover:bg-gray-50">
        Cancel
      </button>
    </div>
  </div>
)}

{rejectingId === req.id && (
  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
    <p className="text-sm text-red-700 font-medium mb-2">Reason for rejection</p>
    <textarea
      rows={2}
      value={rejectionReason}
      onChange={(e) => setRejectionReason(e.target.value)}
      placeholder="Explain why this request is being rejected…"
      className="w-full text-sm border border-red-200 rounded-lg px-3 py-2 outline-none focus:border-red-400 resize-none mb-2"
    />
    {actionError && <p className="text-xs text-red-500 mb-2">{actionError}</p>}
    <div className="flex gap-2">
      <button onClick={() => handleReject(req.id)} disabled={actionLoading}
        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 rounded-lg">
        {actionLoading ? 'Rejecting…' : 'Reject Request'}
      </button>
      <button onClick={() => { setRejectingId(null); setRejectionReason(''); setActionError(''); }}
        className="flex-1 border border-gray-300 text-gray-600 text-sm py-1.5 rounded-lg hover:bg-gray-50">
        Cancel
      </button>
    </div>
  </div>
)}
```

**3. Wire up the stats bar**

Replace the hardcoded `'—'` values by calling `/requests/stats`:

```tsx
const [stats, setStats] = useState<Record<string, number>>({});

useEffect(() => {
  api.get('/requests/stats').then(res => setStats(res.data.data)).catch(() => {});
}, []);
```

Then use `stats.PENDING ?? '—'`, `stats.UNDER_REVIEW ?? '—'` etc in the stats bar.

**4. Test in browser**

- Login as NGO admin
- Go to `/ngo/dashboard`
- Stats bar shows real counts
- Click Approve on a request → confirmation appears → confirm → card disappears from list, stats update
- Click Reject on a request → reason textarea appears → type reason → reject → card disappears

---

## End of Day 9

Push, PRs, merge both to main. Full approve/reject flow now works end to end in the browser.

---

# DAY 10

## Dev A — Resource / Inventory Backend

**Branch:** `feature/resource-backend`

### What to build

The `Resource` model already exists in the schema. Build full CRUD.

**1. Create `backend/src/modules/resources/resource.schema.ts`**

```typescript
import { z } from 'zod';

export const createResourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().optional(),
  description: z.string().optional(),
});

export const updateResourceSchema = createResourceSchema.partial();
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
```

**2. Create `resource.service.ts`**

```typescript
export const createResource = async (ngoId: string, data: CreateResourceInput) => {
  return prisma.resource.create({ data: { ...data, ngoId } });
};

export const getNGOResources = async (ngoId: string) => {
  return prisma.resource.findMany({
    where: { ngoId },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateResource = async (id: string, ngoId: string, data: UpdateResourceInput) => {
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) throw new AppError('Resource not found', 404);
  if (resource.ngoId !== ngoId) throw new AppError('Forbidden', 403);
  return prisma.resource.update({ where: { id }, data });
};

export const deleteResource = async (id: string, ngoId: string) => {
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) throw new AppError('Resource not found', 404);
  if (resource.ngoId !== ngoId) throw new AppError('Forbidden', 403);
  return prisma.resource.delete({ where: { id } });
};
```

**3. Create `resource.controller.ts` and `resource.routes.ts`** — same pattern.

Routes — all NGO_ADMIN only:
```typescript
router.post('/', authenticate, authorize('NGO_ADMIN'), createResourceHandler);
router.get('/', authenticate, authorize('NGO_ADMIN'), getResourcesHandler);
router.patch('/:id', authenticate, authorize('NGO_ADMIN'), updateResourceHandler);
router.delete('/:id', authenticate, authorize('NGO_ADMIN'), deleteResourceHandler);
```

Mount in `app.ts`:
```typescript
app.use('/api/v1/resources', resourceRoutes);
```

**4. Postman tests**

| # | Request | Expected |
|---|---|---|
| 1 | `POST /resources` with NGO token, `{ "name": "Rice bags", "type": "FOOD", "quantity": 50, "unit": "kg" }` | 201 |
| 2 | `GET /resources` | 200, array with 1 item |
| 3 | `PATCH /resources/:id` `{ "quantity": 30 }` | 200, quantity updated |
| 4 | `DELETE /resources/:id` | 200 |
| 5 | `GET /resources` again | 200, empty array |
| 6 | Any route with citizen token | 403 |

---

## Dev B — Volunteer Dashboard Frontend

**Branch:** `feature/volunteer-dashboard`

> Dev B uses the `/volunteers/assignments` endpoint which Dev A is building today. Build the UI structure fully — the API call will work once Dev A merges and you pull.

### What to build

**1. Create `frontend/src/pages/volunteer/VolunteerDashboardPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../lib/api';

interface Assignment {
  id: string;
  status: string;
  assignedAt: string;
  notes?: string;
  request: {
    id: string;
    title: string;
    category: string;
    urgencyLevel: number;
    city: string;
    state: string;
    status: string;
    citizen: { firstName: string; lastName: string; phone?: string };
  };
}

const ASSIGNMENT_STATUS_STYLES: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

export default function VolunteerDashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/volunteers/assignments');
      setAssignments(res.data.data);
    } catch { /* handle */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/volunteers/assignments/${id}`, { status });
      await fetchAssignments();
    } catch { /* handle */ }
    finally { setUpdatingId(null); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Requests assigned to you by NGOs</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && assignments.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <span className="text-4xl">🤝</span>
            <p className="text-gray-500 mt-4">No assignments yet. Check back soon.</p>
          </div>
        )}

        {!loading && assignments.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">{a.request.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Citizen: {a.request.citizen.firstName} {a.request.citizen.lastName}
                  {a.request.citizen.phone && ` · ${a.request.citizen.phone}`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {a.request.city}, {a.request.state} · Assigned {formatDate(a.assignedAt)}
                </p>
                {a.notes && (
                  <p className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                    Note: {a.notes}
                  </p>
                )}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${ASSIGNMENT_STATUS_STYLES[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {a.status}
              </span>
            </div>

            {/* Action buttons based on current status */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
              {a.status === 'ASSIGNED' && (
                <button onClick={() => updateStatus(a.id, 'IN_PROGRESS')}
                  disabled={updatingId === a.id}
                  className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                  {updatingId === a.id ? 'Updating…' : 'Mark In Progress'}
                </button>
              )}
              {a.status === 'IN_PROGRESS' && (
                <button onClick={() => updateStatus(a.id, 'COMPLETED')}
                  disabled={updatingId === a.id}
                  className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                  {updatingId === a.id ? 'Updating…' : 'Mark Completed'}
                </button>
              )}
              {a.status === 'COMPLETED' && (
                <span className="text-sm text-green-600 font-medium">✅ Completed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**2. Add route in `routes/index.tsx`**

```tsx
import RoleRoute from './RoleRoute';
import VolunteerDashboardPage from '../pages/volunteer/VolunteerDashboardPage';

<Route path="/volunteer/dashboard" element={
  <RoleRoute allowedRoles={['VOLUNTEER']}>
    <VolunteerDashboardPage />
  </RoleRoute>
} />
```

**3. Update Dashboard.tsx volunteer actions link** to `/volunteer/dashboard`.

---

## End of Day 10

Push, PRs, merge to main. Resources backend done. Volunteers can see their assignments.

---

# DAY 11

## Dev A — NGO Enhanced Dashboard (Assign Volunteer)

**Branch:** `feature/ngo-assign-volunteer`

### What to build

Add volunteer assignment capability to the NGO dashboard. The NGO should be able to assign a volunteer directly from a request card.

**1. Update NGODashboardPage to fetch volunteers and add assignment**

```tsx
const [volunteers, setVolunteers] = useState<any[]>([]);
const [selectedVolunteer, setSelectedVolunteer] = useState<Record<string, string>>({});
const [assigningId, setAssigningId] = useState<string | null>(null);

useEffect(() => {
  api.get('/volunteers').then(res => setVolunteers(res.data.data)).catch(() => {});
}, []);

const handleAssign = async (requestId: string) => {
  const volunteerId = selectedVolunteer[requestId];
  if (!volunteerId) return;
  setAssigningId(requestId);
  try {
    await api.post('/volunteers/assign', { requestId, volunteerId });
    await fetchRequests();
  } catch (err: any) {
    setActionError(err.response?.data?.message || 'Assignment failed');
  } finally {
    setAssigningId(null);
  }
};
```

Add the assignment UI inside each request card (only show if status is APPROVED or UNDER_REVIEW):

```tsx
{(req.status === 'APPROVED' || req.status === 'UNDER_REVIEW') && volunteers.length > 0 && (
  <div className="mt-3 flex gap-2">
    <select
      value={selectedVolunteer[req.id] || ''}
      onChange={(e) => setSelectedVolunteer(prev => ({ ...prev, [req.id]: e.target.value }))}
      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-orange-400"
    >
      <option value="">Assign a volunteer…</option>
      {volunteers.map((v) => (
        <option key={v.id} value={v.id}>
          {v.user.firstName} {v.user.lastName}
        </option>
      ))}
    </select>
    <button
      onClick={() => handleAssign(req.id)}
      disabled={!selectedVolunteer[req.id] || assigningId === req.id}
      className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
    >
      {assigningId === req.id ? 'Assigning…' : 'Assign'}
    </button>
  </div>
)}
```

---

## Dev B — Resource Management Frontend

**Branch:** `feature/resource-management-ui`

> Pull main first — Dev A's resource backend from Day 10 must be merged.

### What to build

**1. Create `frontend/src/pages/ngo/ResourcesPage.tsx`**

Full resource management page — list, add inline form, edit quantity inline, delete with confirmation.

```tsx
import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

interface Resource {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit?: string;
  description?: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: '', quantity: 0, unit: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      setResources(res.data.data);
    } catch { setError('Failed to load resources'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.type || form.quantity < 0) return;
    setSubmitting(true);
    try {
      await api.post('/resources', { ...form, quantity: Number(form.quantity) });
      setForm({ name: '', type: '', quantity: 0, unit: '', description: '' });
      setShowForm(false);
      await fetchResources();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add resource');
    } finally { setSubmitting(false); }
  };

  const handleUpdateQty = async (id: string) => {
    try {
      await api.patch(`/resources/${id}`, { quantity: editQty });
      setEditingId(null);
      await fetchResources();
    } catch { setError('Failed to update'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/resources/${id}`);
      setDeletingId(null);
      await fetchResources();
    } catch { setError('Failed to delete'); }
  };

  const RESOURCE_TYPES = ['FOOD', 'MEDICAL', 'CLOTHING', 'SHELTER', 'EDUCATION', 'FINANCIAL', 'OTHER'];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
            <p className="text-sm text-gray-500 mt-1">Track what your NGO has available</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            {showForm ? 'Cancel' : '+ Add Resource'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">New Resource</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rice bags"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400">
                  <option value="">Select type</option>
                  {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Quantity</label>
                <input type="number" min={0} value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Unit (optional)</label>
                <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="kg, pieces, packs…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
            </div>
            <button onClick={handleAdd} disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold px-6 py-2 rounded-lg">
              {submitting ? 'Adding…' : 'Add Resource'}
            </button>
          </div>
        )}

        {/* Resources table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <span className="text-4xl">📦</span>
            <p className="text-gray-500 mt-4">No resources yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Quantity</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">{r.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === r.id ? (
                        <div className="flex items-center gap-2">
                          <input type="number" min={0} value={editQty}
                            onChange={e => setEditQty(Number(e.target.value))}
                            className="w-20 border border-orange-300 rounded px-2 py-1 text-sm outline-none" />
                          {r.unit && <span className="text-gray-400 text-xs">{r.unit}</span>}
                          <button onClick={() => handleUpdateQty(r.id)}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded">Save</button>
                          <button onClick={() => setEditingId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingId(r.id); setEditQty(r.quantity); }}
                          className="font-semibold text-gray-900 hover:text-orange-500 transition-colors">
                          {r.quantity} {r.unit && <span className="text-gray-400 font-normal">{r.unit}</span>}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {deletingId === r.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600">Sure?</span>
                          <button onClick={() => handleDelete(r.id)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded">Yes</button>
                          <button onClick={() => setDeletingId(null)}
                            className="text-xs text-gray-400">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingId(r.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

**2. Add route in `routes/index.tsx`**

```tsx
import ResourcesPage from '../pages/ngo/ResourcesPage';

<Route path="/ngo/resources" element={
  <RoleRoute allowedRoles={['NGO_ADMIN']}>
    <ResourcesPage />
  </RoleRoute>
} />
```

**3. Add link in Navbar**

When user role is `NGO_ADMIN`, show a "Resources" link next to "Dashboard" in the Navbar.

---

## End of Day 11

Push, PRs, merge to main. NGO can now assign volunteers and manage inventory.

---

# DAY 12

## Dev A — Admin Backend

**Branch:** `feature/admin-backend`

### What to build

The Super Admin needs endpoints to see and manage the entire platform.

**1. Create `backend/src/modules/admin/admin.service.ts`**

```typescript
export const getPlatformStats = async () => {
  const [totalUsers, totalNGOs, totalRequests, totalVolunteers] = await Promise.all([
    prisma.user.count(),
    prisma.nGO.count(),
    prisma.request.count(),
    prisma.volunteer.count(),
  ]);

  const requestsByStatus = await prisma.request.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
  });

  return { totalUsers, totalNGOs, totalRequests, totalVolunteers, requestsByStatus, usersByRole };
};

export const getAllUsers = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip, take: limit,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);
  return { users, total, page, totalPages: Math.ceil(total / limit) };
};

export const toggleUserActive = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: { id: true, email: true, isActive: true },
  });
};

export const getAllNGOs = async () => {
  return prisma.nGO.findMany({
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const toggleNGOVerification = async (ngoId: string) => {
  const ngo = await prisma.nGO.findUnique({ where: { id: ngoId } });
  if (!ngo) throw new AppError('NGO not found', 404);
  return prisma.nGO.update({
    where: { id: ngoId },
    data: { isVerified: !ngo.isVerified },
  });
};
```

**2. Create controller, routes, mount in app.ts** — same pattern, all routes restricted to `SUPER_ADMIN`.

Routes:
```typescript
router.get('/stats', authenticate, authorize('SUPER_ADMIN'), getStatsHandler);
router.get('/users', authenticate, authorize('SUPER_ADMIN'), getUsersHandler);
router.patch('/users/:id/toggle', authenticate, authorize('SUPER_ADMIN'), toggleUserHandler);
router.get('/ngos', authenticate, authorize('SUPER_ADMIN'), getNGOsHandler);
router.patch('/ngos/:id/verify', authenticate, authorize('SUPER_ADMIN'), toggleVerifyHandler);
```

Mount:
```typescript
app.use('/api/v1/admin', adminRoutes);
```

---

## Dev B — Notification Backend

**Branch:** `feature/notification-backend`

### What to build

**1. Schema migration — add Notification model**

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  message   String   @db.Text
  type      String   @default("INFO")
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([isRead])
}
```

Add `notifications Notification[]` to the User model.

```bash
npx prisma migrate dev --name add-notifications
```

**2. Create `notification.service.ts`**

```typescript
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type = 'INFO'
) => {
  return prisma.notification.create({ data: { userId, title, message, type } });
};

export const getUserNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
};

export const markAsRead = async (notificationId: string, userId: string) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({ where: { userId, isRead: false } });
};
```

**3. Create controller and routes**

```typescript
router.get('/', authenticate, getNotificationsHandler);
router.get('/unread-count', authenticate, getUnreadCountHandler);
router.patch('/:id/read', authenticate, markAsReadHandler);
router.patch('/read-all', authenticate, markAllAsReadHandler);
```

**4. Auto-create notification when request status changes**

Update `request.service.ts` `updateRequestStatus` to also create a notification:

```typescript
// At the end of updateRequestStatus, after the update:
import { createNotification } from '../notifications/notification.service';

await createNotification(
  request.citizenId,
  `Request ${status.toLowerCase()}`,
  status === 'APPROVED'
    ? `Your request "${request.title}" has been approved!`
    : status === 'REJECTED'
    ? `Your request "${request.title}" was rejected. Reason: ${rejectionReason}`
    : `Your request "${request.title}" status changed to ${status}`,
  status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO'
);
```

---

## End of Day 12

Push, PRs, merge to main. Admin backend and notifications backend both done.

---

# DAY 13

## Dev A — Search & Filter Backend

**Branch:** `feature/search-filter-backend`

### What to build

Citizens and NGOs need to filter and search requests.

**1. Update `getAllRequestsForNGO` in `request.service.ts` to accept filters**

```typescript
export const getAllRequestsForNGO = async (filters: {
  status?: string;
  category?: string;
  city?: string;
  urgencyLevel?: number;
  search?: string;
}) => {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'] };
  }

  if (filters.category) where.category = filters.category;
  if (filters.city) where.city = { contains: filters.city };
  if (filters.urgencyLevel) where.urgencyLevel = filters.urgencyLevel;

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  return prisma.request.findMany({
    where,
    include: {
      citizen: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: [{ urgencyLevel: 'desc' }, { createdAt: 'desc' }],
  });
};
```

**2. Update `getAllRequestsHandler` in controller to read query params**

```typescript
export const getAllRequestsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, category, city, urgencyLevel, search } = req.query;
    const requests = await getAllRequestsForNGO({
      status: status as string,
      category: category as string,
      city: city as string,
      urgencyLevel: urgencyLevel ? Number(urgencyLevel) : undefined,
      search: search as string,
    });
    sendSuccess(res, requests);
  } catch (err) { next(err); }
};
```

**3. Add filter to citizen's own requests too**

Update `getMyRequests` to accept optional status filter:
```typescript
export const getMyRequests = async (citizenId: string, status?: string) => {
  return prisma.request.findMany({
    where: { citizenId, ...(status ? { status: status as any } : {}) },
    orderBy: { createdAt: 'desc' },
  });
};
```

**Postman tests:**
- `GET /requests?status=PENDING` → only pending
- `GET /requests?category=FOOD` → only food requests
- `GET /requests?search=medical` → requests with "medical" in title or description
- `GET /requests?urgencyLevel=5` → only critical requests
- `GET /requests?status=APPROVED&category=FOOD` → combine filters

---

## Dev B — Admin Dashboard + Notification Frontend

**Branch:** `feature/admin-and-notifications`

> Pull main first — needs Day 12 backends.

### What to build

**1. Notification Bell in Navbar**

Update `Navbar.tsx` to show a bell icon with unread count when logged in:

```tsx
const [unreadCount, setUnreadCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);
const [notifications, setNotifications] = useState<any[]>([]);

useEffect(() => {
  if (isAuthenticated) {
    api.get('/notifications/unread-count')
      .then(res => setUnreadCount(res.data.data))
      .catch(() => {});
  }
}, [isAuthenticated]);

const openNotifications = async () => {
  setShowNotifications(!showNotifications);
  if (!showNotifications) {
    const res = await api.get('/notifications');
    setNotifications(res.data.data);
  }
};

const markAllRead = async () => {
  await api.patch('/notifications/read-all');
  setUnreadCount(0);
  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
};
```

Add bell button in the Navbar (after the user name, before logout):

```tsx
<div className="relative">
  <button onClick={openNotifications}
    className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
    🔔
    {unreadCount > 0 && (
      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>

  {showNotifications && (
    <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-900 text-sm">Notifications</span>
        <button onClick={markAllRead} className="text-xs text-orange-500 hover:text-orange-600 font-medium">
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
        ) : notifications.map((n) => (
          <div key={n.id} className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-orange-50' : ''}`}>
            <p className="text-sm font-medium text-gray-900">{n.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
```

**2. Create `frontend/src/pages/admin/AdminDashboardPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'ngos'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/ngos'),
    ]).then(([s, u, n]) => {
      setStats(s.data.data);
      setUsers(u.data.data.users);
      setNgos(n.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const toggleUser = async (userId: string) => {
    await api.patch(`/admin/users/${userId}/toggle`);
    const res = await api.get('/admin/users');
    setUsers(res.data.data.users);
  };

  const toggleNGO = async (ngoId: string) => {
    await api.patch(`/admin/ngos/${ngoId}/verify`);
    const res = await api.get('/admin/ngos');
    setNgos(res.data.data);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mb-8">Platform overview and management</p>

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: '👥' },
              { label: 'NGOs', value: stats.totalNGOs, icon: '🏢' },
              { label: 'Requests', value: stats.totalRequests, icon: '📋' },
              { label: 'Volunteers', value: stats.totalVolunteers, icon: '🤝' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
          {(['overview', 'users', 'ngos'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleUser(u.id)}
                        className={`text-xs font-medium ${u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* NGOs tab */}
        {activeTab === 'ngos' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Admin</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">City</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Verified</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {ngos.map(n => (
                  <tr key={n.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{n.name}</td>
                    <td className="px-4 py-3 text-gray-500">{n.user.firstName} {n.user.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{n.city}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${n.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {n.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleNGO(n.id)}
                        className={`text-xs font-medium ${n.isVerified ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}>
                        {n.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

**3. Add route in `routes/index.tsx`**

```tsx
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';

<Route path="/admin" element={
  <RoleRoute allowedRoles={['SUPER_ADMIN']}>
    <AdminDashboardPage />
  </RoleRoute>
} />
```

---

## End of Day 13

Push, PRs, merge to main. Notifications work. Admin can manage users and NGOs.

---

# DAY 14

## Both Developers — Integration Testing + Cleanup + v0.2.0

**No new features today. Fix everything that's broken.**

---

## Morning — Run This Complete Flow Together

Both of you do this together, one sharing screen, the other navigating:

```
Flow 1 — Complete citizen journey:
  Login as rahul.sharma@example.com
  Submit a new FOOD request
  See it appear on /requests/mine as PENDING

Flow 2 — NGO approval:
  Login as meera@helpfoundation.org
  Go to /ngo/dashboard
  Stats bar shows correct counts
  See Rahul's request in the list
  Assign a volunteer (amit.kumar)
  Approve the request
  Check stats updated

Flow 3 — Volunteer sees assignment:
  Login as amit.kumar@volunteer.com
  Go to /volunteer/dashboard
  See the assigned request
  Click "Mark In Progress"
  Click "Mark Completed"

Flow 4 — Citizen sees notification:
  Login as rahul.sharma again
  Bell icon shows unread count
  Click bell → notification says request was approved
  Mark all read → count goes to 0

Flow 5 — Resource management:
  Login as NGO admin
  Go to /ngo/resources
  Add 3 resources
  Edit quantity on one
  Delete one

Flow 6 — Admin panel:
  Login as admin@ngoplatform.com
  Go to /admin
  Overview tab shows correct totals
  Users tab — deactivate a test user
  NGOs tab — verify an NGO

Flow 7 — Search and filter:
  In Postman: GET /requests?category=FOOD
  GET /requests?urgencyLevel=5
  GET /requests?search=food
```

Fix every bug you find. Do not start new features.

---

## Afternoon — Cleanup Tasks

**Dev A — Backend cleanup:**
- Remove all `console.log` from all backend files
- Update `README.md` with all new endpoints from Phase 2
- Update seed file to also seed: 2 resources, 1 volunteer assignment, 2 notifications
- Run `npx prisma migrate reset --force && npx prisma db seed` to verify seed still works

**Dev B — Frontend cleanup:**
- Add a filter bar to `MyRequestsPage.tsx` — dropdown to filter by status
- Add a filter bar to `NGODashboardPage.tsx` — dropdowns for status, category, urgency
- These call the same endpoints with query params: `api.get('/requests?status=PENDING')`
- Add a proper 404 page for unknown routes
- Test every page on mobile size (375px) in browser devtools — fix anything that overflows

---

## End of Day 14 — Tag the Release

Both pull main, verify everything is merged:

```bash
git checkout main
git pull origin main
git log --oneline -15
```

Tag the release:

```bash
git tag -a v0.2.0 -m "Phase 2: NGO approval, volunteer assignments, resource management, admin panel, notifications"
git push origin v0.2.0
```

On GitHub:
- Go to **Releases** → **Create a new release**
- Select tag `v0.2.0`
- Title: `v0.2.0 — Phase 2 Complete`
- Write what's new:
  ```
  - NGO can approve and reject citizen requests with reasons
  - NGO can assign volunteers to approved requests
  - Volunteers have a dashboard to track and update assignments
  - NGO can manage their resource/inventory
  - Admin dashboard with user and NGO management
  - In-app notifications when request status changes
  - Search and filter on all request lists
  ```
- Publish release

---

## What You Have After Phase 2

| Feature | Status |
|---|---|
| NGO can approve / reject with reason | ✅ |
| Role-based access (authorize middleware) | ✅ |
| Volunteer assignment system | ✅ |
| Volunteer dashboard | ✅ |
| Resource / inventory management | ✅ |
| Admin dashboard (users, NGOs, stats) | ✅ |
| In-app notification bell | ✅ |
| Search and filter on requests | ✅ |
| v0.2.0 tagged on GitHub | ✅ |

---

## Days 15–21 Preview

| Days | Feature |
|---|---|
| 15–16 | Request detail page + status timeline + comments |
| 17–18 | UI polish, mobile responsiveness, empty states, error boundaries |
| 19–20 | Testing — write tests for critical backend routes |
| 21 | Deployment — Railway (backend) + Vercel (frontend) + PlanetScale (database) |
