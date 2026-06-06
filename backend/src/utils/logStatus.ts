import prisma from '../config/prisma';

export const logStatus = (
  requestId: string,
  status: string,
  changedBy: string,
  note?: string
) => {
  return prisma.requestStatusLog.create({
    data: { requestId, status, changedBy, note: note ?? null },
  });
};
