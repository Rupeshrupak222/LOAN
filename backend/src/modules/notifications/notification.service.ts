import { prisma } from '../../config/prisma';

export async function listNotifications(userId?: string, customerId?: string) {
  const where: any = {};
  if (userId) where.userId = userId;
  if (customerId) where.customerId = customerId;

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
}

export async function markAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function sendNotification(data: {
  userId?: string;
  customerId?: string;
  channel?: string;
  title: string;
  message: string;
  type?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      customerId: data.customerId,
      channel: data.channel || 'IN_APP',
      title: data.title,
      message: data.message,
      type: data.type || 'INFO',
    },
  });
}
