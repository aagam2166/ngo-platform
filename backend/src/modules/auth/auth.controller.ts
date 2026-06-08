import { Request, Response, NextFunction } from 'express';
import { registerService, loginService, getMeService, devLoginService } from './auth.service';
import { registerSchema, loginSchema } from './auth.schema';
import { sendSuccess } from '../../utils/apiResponse';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await registerService(validatedData);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await loginService(validatedData);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const user = await getMeService(userId);
    sendSuccess(res, user, 200);
  } catch (err) {
    next(err);
  }
};

// Development-only endpoint for instant role switching
export const devLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = req.body;

    if (!role || !['CITIZEN', 'VOLUNTEER', 'NGO_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid or missing role. Must be one of: CITIZEN, VOLUNTEER, NGO_ADMIN, SUPER_ADMIN' });
    }

    const result = await devLoginService(role);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};