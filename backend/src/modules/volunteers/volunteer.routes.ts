import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  getNGORosterHandler,
  addToRosterHandler,
  removeFromRosterHandler,
  getVolunteersForAssignmentHandler,
  getAllVolunteersHandler,
  assignVolunteerHandler,
  getMyAssignmentsHandler,
  updateAssignmentHandler,
} from './volunteer.controller';

const router = Router();

// ─────────────────────────────────────────────
// ROSTER — NGO manages their volunteer pool
// ─────────────────────────────────────────────
// GET    /volunteers/roster              → view roster
// POST   /volunteers/roster/:volunteerId → add to roster
// DELETE /volunteers/roster/:volunteerId → remove from roster

router.get(
  '/roster',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  getNGORosterHandler
);

router.post(
  '/roster/:volunteerId',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  addToRosterHandler
);

router.delete(
  '/roster/:volunteerId',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  removeFromRosterHandler
);

// ─────────────────────────────────────────────
// DISCOVERY
// ─────────────────────────────────────────────
// GET /volunteers/for-assignment → internal/external split (NGO)
// GET /volunteers                → all available volunteers (Admin only)

router.get(
  '/for-assignment',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  getVolunteersForAssignmentHandler
);

router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN'),
  getAllVolunteersHandler
);

// ─────────────────────────────────────────────
// ASSIGNMENT — specific paths BEFORE /:id
// ─────────────────────────────────────────────
// POST  /volunteers/assign          → NGO assigns volunteer to request
// GET   /volunteers/assignments     → volunteer sees their assignments
// PATCH /volunteers/assignments/:id → volunteer updates assignment status

router.post(
  '/assign',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  assignVolunteerHandler
);

router.get(
  '/assignments',
  authenticate,
  authorize('VOLUNTEER'),
  getMyAssignmentsHandler
);

router.patch(
  '/assignments/:id',
  authenticate,
  authorize('VOLUNTEER'),
  updateAssignmentHandler
);

export default router;