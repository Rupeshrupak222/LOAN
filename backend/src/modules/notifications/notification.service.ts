import { prisma } from '../../config/prisma';

export async function listNotifications(userId?: string, customerId?: string, roles: string[] = []) {
  const isSuperAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
  const isCustomer = roles.includes('CUSTOMER');

  const allNotifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Filter strictly by target user / customer / role
  const filtered = allNotifications.filter((n) => {
    // 1. Direct user match
    if (n.userId && n.userId === userId) return true;

    // 2. Direct customer match
    if (n.customerId && n.customerId === customerId) return true;

    // 3. Customer must ONLY see notifications for their customerId or userId
    if (isCustomer) return false;

    // 4. Role-specific match from metadata
    const meta = n.metadata as any;
    if (meta?.targetRoles && Array.isArray(meta.targetRoles)) {
      if (isSuperAdmin) return true;
      return meta.targetRoles.some((r: string) => roles.includes(r));
    }
    if (meta?.targetRole && typeof meta.targetRole === 'string') {
      if (isSuperAdmin) return true;
      return roles.includes(meta.targetRole);
    }

    // 5. Global staff notification (no userId and no customerId)
    if (!n.userId && !n.customerId) {
      return isSuperAdmin;
    }

    return false;
  });

  const items = filtered.slice(0, 50);
  const unreadCount = items.filter((n) => !n.isRead).length;

  return { items, unreadCount };
}

export async function markAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId?: string, customerId?: string, roles: string[] = []) {
  const { items } = await listNotifications(userId, customerId, roles);
  const unreadIds = items.filter((i) => !i.isRead).map((i) => i.id);
  if (unreadIds.length === 0) return { count: 0 };

  return prisma.notification.updateMany({
    where: {
      id: { in: unreadIds },
    },
    data: { isRead: true },
  });
}

export async function clearAllNotifications(userId?: string, customerId?: string, roles: string[] = []) {
  const { items } = await listNotifications(userId, customerId, roles);
  const ids = items.map((i) => i.id);
  if (ids.length === 0) return { count: 0 };

  return prisma.notification.deleteMany({
    where: {
      id: { in: ids },
    },
  });
}

export async function deleteNotification(id: string) {
  return prisma.notification.delete({
    where: { id },
  });
}

export async function sendNotification(data: {
  userId?: string;
  customerId?: string;
  channel?: string;
  title: string;
  message: string;
  type?: string;
  metadata?: any;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      customerId: data.customerId,
      channel: data.channel || 'IN_APP',
      title: data.title,
      message: data.message,
      type: data.type || 'INFO',
      metadata: data.metadata || undefined,
    },
  });
}

