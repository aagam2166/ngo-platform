import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import {
  listNGOs,
  approveNGOHandler,
  revokeNGOHandler,
  statsHandler,
  listUsersHandler,
  activateUserHandler,
  deactivateUserHandler,
} from './admin.controller';

const router = Router();

router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/stats', statsHandler);

router.get('/ngos', listNGOs);
router.patch('/ngos/:id/approve', approveNGOHandler);
router.patch('/ngos/:id/revoke', revokeNGOHandler);

router.get('/users', listUsersHandler);
router.patch('/users/:id/activate', activateUserHandler);
router.patch('/users/:id/deactivate', deactivateUserHandler);

export default router;
