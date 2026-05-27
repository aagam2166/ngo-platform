import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/apiResponse';
import {
  getMyNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
} from './notification.service';

export const getNotificationsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await getMyNotifications(req.user!.userId);
    sendSuccess(res, notifications);
  } catch (err) { next(err); }
};

export const getUnreadCountHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getUnreadCount(req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const markOneReadHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const notification = await markOneAsRead(req.params.id as string, req.user!.userId);
    sendSuccess(res, notification);
  } catch (err) { next(err); }
};

export const markAllReadHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await markAllAsRead(req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};
