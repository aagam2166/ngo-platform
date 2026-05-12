import { Router } from 'express';
import { register, login, getMe } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// Public routes — no token needed
router.post('/register', register);
router.post('/login', login);

// Protected route — token required
router.get('/me', authenticate, getMe);

export default router;