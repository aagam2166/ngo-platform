import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/apiResponse';
import {
  createResourceSchema,
  updateResourceSchema,
  allocateResourceSchema,
} from './resource.schema';
import {
  createResource,
  getNGOResources,
  updateResource,
  deleteResource,
  allocateResource,
  deallocateResource,
  getRequestAllocations,
} from './resource.service';

export const createResourceHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createResourceSchema.parse(req.body);
    const resource = await createResource(req.user!.userId, data);
    sendSuccess(res, resource, 201);
  } catch (err) { next(err); }
};

export const getResourcesHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const resources = await getNGOResources(req.user!.userId);
    sendSuccess(res, resources);
  } catch (err) { next(err); }
};

export const updateResourceHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = updateResourceSchema.parse(req.body);
    const resource = await updateResource(req.params.id as string, req.user!.userId, data);
    sendSuccess(res, resource);
  } catch (err) { next(err); }
};

export const deleteResourceHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteResource(req.params.id as string, req.user!.userId);
    sendSuccess(res, { message: 'Resource deleted' });
  } catch (err) { next(err); }
};

export const allocateResourceHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = allocateResourceSchema.parse(req.body);
    const allocation = await allocateResource(req.params.id as string, req.user!.userId, data);
    sendSuccess(res, allocation, 201);
  } catch (err) { next(err); }
};

export const deallocateResourceHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await deallocateResource(req.params.id as string, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const getRequestAllocationsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const allocations = await getRequestAllocations(req.params.requestId as string, req.user!.userId);
    sendSuccess(res, allocations);
  } catch (err) { next(err); }
};