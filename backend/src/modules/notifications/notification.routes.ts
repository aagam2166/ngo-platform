import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  getNotificationsHandler,
  getUnreadCountHandler,
  markOneReadHandler,
  markAllReadHandler,
  clearAllNotificationsHandler
} from './notification.controller';

const router = Router();

router.use(authenticate);

router.get('/', getNotificationsHandler);
router.get('/unread-count', getUnreadCountHandler);
router.patch('/read-all', markAllReadHandler);
router.patch('/:id/read', markOneReadHandler);
router.delete('/clear-all', authenticate, clearAllNotificationsHandler);

export default router;
