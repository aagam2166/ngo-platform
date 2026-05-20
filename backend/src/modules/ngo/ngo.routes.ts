import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import {
  getProfileHandler,
  getQueueHandler,
  getMyRequestsHandler,
  acceptRequestHandler,
  updateStatusHandler,
  returnRequestHandler,
} from './ngo.controller';

const router = Router();

router.use(authenticate, requireRole('NGO_ADMIN'));

router.get('/profile', getProfileHandler);
router.get('/queue', getQueueHandler);
router.get('/my-requests', getMyRequestsHandler);
router.patch('/requests/:id/accept', acceptRequestHandler);
router.patch('/requests/:id/status', updateStatusHandler);
router.patch('/requests/:id/return', returnRequestHandler);

export default router;
