import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import {
  CreateResourceInput,
  UpdateResourceInput,
  AllocateResourceInput,
} from './resource.schema';

// Helper — get NGO profile or throw
const getNGOProfile = async (userId: string) => {
  const profile = await prisma.nGO.findUnique({ where: { userId } });
  if (!profile) throw new AppError('NGO profile not found', 404);
  return profile;
};

// ─────────────────────────────────────────────
// INVENTORY CRUD
// ─────────────────────────────────────────────

export const createResource = async (userId: string, data: CreateResourceInput) => {
  const ngo = await getNGOProfile(userId);
  return prisma.resource.create({
    data: { ...data, ngoId: ngo.id },
  });
};

export const getNGOResources = async (userId: string) => {
  const ngo = await getNGOProfile(userId);
  return prisma.resource.findMany({
    where: { ngoId: ngo.id },
    include: {
      _count: { select: { allocations: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateResource = async (
  id: string,
  userId: string,
  data: UpdateResourceInput
) => {
  const ngo = await getNGOProfile(userId);
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) throw new AppError('Resource not found', 404);
  if (resource.ngoId !== ngo.id) throw new AppError('Forbidden', 403);

  return prisma.resource.update({
    where: { id },
    data,
  });
};

export const deleteResource = async (id: string, userId: string) => {
  const ngo = await getNGOProfile(userId);
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: { _count: { select: { allocations: true } } },
  });
  if (!resource) throw new AppError('Resource not found', 404);
  if (resource.ngoId !== ngo.id) throw new AppError('Forbidden', 403);

  // Block deletion if resource has been allocated to any request
  if (resource._count.allocations > 0) {
    throw new AppError(
      `Cannot delete — this resource has been allocated to ${resource._count.allocations} request(s). Remove allocations first.`,
      400
    );
  }

  return prisma.resource.delete({ where: { id } });
};

// ─────────────────────────────────────────────
// ALLOCATION
// ─────────────────────────────────────────────

export const allocateResource = async (
  resourceId: string,
  userId: string,
  data: AllocateResourceInput
) => {
  const ngo = await getNGOProfile(userId);

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new AppError('Resource not found', 404);
  if (resource.ngoId !== ngo.id) throw new AppError('You can only allocate your own resources', 403);

  const request = await prisma.request.findUnique({ where: { id: data.requestId } });
  if (!request) throw new AppError('Request not found', 404);

  // Request must belong to this NGO
  if (request.ngoId !== ngo.id) {
    throw new AppError('You can only allocate resources to your own NGO requests', 403);
  }

  // Check sufficient quantity
  if (resource.quantity < data.quantity) {
    throw new AppError(
      `Insufficient quantity. Available: ${resource.quantity} ${resource.unit ?? ''}. Requested: ${data.quantity}`,
      400
    );
  }

  // Create allocation and deduct from inventory in a transaction
  const [allocation] = await prisma.$transaction([
    prisma.resourceAllocation.create({
      data: {
        resourceId,
        requestId: data.requestId,
        ngoId: ngo.id,
        quantity: data.quantity,
        notes: data.notes ?? null,
        allocatedBy: userId,
      },
      include: {
        resource: { select: { name: true, type: true, unit: true } },
        request: { select: { title: true } },
      },
    }),
    prisma.resource.update({
      where: { id: resourceId },
      data: { quantity: { decrement: data.quantity } },
    }),
  ]);

  return allocation;
};

export const deallocateResource = async (
  allocationId: string,
  userId: string
) => {
  const ngo = await getNGOProfile(userId);

  const allocation = await prisma.resourceAllocation.findUnique({
    where: { id: allocationId },
    include: { resource: true },
  });
  if (!allocation) throw new AppError('Allocation not found', 404);
  if (allocation.ngoId !== ngo.id) throw new AppError('Forbidden', 403);

  // Remove allocation and add quantity back in a transaction
  await prisma.$transaction([
    prisma.resourceAllocation.delete({ where: { id: allocationId } }),
    prisma.resource.update({
      where: { id: allocation.resourceId },
      data: { quantity: { increment: allocation.quantity } },
    }),
  ]);

  return { message: 'Allocation removed and quantity restored' };
};

export const getRequestAllocations = async (
  requestId: string,
  userId: string
) => {
  const ngo = await getNGOProfile(userId);

  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError('Request not found', 404);
  if (request.ngoId !== ngo.id) throw new AppError('Forbidden', 403);

  return prisma.resourceAllocation.findMany({
    where: { requestId, ngoId: ngo.id },
    include: {
      resource: { select: { name: true, type: true, unit: true } },
    },
    orderBy: { allocatedAt: 'desc' },
  });
};