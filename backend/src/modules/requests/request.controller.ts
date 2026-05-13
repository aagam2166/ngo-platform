import {Response, NextFunction} from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { createRequestSchema } from './request.schema';
import {
    createRequest,
    getMyRequests,
    getRequestById,
    getAllRequestsForNGO,
} from './request.service'

import { sendSuccess } from '../../utils/apiResponse';
import { request } from 'node:http';

export const createRequestHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const validatedData = createRequestSchema.parse(req.body);
        const request = await createRequest(req.user!.userId, validatedData);
        sendSuccess(res,request,201);
    }
    catch(err){
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
        sendSuccess(res,requests);
    }
    catch(err){
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
        sendSuccess(res,requests);
    }
    catch(err){
        next(err);
    }
};