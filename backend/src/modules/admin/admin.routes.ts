import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { listNGOs, approveNGOHandler, revokeNGOHandler } from './admin.controller';

const router = Router();

router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/ngos', listNGOs);
router.patch('/ngos/:id/approve', approveNGOHandler);
router.patch('/ngos/:id/revoke', revokeNGOHandler);

export default router;
