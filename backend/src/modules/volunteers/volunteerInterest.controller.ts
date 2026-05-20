import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import prisma from '../../config/prisma';
import {
  getOpenRequests,
  expressInterest,
  getMyInterests,
  withdrawInterest,
  getNGOInterests,
  approveInterest,
  rejectInterest,
} from './volunteerInterest.service';

// volunteer side

export const getOpenRequestsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const requests = await getOpenRequests(req.user!.userId);
    sendSuccess(res, requests);
  } catch (err) { next(err); }
};

export const expressInterestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message } = req.body;
    const result = await expressInterest(
      req.user!.userId,
      req.params.requestId as string,
      message
    );
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
};

export const getMyInterestsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const interests = await getMyInterests(req.user!.userId);
    sendSuccess(res, interests);
  } catch (err) { next(err); }
};


export const withdrawInterestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await withdrawInterest(req.params.id as string, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

//NGO side

const getNGOProfile = async (userId: string) => {
  const profile = await prisma.nGO.findUnique({ where: { userId } });
  if (!profile) throw new AppError('NGO profile not found', 404);
  return profile;
};

export const getNGOInterestsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await getNGOProfile(req.user!.userId);
    const status = req.query.status as string | undefined;
    const interests = await getNGOInterests(profile.id, status);
    sendSuccess(res, interests);
  } catch (err) { next(err); }
};

export const approveInterestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await getNGOProfile(req.user!.userId);
    const result = await approveInterest(
      req.params.id as string,
      profile.id,
      req.user!.userId
    );
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const rejectInterestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await getNGOProfile(req.user!.userId);
    const result = await rejectInterest(req.params.id as string, profile.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};


