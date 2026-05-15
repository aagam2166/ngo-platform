import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/apiResponse';
import {
  getMyProfile,
  getRequestQueue,
  getMyNGORequests,
  acceptRequest,
  updateRequestStatus,
  updateStatusSchema,
} from './ngo.service';

export const getProfileHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await getMyProfile(req.user!.userId);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

export const getQueueHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requests = await getRequestQueue();
    sendSuccess(res, requests);
  } catch (err) {
    next(err);
  }
};

export const getMyRequestsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requests = await getMyNGORequests(req.user!.userId);
    sendSuccess(res, requests);
  } catch (err) {
    next(err);
  }
};

export const acceptRequestHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await acceptRequest(req.params.id as string, req.user!.userId);
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
};

export const updateStatusHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = updateStatusSchema.parse(req.body);
    const updated = await updateRequestStatus(req.params.id as string, validated, req.user!.userId);
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
};
