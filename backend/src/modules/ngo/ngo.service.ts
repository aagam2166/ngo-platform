import { z } from 'zod';
import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export const updateStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

const getNGOByUserId = async (userId: string) => {
  const ngo = await prisma.nGO.findFirst({ where: { userId } });
  if (!ngo) throw new AppError('NGO profile not found for this account', 404);
  return ngo;
};

export const getMyProfile = async (userId: string) => {
  return getNGOByUserId(userId);
};

export const getRequestQueue = async () => {
  return prisma.request.findMany({
    where: { status: 'PENDING', ngoId: null },
    include: {
      citizen: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: [{ urgencyLevel: 'desc' }, { createdAt: 'asc' }],
  });
};

export const getMyNGORequests = async (userId: string) => {
  const ngo = await getNGOByUserId(userId);
  return prisma.request.findMany({
    where: { ngoId: ngo.id },
    include: {
      citizen: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

export const acceptRequest = async (requestId: string, userId: string) => {
  const ngo = await getNGOByUserId(userId);

  const req = await prisma.request.findUnique({ where: { id: requestId } });
  if (!req) throw new AppError('Request not found', 404);
  if (req.status !== 'PENDING') throw new AppError('Only PENDING requests can be accepted', 400);
  if (req.ngoId !== null) throw new AppError('This request has already been accepted by another NGO', 409);

  return prisma.request.update({
    where: { id: requestId },
    data: { ngoId: ngo.id, status: 'UNDER_REVIEW' },
    include: {
      citizen: { select: { firstName: true, lastName: true, email: true } },
    },
  });
};

export const updateRequestStatus = async (
  requestId: string,
  input: UpdateStatusInput,
  userId: string
) => {
  const ngo = await getNGOByUserId(userId);

  const req = await prisma.request.findUnique({ where: { id: requestId } });
  if (!req) throw new AppError('Request not found', 404);
  if (req.ngoId !== ngo.id) throw new AppError('You can only update requests assigned to your NGO', 403);

  return prisma.request.update({
    where: { id: requestId },
    data: { status: input.status },
    include: {
      citizen: { select: { firstName: true, lastName: true, email: true } },
    },
  });
};

export const returnRequestToQueue = async (
  requestId: string,
  userId: string
) => {
  const profile = await prisma.nGO.findUnique({ where: { userId } });
  if (!profile) throw new AppError('NGO profile not found', 404);

  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError('Request not found', 404);

  if (request.ngoId !== profile.id) {
    throw new AppError('You can only return requests assigned to your NGO', 403);
  }

  const returnable = ['UNDER_REVIEW', 'APPROVED'];
  if (!returnable.includes(request.status)) {
    throw new AppError(
      `Only UNDER_REVIEW or APPROVED requests can be returned. Current status: ${request.status}`,
      400
    );
  }

  return prisma.request.update({
    where: { id: requestId },
    data: {
      status: 'PENDING',
      ngoId: null,
      reviewedAt: null,
    },
  });
};