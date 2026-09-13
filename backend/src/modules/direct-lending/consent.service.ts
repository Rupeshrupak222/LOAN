import { prisma } from '../../config/prisma';
import { CustomerConsentInput } from './direct-lending.types';

export class ConsentService {
  /**
   * Records an immutable customer consent with timestamp, channel, version, and IP.
   */
  public async recordConsent(
    customerId: string,
    tenantId: string | undefined,
    input: CustomerConsentInput
  ) {
    return prisma.customerConsent.create({
      data: {
        customerId,
        tenantId,
        consentType: input.consentType,
        purpose: input.purpose,
        version: input.version || 'v1.0',
        channel: input.channel || 'DIRECT_WEB',
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        granted: true,
        grantedAt: new Date(),
      },
    });
  }

  /**
   * Retrieves all granted consents for a customer.
   */
  public async getCustomerConsents(customerId: string, tenantId?: string) {
    return prisma.customerConsent.findMany({
      where: {
        customerId,
        ...(tenantId ? { tenantId } : {}),
        granted: true,
        revokedAt: null,
      },
      orderBy: { grantedAt: 'desc' },
    });
  }

  /**
   * Validates if a customer has granted all required consent types.
   */
  public async validateConsents(
    customerId: string,
    requiredTypes: string[],
    tenantId?: string
  ): Promise<{ isValid: boolean; missingTypes: string[] }> {
    const grantedConsents = await prisma.customerConsent.findMany({
      where: {
        customerId,
        ...(tenantId ? { tenantId } : {}),
        consentType: { in: requiredTypes },
        granted: true,
        revokedAt: null,
      },
      select: { consentType: true },
    });

    const grantedSet = new Set(grantedConsents.map((c) => c.consentType));
    const missingTypes = requiredTypes.filter((t) => !grantedSet.has(t));

    return {
      isValid: missingTypes.length === 0,
      missingTypes,
    };
  }

  /**
   * Revokes a previously granted consent.
   */
  public async revokeConsent(
    consentId: string,
    customerId: string,
    tenantId?: string
  ) {
    return prisma.customerConsent.updateMany({
      where: {
        id: consentId,
        customerId,
        ...(tenantId ? { tenantId } : {}),
      },
      data: {
        granted: false,
        revokedAt: new Date(),
      },
    });
  }
}

export const consentService = new ConsentService();
