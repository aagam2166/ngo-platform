import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateRequestInput } from './request.schema';

export const createRequest = async (citizenId: string, data: CreateRequestInput) => {
  return prisma.request.create({
    data: {
      ...data,
      citizenId,
    },
  });
};

export const getMyRequests = async (citizenId: string) => {
  return prisma.request.findMany({
    where: { citizenId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getRequestById = async (id: string, userId: string, role: string) => {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      citizen: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!request) throw new AppError('Request not found', 404);

  // Citizens can only see their own requests
  if (role === 'CITIZEN' && request.citizenId !== userId) {
    throw new AppError('You are not allowed to view this request', 403);
  }

  return request;
};

export const getAllRequestsForNGO = async () => {
  return prisma.request.findMany({
    where: {
      status: { in: ['PENDING', 'UNDER_REVIEW'] },
    },
    include: {
      citizen: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};