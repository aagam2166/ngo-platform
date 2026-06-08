import { Router } from 'express';
import { register, login, getMe, devLogin } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// Public routes — no token needed
router.post('/register', register);
router.post('/login', login);
router.post('/dev-login', devLogin); // Development only - creates real JWT for mock users

// Protected route — token required
router.get('/me', authenticate, getMe);

export default router;