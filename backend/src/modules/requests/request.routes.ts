import {Router} from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  createRequestHandler,
  getMyRequestsHandler,
  getOneRequestHandler,
  getAllRequestHandler,
} from './request.controller';

const router = Router();

// All routes require login

router.post('/',authenticate, createRequestHandler);
router.get('/mine', authenticate, getMyRequestsHandler);
router.get('/',authenticate, getAllRequestHandler);
router.get('/:id',authenticate, getOneRequestHandler);

export default router;
