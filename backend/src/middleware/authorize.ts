import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { AppError } from './errorHandler';

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Not authenticated', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
                    403
                )
            );
        }

        next();
    };
};