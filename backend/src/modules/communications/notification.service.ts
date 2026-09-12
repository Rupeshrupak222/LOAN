import {
  BorrowerNotification,
  CommunicationEventCode,
  CommunicationPriority,
  MessageCategory,
  StaffTaskNotification,
} from './communication.types';

export class NotificationService {
  private borrowerNotifications: Map<string, BorrowerNotification> = new Map();
  private staffNotifications: Map<string, StaffTaskNotification> = new Map();

  // ==========================================
  // BORROWER NOTIFICATION CENTER
  // ==========================================

  /**
   * Create a borrower in-app notification with customer-safe sanitization
   */
  public createBorrowerNotification(params: {
    tenantId: string;
    customerId: string;
    title: string;
    body: string;
    eventCode: CommunicationEventCode;
    category?: MessageCategory;
    priority?: CommunicationPriority;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }): BorrowerNotification {
    const id = `NOTIF_CUST_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const now = new Date().toISOString();

    // Sanitize metadata to strip out internal underwriting/risk/fraud properties
    const safeMetadata: Record<string, any> = {};
    if (params.metadata) {
      for (const [k, v] of Object.entries(params.metadata)) {
        if (
          !k.toLowerCase().includes('score') &&
          !k.toLowerCase().includes('risk') &&
          !k.toLowerCase().includes('fraud') &&
          !k.toLowerCase().includes('internal') &&
          !k.toLowerCase().includes('secret')
        ) {
          safeMetadata[k] = v;
        }
      }
    }

    const notif: BorrowerNotification = {
      id,
      tenantId: params.tenantId,
      customerId: params.customerId,
      title: params.title,
      body: params.body,
      eventCode: params.eventCode,
      category: params.category || 'TRANSACTIONAL',
      priority: params.priority || 'NORMAL',
      actionUrl: params.actionUrl,
      isRead: false,
      metadata: safeMetadata,
      createdAt: now,
    };

    this.borrowerNotifications.set(id, notif);
    return notif;
  }

  /**
   * Get borrower notification inbox with unread count
   */
  public getBorrowerNotifications(
    tenantId: string,
    customerId: string,
    filter?: { isRead?: boolean; limit?: number }
  ): {
    notifications: BorrowerNotification[];
    unreadCount: number;
    totalCount: number;
  } {
    const allForCustomer = Array.from(this.borrowerNotifications.values()).filter(
      (n) => n.tenantId === tenantId && n.customerId === customerId
    );

    const unreadCount = allForCustomer.filter((n) => !n.isRead).length;

    let filtered = allForCustomer;
    if (filter?.isRead !== undefined) {
      filtered = filtered.filter((n) => n.isRead === filter.isRead);
    }

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return {
      notifications: filtered,
      unreadCount,
      totalCount: allForCustomer.length,
    };
  }

  /**
   * Mark single borrower notification as read
   */
  public markBorrowerNotificationRead(
    tenantId: string,
    customerId: string,
    notificationId: string
  ): BorrowerNotification | undefined {
    const notif = this.borrowerNotifications.get(notificationId);
    if (!notif || notif.tenantId !== tenantId || notif.customerId !== customerId) {
      return undefined;
    }

    if (!notif.isRead) {
      notif.isRead = true;
      notif.readAt = new Date().toISOString();
      this.borrowerNotifications.set(notif.id, notif);
    }

    return notif;
  }

  /**
   * Mark all borrower notifications as read
   */
  public markAllBorrowerNotificationsRead(tenantId: string, customerId: string): number {
    let count = 0;
    const now = new Date().toISOString();

    for (const notif of this.borrowerNotifications.values()) {
      if (notif.tenantId === tenantId && notif.customerId === customerId && !notif.isRead) {
        notif.isRead = true;
        notif.readAt = now;
        this.borrowerNotifications.set(notif.id, notif);
        count++;
      }
    }

    return count;
  }

  // ==========================================
  // INTERNAL STAFF TASK & NOTIFICATION FEED
  // ==========================================

  /**
   * Create an internal staff alert / task notification
   */
  public createStaffNotification(params: {
    tenantId: string;
    userId?: string;
    roleTarget?: string;
    title: string;
    body: string;
    eventCode: CommunicationEventCode;
    priority?: CommunicationPriority;
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }): StaffTaskNotification {
    const id = `STAFF_NOTIF_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const now = new Date().toISOString();

    const notif: StaffTaskNotification = {
      id,
      tenantId: params.tenantId,
      userId: params.userId,
      roleTarget: params.roleTarget,
      title: params.title,
      body: params.body,
      eventCode: params.eventCode,
      priority: params.priority || 'NORMAL',
      entityType: params.entityType,
      entityId: params.entityId,
      actionUrl: params.actionUrl,
      isRead: false,
      isActioned: false,
      metadata: params.metadata,
      createdAt: now,
    };

    this.staffNotifications.set(id, notif);
    return notif;
  }

  /**
   * Get staff task notifications filtered by user ID or user role
   */
  public getStaffNotifications(params: {
    tenantId: string;
    userId?: string;
    userRole?: string;
    isRead?: boolean;
    isActioned?: boolean;
  }): {
    notifications: StaffTaskNotification[];
    pendingCount: number;
    totalCount: number;
  } {
    let list = Array.from(this.staffNotifications.values()).filter(
      (n) => n.tenantId === params.tenantId || params.tenantId === 'ALL'
    );

    if (params.userId || params.userRole) {
      list = list.filter((n) => {
        const matchesUser = params.userId && n.userId === params.userId;
        const matchesRole = params.userRole && n.roleTarget === params.userRole;
        const isBroadcast = !n.userId && !n.roleTarget;
        return matchesUser || matchesRole || isBroadcast;
      });
    }

    const pendingCount = list.filter((n) => !n.isActioned).length;

    if (params.isRead !== undefined) {
      list = list.filter((n) => n.isRead === params.isRead);
    }
    if (params.isActioned !== undefined) {
      list = list.filter((n) => n.isActioned === params.isActioned);
    }

    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      notifications: list,
      pendingCount,
      totalCount: list.length,
    };
  }

  /**
   * Mark staff notification as read
   */
  public markStaffNotificationRead(notificationId: string): StaffTaskNotification | undefined {
    const notif = this.staffNotifications.get(notificationId);
    if (!notif) return undefined;

    notif.isRead = true;
    notif.readAt = new Date().toISOString();
    this.staffNotifications.set(notif.id, notif);
    return notif;
  }

  /**
   * Mark staff task as actioned / resolved
   */
  public markStaffNotificationActioned(notificationId: string): StaffTaskNotification | undefined {
    const notif = this.staffNotifications.get(notificationId);
    if (!notif) return undefined;

    notif.isActioned = true;
    notif.actionedAt = new Date().toISOString();
    if (!notif.isRead) {
      notif.isRead = true;
      notif.readAt = notif.actionedAt;
    }
    this.staffNotifications.set(notif.id, notif);
    return notif;
  }
}

export const defaultNotificationService = new NotificationService();
