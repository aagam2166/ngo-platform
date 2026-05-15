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
