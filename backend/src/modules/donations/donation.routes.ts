import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import {
  getVerifiedNGOsHandler,
  createResourceDonationHandler,
  getMyResourceDonationsHandler,
  getNGOResourceDonationsHandler,
  respondToResourceDonationHandler,
  createMoneyDonationHandler,
  getMyMoneyDonationsHandler,
  getNGOAccountHandler,
  recordExpenseHandler,
  getAccountHistoryHandler,
} from './donation.controller';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
// List all verified NGOs (used on donation landing page — any visitor can see)
router.get('/ngos', authenticate, getVerifiedNGOsHandler);

// ── Resource donations (Citizen) ──────────────────────────────────────────────
router.post('/resources', authenticate, createResourceDonationHandler);
router.get('/resources/mine', authenticate, getMyResourceDonationsHandler);

// ── Resource donations (NGO side) ─────────────────────────────────────────────
router.get(
  '/resources/incoming',
  authenticate,
  requireRole('NGO_ADMIN'),
  getNGOResourceDonationsHandler
);
router.patch(
  '/resources/:id/respond',
  authenticate,
  requireRole('NGO_ADMIN'),
  respondToResourceDonationHandler
);

// ── Money donations (Citizen) ─────────────────────────────────────────────────
router.post('/money', authenticate, createMoneyDonationHandler);
router.get('/money/mine', authenticate, getMyMoneyDonationsHandler);

// ── NGO financial account ─────────────────────────────────────────────────────
router.get(
  '/account',
  authenticate,
  requireRole('NGO_ADMIN'),
  getNGOAccountHandler
);
router.post(
  '/account/expenses',
  authenticate,
  requireRole('NGO_ADMIN'),
  recordExpenseHandler
);
router.get(
  '/account/history',
  authenticate,
  requireRole('NGO_ADMIN'),
  getAccountHistoryHandler
);

export default router;
