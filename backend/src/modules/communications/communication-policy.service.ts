import * as crypto from 'crypto';
import {
  CommunicationChannel,
  CommunicationEventCode,
  CommunicationPolicy,
  CommunicationPriority,
  MessageCategory,
} from './communication.types';

export class CommunicationPolicyService {
  private policies: Map<string, CommunicationPolicy> = new Map();
  private idempotencyRegistry: Map<string, { createdAt: number; messageId: string }> = new Map();

  constructor() {
    this.seedDefaultPolicies();
  }

  /**
   * Generates a deterministic idempotency hash to prevent duplicate dispatches
   */
  public generateIdempotencyKey(params: {
    tenantId: string;
    eventCode: CommunicationEventCode;
    sourceEntityId: string;
    channel: CommunicationChannel;
    version?: number;
  }): string {
    const raw = `${params.tenantId}:${params.eventCode}:${params.sourceEntityId}:${params.channel}:v${params.version || 1}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Checks if an idempotency key is already recorded within its valid deduplication window
   */
  public checkIdempotency(
    key: string,
    dedupWindowMinutes: number = 60
  ): { isDuplicate: boolean; existingMessageId?: string } {
    const existing = this.idempotencyRegistry.get(key);
    if (!existing) {
      return { isDuplicate: false };
    }

    const now = Date.now();
    const ageMinutes = (now - existing.createdAt) / (1000 * 60);

    if (ageMinutes <= dedupWindowMinutes) {
      return { isDuplicate: true, existingMessageId: existing.messageId };
    }

    // Window expired, allow new
    this.idempotencyRegistry.delete(key);
    return { isDuplicate: false };
  }

  /**
   * Record a dispatched idempotency key
   */
  public recordIdempotency(key: string, messageId: string): void {
    this.idempotencyRegistry.set(key, {
      createdAt: Date.now(),
      messageId,
    });
  }

  /**
   * Evaluate if current time falls into quiet hours for a policy
   */
  public isQuietHours(
    policy: CommunicationPolicy,
    date: Date = new Date()
  ): boolean {
    if (!policy.quietHoursEnabled) return false;

    // Convert to tenant timezone (or UTC/IST default)
    const options: Intl.DateTimeFormatOptions = {
      timeZone: policy.timezone || 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    const timeString = new Intl.DateTimeFormat([], options).format(date);
    const [currH, currM] = timeString.split(':').map(Number);
    const currMinutes = currH * 60 + currM;

    const [startH, startM] = (policy.quietHoursStart || '22:00').split(':').map(Number);
    const [endH, endM] = (policy.quietHoursEnd || '08:00').split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Overnight range (e.g. 22:00 to 08:00)
    if (startMinutes > endMinutes) {
      return currMinutes >= startMinutes || currMinutes < endMinutes;
    } else {
      // Same day range (e.g. 13:00 to 14:00)
      return currMinutes >= startMinutes && currMinutes < endMinutes;
    }
  }

  /**
   * Checks if an event can bypass quiet hours (e.g. OTP, security alerts, fraud warnings, instant repayment acknowledgments)
   */
  public canBypassQuietHours(
    eventCode: CommunicationEventCode,
    category: MessageCategory,
    priority: CommunicationPriority
  ): boolean {
    if (priority === 'CRITICAL') return true;
    if (category === 'SECURITY') return true;
    if (
      eventCode === 'DISBURSEMENT_COMPLETED' ||
      eventCode === 'PAYMENT_COMPLETED' ||
      eventCode === 'RECOVERY_RECEIPT_ISSUED'
    ) {
      return true;
    }
    return false;
  }

  /**
   * Find policy for tenant + event
   */
  public getPolicyForEvent(
    tenantId: string,
    eventCode: CommunicationEventCode
  ): CommunicationPolicy {
    // 1. Check exact tenant policy
    const key = `${tenantId}:${eventCode}`;
    if (this.policies.has(key)) {
      return this.policies.get(key)!;
    }

    // 2. Check default platform policy for event
    const defaultKey = `DEFAULT:${eventCode}`;
    if (this.policies.has(defaultKey)) {
      return this.policies.get(defaultKey)!;
    }

    // 3. Fallback generic policy
    return {
      id: `POL_FALLBACK_${eventCode}`,
      tenantId,
      eventCode,
      primaryChannel: 'IN_APP',
      fallbackChannels: ['EMAIL', 'SMS'],
      priority: 'NORMAL',
      category: 'TRANSACTIONAL',
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'Asia/Kolkata',
      retryLimit: 3,
      retryBackoffSec: 60,
      dedupWindowMinutes: 30,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public savePolicy(policy: Omit<CommunicationPolicy, 'id' | 'createdAt' | 'updatedAt'>): CommunicationPolicy {
    const key = `${policy.tenantId}:${policy.eventCode}`;
    const id = this.policies.has(key)
      ? this.policies.get(key)!.id
      : `POL_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const now = new Date().toISOString();
    const saved: CommunicationPolicy = {
      ...policy,
      id,
      createdAt: this.policies.has(key) ? this.policies.get(key)!.createdAt : now,
      updatedAt: now,
    };

    this.policies.set(key, saved);
    return saved;
  }

