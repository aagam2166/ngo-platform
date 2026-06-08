import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import prisma from '../../config/prisma';
import {
  sendJoinRequest,
  searchVerifiedNGOs,
  getMyJoinRequests,
  withdrawJoinRequest,
  leaveNGORoster,
  getNGOJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from './volunteerJoinRequest.service';

// ── Volunteer side ────────────────────────────────────────────────────────

export const sendJoinRequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ngoId, message } = req.body;
    if (!ngoId) return next(new AppError('ngoId is required', 400));
    const result = await sendJoinRequest(req.user!.userId, ngoId, message);
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
};

export const searchNGOsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const name = req.query.name as string | undefined;
    const city = req.query.city as string | undefined;
    const ngos = await searchVerifiedNGOs(name, city);
    sendSuccess(res, ngos);
  } catch (err) { next(err); }
};

export const getMyJoinRequestsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const requests = await getMyJoinRequests(req.user!.userId);
    sendSuccess(res, requests);
  } catch (err) { next(err); }
};

export const withdrawJoinRequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await withdrawJoinRequest(req.params.id as string, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const leaveNGORosterHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ngoId } = req.params;
    const result = await leaveNGORoster(req.user!.userId, ngoId as string);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

// ── NGO side ──────────────────────────────────────────────────────────────

const getNGOProfile = async (userId: string) => {
  const profile = await prisma.nGO.findUnique({ where: { userId } });
  if (!profile) throw new AppError('NGO profile not found', 404);
  return profile;
};

export const getNGOJoinRequestsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await getNGOProfile(req.user!.userId);
    const status = req.query.status as string | undefined;
    const requests = await getNGOJoinRequests(profile.id, status);
    sendSuccess(res, requests);
  } catch (err) { next(err); }
};

export const approveJoinRequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await getNGOProfile(req.user!.userId);
    const result = await approveJoinRequest(req.params.id as string, profile.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const rejectJoinRequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await getNGOProfile(req.user!.userId);
    const result = await rejectJoinRequest(req.params.id as string, profile.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};