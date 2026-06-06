import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  createRequestHandler,
  getMyRequestsHandler,
  getOneRequestHandler,
  getAllRequestsHandler,
  updateStatusHandler,
  getStatsHandler,
  cancelRequestHandler,
  addCommentHandler,
  deleteCommentHandler,
} from './request.controller';

const router = Router();

// Citizen routes
router.post('/', authenticate, createRequestHandler);
router.get('/mine', authenticate, getMyRequestsHandler);

// Stats — NGO and Super Admin only
router.get(
  '/stats',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  getStatsHandler
);

// NGO/Admin — get all pending requests
router.get(
  '/',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  getAllRequestsHandler
);

// Update status — NGO and Super Admin only
router.patch(
  '/:id/status',
  authenticate,
  authorize('NGO_ADMIN', 'SUPER_ADMIN'),
  updateStatusHandler
);

// Get single request — any authenticated user (service handles ownership check)
router.get('/:id', authenticate, getOneRequestHandler);

router.patch(
  '/:id/cancel',
  authenticate,
  cancelRequestHandler
);

router.post('/:id/comments', authenticate, addCommentHandler);
router.delete('/:id/comments/:commentId', authenticate, deleteCommentHandler);

export default router;