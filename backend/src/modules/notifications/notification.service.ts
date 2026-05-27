import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  body: string
) => {
  return prisma.notification.create({
    data: { userId, type, title, body },
  });
};

export const getMyNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { count };
};

export const markOneAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) throw new AppError('Notification not found', 404);
  if (notification.userId !== userId) throw new AppError('Forbidden', 403);

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { message: 'All notifications marked as read' };
};
