import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { createRequestSchema } from './request.schema';
import {
    createRequest,
    getMyRequests,
    getRequestById,
    getAllRequestsForNGO,
    cancelRequest,
} from './request.service'
import { AppError } from '../../middleware/errorHandler';
import prisma from '../../config/prisma';


import { sendSuccess } from '../../utils/apiResponse';
import { request } from 'node:http';
import { updateRequestStatus, getRequestStats } from './request.service';
import { send } from 'node:process';

export const createRequestHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const validatedData = createRequestSchema.parse(req.body);
        const request = await createRequest(req.user!.userId, validatedData);
        sendSuccess(res, request, 201);
    }
    catch (err) {
        next(err);
    }
};

export const getMyRequestsHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const requests = await getMyRequests(req.user!.userId);
        sendSuccess(res, requests);
    }
    catch (err) {
        next(err);
    }
};

export const getOneRequestHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = await getRequestById(
            req.params.id as string, // Added 'as string' to resolve the error
            req.user!.userId,
            req.user!.role
        );
        sendSuccess(res, request);
    }
    catch (err) {
        next(err);
    }
};

export const getAllRequestHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const requests = await getAllRequestsForNGO();
        sendSuccess(res, requests);
    }
    catch (err) {
        next(err);
    }
};

export const updateStatusHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { status, rejectionReason } = req.body;

        if (!status) {
            return next(new AppError('Status is required', 400));
        }

        const validStatuses = [
            'PENDING',
            'UNDER_REVIEW',
            'APPROVED',
            'REJECTED',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED',
        ];

        if (!validStatuses.includes(status)) {
            return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
        }

        //Get the NGO profile ID for this admin

        const ngoProfile = await prisma.nGO.findUnique({
            where: {userId: req.user!.userId},
        });

        if (!ngoProfile){
            return next(new AppError('NGO profile not found for this user',404));
        }

        const updated = await updateRequestStatus(
            req.params.id as string,
            status,
            ngoProfile.id,
            rejectionReason
        );

        sendSuccess(res,updated);



    }
    catch(err){
        next(err);
    }
};

export const getStatsHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const stats = await getRequestStats();
        sendSuccess(res,stats);
    }
    catch(err){
        next(err);
    }
};

export const cancelRequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const updated = await cancelRequest(req.params.id as string, req.user!.userId);
    sendSuccess(res, updated);
  } catch (err) { next(err); }
};