  public listPolicies(tenantId?: string): CommunicationPolicy[] {
    let list = Array.from(this.policies.values());
    if (tenantId && tenantId !== 'ALL') {
      list = list.filter((p) => p.tenantId === tenantId || p.tenantId === 'DEFAULT');
    }
    return list;
  }

  private seedDefaultPolicies(): void {
    const defaults: Array<Omit<CommunicationPolicy, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        tenantId: 'DEFAULT',
        eventCode: 'WELCOME_MESSAGE',
        primaryChannel: 'SMS',
        fallbackChannels: ['EMAIL', 'IN_APP'],
        priority: 'NORMAL',
        category: 'TRANSACTIONAL',
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 2,
        retryBackoffSec: 30,
        dedupWindowMinutes: 120,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'KYC_COMPLETED',
        primaryChannel: 'SMS',
        fallbackChannels: ['PUSH', 'IN_APP'],
        priority: 'HIGH',
        category: 'TRANSACTIONAL',
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 3,
        retryBackoffSec: 60,
        dedupWindowMinutes: 60,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'APPLICATION_APPROVED',
        primaryChannel: 'WHATSAPP',
        fallbackChannels: ['SMS', 'PUSH', 'IN_APP'],
        priority: 'HIGH',
        category: 'TRANSACTIONAL',
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 3,
        retryBackoffSec: 60,
        dedupWindowMinutes: 60,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'APPLICATION_REJECTED',
        primaryChannel: 'SMS',
        fallbackChannels: ['EMAIL', 'IN_APP'],
        priority: 'NORMAL',
        category: 'TRANSACTIONAL',
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 2,
        retryBackoffSec: 120,
        dedupWindowMinutes: 180,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'DISBURSEMENT_COMPLETED',
        primaryChannel: 'SMS',
        fallbackChannels: ['WHATSAPP', 'EMAIL', 'PUSH', 'IN_APP'],
        priority: 'CRITICAL',
        category: 'TRANSACTIONAL',
        quietHoursEnabled: false, // Critical money movement bypasses quiet hours
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 4,
        retryBackoffSec: 30,
        dedupWindowMinutes: 360,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'UPCOMING_DUE_REMINDER',
        primaryChannel: 'SMS',
        fallbackChannels: ['WHATSAPP', 'PUSH', 'IN_APP'],
        priority: 'NORMAL',
        category: 'COLLECTION',
        quietHoursEnabled: true,
        quietHoursStart: '21:00', // Collections quiet hours per TRAI / RBI guidelines
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 2,
        retryBackoffSec: 180,
        dedupWindowMinutes: 720,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'PAYMENT_COMPLETED',
        primaryChannel: 'SMS',
        fallbackChannels: ['WHATSAPP', 'PUSH', 'IN_APP'],
        priority: 'HIGH',
        category: 'TRANSACTIONAL',
        quietHoursEnabled: false, // Instant receipt
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 3,
        retryBackoffSec: 30,
        dedupWindowMinutes: 180,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'PAYMENT_OVERDUE',
        primaryChannel: 'SMS',
        fallbackChannels: ['WHATSAPP', 'PUSH', 'EMAIL'],
        priority: 'HIGH',
        category: 'COLLECTION',
        quietHoursEnabled: true, // Non-harassment collection quiet hours
        quietHoursStart: '19:00', // 7pm to 8am strict collection quiet hours per RBI Fair Practices Code
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 2,
        retryBackoffSec: 300,
        dedupWindowMinutes: 720,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'TICKET_CREATED',
        primaryChannel: 'EMAIL',
        fallbackChannels: ['IN_APP', 'SMS'],
        priority: 'NORMAL',
        category: 'SUPPORT',
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 2,
        retryBackoffSec: 60,
        dedupWindowMinutes: 30,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'TICKET_REPLIED',
        primaryChannel: 'IN_APP',
        fallbackChannels: ['EMAIL', 'PUSH'],
        priority: 'NORMAL',
        category: 'SUPPORT',
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 2,
        retryBackoffSec: 60,
        dedupWindowMinutes: 30,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'UNDERWRITING_STARTED',
        primaryChannel: 'INTERNAL_NOTIFICATION',
        fallbackChannels: [],
        priority: 'HIGH',
        category: 'TRANSACTIONAL',
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 3,
        retryBackoffSec: 30,
        dedupWindowMinutes: 60,
        isActive: true,
      },
      {
        tenantId: 'DEFAULT',
        eventCode: 'COMPLAINT_REGISTERED',
        primaryChannel: 'SMS',
        fallbackChannels: ['EMAIL', 'IN_APP'],
        priority: 'HIGH',
        category: 'REGULATORY',
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata',
        retryLimit: 3,
        retryBackoffSec: 60,
        dedupWindowMinutes: 1440,
        isActive: true,
      },
    ];

    for (const p of defaults) {
      this.savePolicy(p);
    }
  }
}

export const defaultCommunicationPolicyService = new CommunicationPolicyService();
