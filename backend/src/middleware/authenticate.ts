import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided. Please login first.', 401);
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // Verify and decode the token
    const decoded = verifyToken(token);

    // Attach user info to the request object
    req.user = decoded;

    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401));
    } else if (err.name === 'TokenExpiredError') {
      next(new AppError('Token has expired. Please login again.', 401));
    } else {
      next(err);
    }
  }
};