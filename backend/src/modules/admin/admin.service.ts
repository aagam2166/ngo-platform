import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export const getAllNGOs = async () => {
  return prisma.nGO.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          isActive: true,
        },
      },
      _count: {
        select: { requests: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const approveNGO = async (ngoId: string) => {
  const ngo = await prisma.nGO.findUnique({ where: { id: ngoId } });
  if (!ngo) throw new AppError('NGO not found', 404);

  return prisma.nGO.update({
    where: { id: ngoId },
    data: { isVerified: true },
  });
};

export const revokeNGO = async (ngoId: string) => {
  const ngo = await prisma.nGO.findUnique({ where: { id: ngoId } });
  if (!ngo) throw new AppError('NGO not found', 404);

  return prisma.nGO.update({
    where: { id: ngoId },
    data: { isVerified: false },
  });
};

export const getPlatformStats = async () => {
  const [
    totalUsers,
    usersByRole,
    totalRequests,
    requestsByStatus,
    totalNGOs,
    verifiedNGOs,
    totalVolunteers,
    totalResources,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
    prisma.request.count(),
    prisma.request.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.nGO.count(),
    prisma.nGO.count({ where: { isVerified: true } }),
    prisma.volunteer.count(),
    prisma.resource.count(),
  ]);

  return {
    users: {
      total: totalUsers,
      byRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count.id])),
    },
    requests: {
      total: totalRequests,
      byStatus: Object.fromEntries(requestsByStatus.map((r) => [r.status, r._count.id])),
    },
    ngos: {
      total: totalNGOs,
      verified: verifiedNGOs,
      pending: totalNGOs - verifiedNGOs,
    },
    volunteers: totalVolunteers,
    resources: totalResources,
  };
};

export const getAllUsers = async (role?: string) => {
  return prisma.user.findMany({
    where: role ? { role: role as any } : undefined,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      phone: true,
      createdAt: true,
      _count: { select: { requests: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const activateUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  return prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });
};

export const deactivateUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'SUPER_ADMIN') throw new AppError('Cannot deactivate a super admin', 400);

  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });
};
