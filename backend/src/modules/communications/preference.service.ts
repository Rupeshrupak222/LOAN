import {
  CommunicationChannel,
  CustomerCommunicationPreference,
  LanguageCode,
  MessageCategory,
} from './communication.types';

export class CustomerPreferenceService {
  private preferences: Map<string, CustomerCommunicationPreference> = new Map();

  /**
   * Retrieves or creates default communication preferences for a customer
   */
  public getOrCreatePreference(
    tenantId: string,
    customerId: string,
    defaults?: Partial<CustomerCommunicationPreference>
  ): CustomerCommunicationPreference {
    const key = `${tenantId}:${customerId}`;
    if (this.preferences.has(key)) {
      return this.preferences.get(key)!;
    }

    const now = new Date().toISOString();
    const pref: CustomerCommunicationPreference = {
      id: `PREF_${customerId}`,
      tenantId,
      customerId,
      preferredLanguage: (defaults?.preferredLanguage as LanguageCode) || 'en-IN',
      channels: {
        SMS: true,
        EMAIL: true,
        WHATSAPP: true,
        PUSH: true,
        IN_APP: true,
        ...defaults?.channels,
      },
      categories: {
        TRANSACTIONAL: true, // Non-bypassable
        SECURITY: true,      // Non-bypassable
        COLLECTION: true,    // Non-bypassable (legal notices)
        MARKETING: defaults?.categories?.MARKETING ?? false,
        REMINDERS: defaults?.categories?.REMINDERS ?? true,
        SUPPORT: true,
        REGULATORY: true,    // Non-bypassable
        ...defaults?.categories,
      },
      optedOutChannels: defaults?.optedOutChannels || [],
      quietHoursCustom: defaults?.quietHoursCustom,
      updatedAt: now,
    };

    this.preferences.set(key, pref);
    return pref;
  }

  /**
   * Updates customer preferences with non-bypassable guardrails
   */
  public updatePreference(
    tenantId: string,
    customerId: string,
    updates: Partial<{
      preferredLanguage: LanguageCode;
      channels: Partial<Record<CommunicationChannel, boolean>>;
      categories: Partial<Record<MessageCategory, boolean>>;
      optedOutChannels: CommunicationChannel[];
      quietHoursCustom?: { enabled: boolean; start: string; end: string };
    }>
  ): CustomerCommunicationPreference {
    const current = this.getOrCreatePreference(tenantId, customerId);

    // Merge categories but enforce non-bypassable transactional & regulatory categories
    const mergedCategories = {
      ...current.categories,
      ...updates.categories,
      TRANSACTIONAL: true,
      SECURITY: true,
      COLLECTION: true,
      REGULATORY: true,
    };

    const mergedChannels = {
      ...current.channels,
      ...updates.channels,
      IN_APP: true, // In-App notification feed cannot be turned off entirely
    };

    const updated: CustomerCommunicationPreference = {
      ...current,
      preferredLanguage: updates.preferredLanguage || current.preferredLanguage,
      channels: mergedChannels,
      categories: mergedCategories,
      optedOutChannels: updates.optedOutChannels || current.optedOutChannels,
      quietHoursCustom: updates.quietHoursCustom !== undefined ? updates.quietHoursCustom : current.quietHoursCustom,
      updatedAt: new Date().toISOString(),
    };

    const key = `${tenantId}:${customerId}`;
    this.preferences.set(key, updated);
    return updated;
  }

  /**
   * Checks if message can be sent to this customer on this channel and category
   */
  public canSend(params: {
    tenantId: string;
    customerId: string;
    channel: CommunicationChannel;
    category: MessageCategory;
  }): { allowed: boolean; reason?: string } {
    // In-App and Internal notifications are always permitted
    if (params.channel === 'IN_APP' || params.channel === 'INTERNAL_NOTIFICATION') {
      return { allowed: true };
    }

    // Critical non-bypassable categories: TRANSACTIONAL, SECURITY, REGULATORY, COLLECTION
    if (
      params.category === 'TRANSACTIONAL' ||
      params.category === 'SECURITY' ||
      params.category === 'REGULATORY' ||
      params.category === 'COLLECTION'
    ) {
      return { allowed: true };
    }

    const pref = this.getOrCreatePreference(params.tenantId, params.customerId);

    // Check category level opt-out
    if (pref.categories && pref.categories[params.category] === false) {
      return {
        allowed: false,
        reason: `Customer has opted out of '${params.category}' category messages`,
      };
    }

    // Check channel level opt-out
    if (pref.channels && pref.channels[params.channel] === false) {
      return {
        allowed: false,
        reason: `Customer has disabled '${params.channel}' channel delivery`,
      };
    }

    if (pref.optedOutChannels && pref.optedOutChannels.includes(params.channel)) {
      return {
        allowed: false,
        reason: `Channel '${params.channel}' is in customer's explicit opted-out list`,
      };
    }

    return { allowed: true };
  }

  public listPreferences(tenantId?: string): CustomerCommunicationPreference[] {
    let list = Array.from(this.preferences.values());
    if (tenantId && tenantId !== 'ALL') {
      list = list.filter((p) => p.tenantId === tenantId);
    }
    return list;
  }
}

export const defaultCustomerPreferenceService = new CustomerPreferenceService();
