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

export const updateRequestStatus = async (
  requestId: string,
  status: string,
  ngoId,
  rejectionReason?: string
) => {
  // Make sure request exists
  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new AppError('Request not found', 404);

  // Can't update a request that is already completed or cancelled
  if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
    throw new AppError(
      `Cannot update a request that is already ${request.status.toLowerCase()}`,
      400
    );
  }

  // Rejection requires a reason
  if (status === 'REJECTED' && !rejectionReason) {
    throw new AppError('Rejection reason is required when rejecting a request', 400);
  }

  return prisma.request.update({
    where: { id: requestId },
    data: {
      status: status as any,
      ngoId,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      reviewedAt: new Date(),
    },
    include: {
      citizen: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });
};

export const getRequestStats = async (ngoId?: string) => {
  // Count requests grouped by status
  const allStatuses = [
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ];

  const counts = await Promise.all(
    allStatuses.map((status) =>
      prisma.request.count({
        where: ngoId ? { status: status as any, ngoId } : { status: status as any },
      })
    )
  );

  const stats: Record<string, number> = {};
  allStatuses.forEach((status, i) => {
    stats[status] = counts[i];
  });

  stats.TOTAL = counts.reduce((sum, c) => sum + c, 0);

  return stats;
};

export const cancelRequest = async (requestId: string, userId: string) => {
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError('Request not found', 404);

  if (request.citizenId !== userId) {
    throw new AppError('You can only cancel your own requests', 403);
  }

  if (request.status !== 'PENDING') {
    throw new AppError(
      `Only PENDING requests can be cancelled. Current status: ${request.status}`,
      400
    );
  }

  return prisma.request.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' },
  });
};