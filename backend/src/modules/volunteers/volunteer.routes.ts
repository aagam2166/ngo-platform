import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

// Existing volunteer handlers
import {
  getNGORosterHandler,
  removeFromRosterHandler,
  getVolunteersForAssignmentHandler,
  getAllVolunteersHandler,
  assignVolunteerHandler,
  getMyAssignmentsHandler,
  updateAssignmentHandler,
} from './volunteer.controller';

// Join request handlers
import {
  sendJoinRequestHandler,
  searchNGOsHandler,
  getMyJoinRequestsHandler,
  withdrawJoinRequestHandler,
  leaveNGORosterHandler,
  getNGOJoinRequestsHandler,
  approveJoinRequestHandler,
  rejectJoinRequestHandler,
} from './volunteerJoinRequest.controller';

// Interest handlers
import {
  getOpenRequestsHandler,
  expressInterestHandler,
  getMyInterestsHandler,
  withdrawInterestHandler,
  getNGOInterestsHandler,
  approveInterestHandler,
  rejectInterestHandler,
} from './volunteerInterest.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────
// ROSTER — NGO views + removes, NOT direct add (consent required)
// ─────────────────────────────────────────────────────────────

router.get(
  '/roster',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  getNGORosterHandler
);

// NGO removes volunteer from roster
router.delete(
  '/roster/:volunteerId',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  removeFromRosterHandler
);

// ─────────────────────────────────────────────────────────────
// JOIN REQUESTS — Volunteer → NGO consent flow (Issue #1)
// ─────────────────────────────────────────────────────────────

// Volunteer sends join request to an NGO
router.post(
  '/join-requests',
  authenticate,
  authorize('VOLUNTEER'),
  sendJoinRequestHandler
);

// Volunteer searches NGOs by name and city
router.get(
  '/ngos/search',
  authenticate,
  authorize('VOLUNTEER'),
  searchNGOsHandler
);

// Volunteer sees their own join requests
router.get(
  '/join-requests',
  authenticate,
  authorize('VOLUNTEER'),
  getMyJoinRequestsHandler
);

// Volunteer withdraws a specific join request
router.patch(
  '/join-requests/:id/withdraw',
  authenticate,
  authorize('VOLUNTEER'),
  withdrawJoinRequestHandler
);

// Volunteer leaves an NGO they are already part of (Issue #3)
router.delete(
  '/roster/leave/:ngoId',
  authenticate,
  authorize('VOLUNTEER'),
  leaveNGORosterHandler
);

// NGO sees incoming join requests
router.get(
  '/join-requests/incoming',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  getNGOJoinRequestsHandler
);

// NGO approves a join request → volunteer added to roster
router.patch(
  '/join-requests/:id/approve',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  approveJoinRequestHandler
);

// NGO rejects a join request
router.patch(
  '/join-requests/:id/reject',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  rejectJoinRequestHandler
);

// ─────────────────────────────────────────────────────────────
// INTERESTS — Volunteer → Assignment consent flow (Issue #2)
// ─────────────────────────────────────────────────────────────

// Volunteer sees open requests they can offer help on
router.get(
  '/open-requests',
  authenticate,
  authorize('VOLUNTEER'),
  getOpenRequestsHandler
);

// Volunteer expresses interest in a specific request
router.post(
  '/interests/:requestId',
  authenticate,
  authorize('VOLUNTEER'),
  expressInterestHandler
);

// Volunteer sees all their interest requests
router.get(
  '/interests',
  authenticate,
  authorize('VOLUNTEER'),
  getMyInterestsHandler
);

// Volunteer withdraws an interest
router.patch(
  '/interests/:id/withdraw',
  authenticate,
  authorize('VOLUNTEER'),
  withdrawInterestHandler
);

// NGO sees volunteer interest requests for their requests
router.get(
  '/interests/incoming',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  getNGOInterestsHandler
);

// NGO approves interest → creates assignment automatically
router.patch(
  '/interests/:id/approve',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  approveInterestHandler
);

// NGO rejects interest
router.patch(
  '/interests/:id/reject',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  rejectInterestHandler
);

// ─────────────────────────────────────────────────────────────
// DISCOVERY
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// DIRECT ASSIGNMENT (NGO assigns directly from roster)
// ─────────────────────────────────────────────────────────────

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