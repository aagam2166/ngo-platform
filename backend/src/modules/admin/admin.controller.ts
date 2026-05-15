import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/apiResponse';
import { getAllNGOs, approveNGO, revokeNGO } from './admin.service';

export const listNGOs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ngos = await getAllNGOs();
    sendSuccess(res, ngos);
  } catch (err) {
    next(err);
  }
};

export const approveNGOHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ngo = await approveNGO(req.params.id as string);
    sendSuccess(res, ngo);
  } catch (err) {
    next(err);
  }
};

export const revokeNGOHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ngo = await revokeNGO(req.params.id as string);
    sendSuccess(res, ngo);
  } catch (err) {
    next(err);
  }
};
