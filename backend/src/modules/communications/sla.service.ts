import {
  SupportCategory,
  SupportPriority,
  SupportSlaConfig,
  SupportTicket,
} from './communication.types';

export class SlaService {
  private slaConfigs: Map<string, SupportSlaConfig> = new Map();

  constructor() {
    this.seedDefaultSlaConfigs();
  }

  /**
   * Get applicable SLA configuration for a category and priority
   */
  public getSlaConfig(
    tenantId: string,
    category: SupportCategory,
    priority: SupportPriority
  ): SupportSlaConfig {
    // 1. Exact tenant + category + priority
    const key1 = `${tenantId}:${category}:${priority}`;
    if (this.slaConfigs.has(key1)) {
      return this.slaConfigs.get(key1)!;
    }

    // 2. Default tenant + category + priority
    const key2 = `DEFAULT:${category}:${priority}`;
    if (this.slaConfigs.has(key2)) {
      return this.slaConfigs.get(key2)!;
    }

    // 3. Fallback based on priority only
    const key3 = `DEFAULT:GENERAL_INQUIRY:${priority}`;
    if (this.slaConfigs.has(key3)) {
      return this.slaConfigs.get(key3)!;
    }

    // Default safe values
    return {
      id: `SLA_FALLBACK_${priority}`,
      tenantId,
      category,
      priority,
      firstResponseTargetHours: priority === 'URGENT' ? 1 : priority === 'HIGH' ? 2 : priority === 'MEDIUM' ? 4 : 8,
      resolutionTargetHours: priority === 'URGENT' ? 4 : priority === 'HIGH' ? 12 : priority === 'MEDIUM' ? 24 : 48,
      autoEscalateOnBreach: true,
      businessHoursOnly: false,
    };
  }

  /**
   * Calculates SLA due dates for a newly opened ticket
   */
  public calculateDueDates(
    tenantId: string,
    category: SupportCategory,
    priority: SupportPriority,
    openedAt: Date = new Date()
  ): {
    firstResponseDueAt: string;
    resolutionDueAt: string;
    firstResponseTargetHours: number;
    resolutionTargetHours: number;
  } {
    const config = this.getSlaConfig(tenantId, category, priority);

    const firstResponseDue = new Date(
      openedAt.getTime() + config.firstResponseTargetHours * 60 * 60 * 1000
    );
    const resolutionDue = new Date(
      openedAt.getTime() + config.resolutionTargetHours * 60 * 60 * 1000
    );

    return {
      firstResponseDueAt: firstResponseDue.toISOString(),
      resolutionDueAt: resolutionDue.toISOString(),
      firstResponseTargetHours: config.firstResponseTargetHours,
      resolutionTargetHours: config.resolutionTargetHours,
    };
  }

  /**
   * Evaluates current breach status and escalation level for an active ticket
   */
  public evaluateTicketSla(ticket: SupportTicket): {
    isResponseBreached: boolean;
    isResolutionBreached: boolean;
    escalationLevel: number;
    hoursToResolutionBreach: number;
  } {
    const now = Date.now();
    let isResponseBreached = ticket.sla.isResponseBreached;
    let isResolutionBreached = ticket.sla.isResolutionBreached;
    let escalationLevel = ticket.escalationLevel || 0;

    // Check response SLA
    if (!ticket.firstResponseAt) {
      const responseDueDate = new Date(ticket.sla.firstResponseDueAt).getTime();
      if (now > responseDueDate) {
        isResponseBreached = true;
      }
    }

    // Check resolution SLA
    const resolutionDueDate = new Date(ticket.sla.resolutionDueAt).getTime();
    const hoursToResolutionBreach = (resolutionDueDate - now) / (1000 * 60 * 60);

    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      if (now > resolutionDueDate) {
        isResolutionBreached = true;
        // Escalate to level 2 or 3 if severely breached
        const breachHours = (now - resolutionDueDate) / (1000 * 60 * 60);
        if (breachHours > 24) {
          escalationLevel = Math.max(escalationLevel, 2); // Grievance / Operations Lead
        } else {
          escalationLevel = Math.max(escalationLevel, 1); // Team Lead Alert
        }
      }
    }

    return {
      isResponseBreached,
      isResolutionBreached,
      escalationLevel,
      hoursToResolutionBreach,
    };
  }

  public saveSlaConfig(config: SupportSlaConfig): SupportSlaConfig {
    const key = `${config.tenantId}:${config.category}:${config.priority}`;
    this.slaConfigs.set(key, config);
    return config;
  }

  public listSlaConfigs(tenantId?: string): SupportSlaConfig[] {
    let list = Array.from(this.slaConfigs.values());
    if (tenantId && tenantId !== 'ALL') {
      list = list.filter((c) => c.tenantId === tenantId || c.tenantId === 'DEFAULT');
    }
    return list;
  }

  private seedDefaultSlaConfigs(): void {
    const categories: SupportCategory[] = [
      'LOAN_INQUIRY',
      'PAYMENT_DISPUTE',
      'KYC_ISSUE',
      'DISBURSEMENT_QUERY',
      'APP_TECHNICAL_ERROR',
      'FORECLOSURE_REQUEST',
      'FRAUD_REPORT',
      'GRIEVANCE_COMPLAINT',
      'GENERAL_INQUIRY',
    ];

    const priorities: SupportPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    for (const cat of categories) {
      for (const prio of priorities) {
        let firstRes = 4;
        let res = 24;

        if (cat === 'GRIEVANCE_COMPLAINT') {
          // RBI regulatory mandate: 24h response, 72h-168h resolution
          firstRes = prio === 'URGENT' ? 2 : 12;
          res = prio === 'URGENT' ? 24 : 72;
        } else if (cat === 'FRAUD_REPORT' || cat === 'PAYMENT_DISPUTE') {
          firstRes = prio === 'URGENT' ? 1 : prio === 'HIGH' ? 2 : 4;
          res = prio === 'URGENT' ? 6 : prio === 'HIGH' ? 12 : 24;
        } else if (prio === 'URGENT') {
          firstRes = 1;
          res = 4;
        } else if (prio === 'HIGH') {
          firstRes = 2;
          res = 8;
        } else if (prio === 'MEDIUM') {
          firstRes = 4;
          res = 24;
        } else if (prio === 'LOW') {
          firstRes = 8;
          res = 48;
        }

        const config: SupportSlaConfig = {
          id: `SLA_DEF_${cat}_${prio}`,
          tenantId: 'DEFAULT',
          category: cat,
          priority: prio,
          firstResponseTargetHours: firstRes,
          resolutionTargetHours: res,
          autoEscalateOnBreach: true,
          businessHoursOnly: false,
        };

        this.saveSlaConfig(config);
      }
    }
  }
}

export const defaultSlaService = new SlaService();
