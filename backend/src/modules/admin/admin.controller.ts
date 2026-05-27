import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/apiResponse';
import {
  getAllNGOs,
  approveNGO,
  revokeNGO,
  getPlatformStats,
  getAllUsers,
  activateUser,
  deactivateUser,
} from './admin.service';

export const listNGOs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ngos = await getAllNGOs();
    sendSuccess(res, ngos);
  } catch (err) { next(err); }
};

export const approveNGOHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ngo = await approveNGO(req.params.id as string);
    sendSuccess(res, ngo);
  } catch (err) { next(err); }
};

export const revokeNGOHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ngo = await revokeNGO(req.params.id as string);
    sendSuccess(res, ngo);
  } catch (err) { next(err); }
};

export const statsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getPlatformStats();
    sendSuccess(res, stats);
  } catch (err) { next(err); }
};

export const listUsersHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as string | undefined;
    const users = await getAllUsers(role);
    sendSuccess(res, users);
  } catch (err) { next(err); }
};

export const activateUserHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await activateUser(req.params.id as string);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};

export const deactivateUserHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await deactivateUser(req.params.id as string);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};
