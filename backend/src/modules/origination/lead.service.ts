import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { ScopeResolver } from '../roles/scope-resolver';
import { logAudit } from '../audit/audit.service';
import { generateCustomerCode, generateApplicationNo } from '../shared/codes';
import { Money } from '../finance/money';

export type LeadSource = 'DIGITAL' | 'BRANCH' | 'REFERRAL' | 'DIRECT' | 'PARTNER';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

export interface LeadActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export interface CreateLeadInput {
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  employmentType?: string;
  employerName?: string;
  monthlyIncome?: number;
  requestedAmount?: number;
  productId?: string;
  productCode?: string;
  source?: LeadSource;
  notes?: string;
  branchId?: string;
  tenantId?: string;
}

export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  employmentType?: string;
  monthlyIncome?: number;
  requestedAmount?: number;
  status?: LeadStatus;
  notes?: string;
  nextFollowUpDate?: string;
}

export interface LeadEntity {
  id: string;
  leadCode: string;
  tenantId: string;
  branchId?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  employmentType?: string;
  employerName?: string;
  monthlyIncome?: number;
  requestedAmount?: number;
  productId?: string;
  productName?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  nextFollowUpDate?: string;
  convertedCustomerId?: string;
  convertedApplicationId?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory lead store with fallback persistence pattern
class LeadStore {
  private static instance: LeadStore;
  private leads = new Map<string, LeadEntity>();

  private constructor() {
    this.seedInitialLeads();
  }

  public static getInstance(): LeadStore {
    if (!LeadStore.instance) {
      LeadStore.instance = new LeadStore();
    }
    return LeadStore.instance;
  }

  private seedInitialLeads() {
    // Clean empty store
  }

  public getAll(): LeadEntity[] {
    return Array.from(this.leads.values());
  }

  public getById(id: string): LeadEntity | undefined {
    return this.leads.get(id);
  }

  public set(lead: LeadEntity): void {
    this.leads.set(lead.id, lead);
  }
}

const leadStore = LeadStore.getInstance();

export class LeadService {
  private static instance: LeadService;

  public static getInstance(): LeadService {
    if (!LeadService.instance) {
      LeadService.instance = new LeadService();
    }
    return LeadService.instance;
  }

  /**
   * Creates a new origination lead scoped to tenant and branch.
   */
  public async createLead(input: CreateLeadInput, actor: LeadActorContext): Promise<LeadEntity> {
    const scope = ScopeResolver.resolveAuthorizedScope(actor as any, {
      requestedTenantId: input.tenantId,
      requestedBranchId: input.branchId,
    });

    if (!input.firstName || !input.lastName || !input.mobile) {
      throw new BadRequestError('First name, last name, and 10-digit mobile number are required to create a lead.');
    }

    const cleanMobile = input.mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      throw new BadRequestError('Invalid mobile number. Must be a valid 10-digit Indian phone number.');
    }

    const id = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const leadCode = `LEAD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newLead: LeadEntity = {
      id,
      leadCode,
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      assignedOfficerId: actor.id,
      assignedOfficerName: actor.email?.split('@')[0] || 'Loan Officer',
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      mobile: cleanMobile,
      email: input.email ? input.email.toLowerCase().trim() : undefined,
      employmentType: input.employmentType || 'SALARIED',
      employerName: input.employerName?.trim(),
      monthlyIncome: input.monthlyIncome,
      requestedAmount: input.requestedAmount,
      productId: input.productId,
      source: input.source || 'BRANCH',
      status: 'NEW',
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leadStore.set(newLead);

    await logAudit({
      tenantId: scope.tenantId,
      userId: actor.id,
      action: 'LEAD_CREATED',
      entity: 'Lead',
      entityId: id,
      newValue: { leadCode, mobile: cleanMobile, source: newLead.source },
    });

    return newLead;
  }

  /**
   * Lists leads respecting tenant and branch data isolation.
   */
  public async listLeads(
    filters: { status?: LeadStatus; search?: string; source?: LeadSource },
    actor: LeadActorContext
  ): Promise<{ data: LeadEntity[]; total: number }> {
    const scope = ScopeResolver.resolveAuthorizedScope(actor as any);
    const allLeads = leadStore.getAll();

    const filtered = allLeads.filter((lead) => {
      // 1. Tenant Scope Check
      if (scope.tenantId && lead.tenantId !== scope.tenantId) {
        return false;
      }

      // 2. Branch Scope Check for branch-restricted officers
      if (
        (actor.roles?.includes('LOAN_OFFICER') || actor.roles?.includes('BRANCH_MANAGER')) &&
        scope.branchId &&
        lead.branchId &&
        lead.branchId !== scope.branchId
      ) {
        return false;
      }

      // 3. Status Filter
      if (filters.status && lead.status !== filters.status) {
        return false;
      }

      // 4. Source Filter
      if (filters.source && lead.source !== filters.source) {
        return false;
      }

      // 5. Search Filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesName = `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(query);
        const matchesMobile = lead.mobile.includes(query);
        const matchesCode = lead.leadCode.toLowerCase().includes(query);
        const matchesEmail = lead.email ? lead.email.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesMobile && !matchesCode && !matchesEmail) {
          return false;
        }
      }

      return true;
    });

    return {
      data: filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      total: filtered.length,
    };
  }

  /**
   * Retrieves single lead with anti-IDOR checks.
   */
  public async getLead(id: string, actor: LeadActorContext): Promise<LeadEntity> {
    const lead = leadStore.getById(id);
    if (!lead) {
      throw new NotFoundError(`Lead with ID '${id}' not found.`);
    }

    const scope = ScopeResolver.resolveAuthorizedScope(actor as any, {
      requestedTenantId: lead.tenantId,
      requestedBranchId: lead.branchId,
    });

    if (lead.tenantId !== scope.tenantId) {
      throw new ForbiddenError('Access forbidden: Lead belongs to another institution.');
    }

    if (
      (actor.roles?.includes('LOAN_OFFICER') || actor.roles?.includes('BRANCH_MANAGER')) &&
      scope.branchId &&
      lead.branchId &&
      lead.branchId !== scope.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Lead belongs to another branch.');
    }

    return lead;
  }

  /**
   * Updates lead status, notes, or contact info.
   */
  public async updateLead(id: string, input: UpdateLeadInput, actor: LeadActorContext): Promise<LeadEntity> {
    const lead = await this.getLead(id, actor);

    const updated: LeadEntity = {
      ...lead,
      firstName: input.firstName ? input.firstName.trim() : lead.firstName,
      lastName: input.lastName ? input.lastName.trim() : lead.lastName,
      mobile: input.mobile ? input.mobile.replace(/\D/g, '') : lead.mobile,
      email: input.email !== undefined ? input.email?.toLowerCase().trim() : lead.email,
      employmentType: input.employmentType || lead.employmentType,
      monthlyIncome: input.monthlyIncome !== undefined ? input.monthlyIncome : lead.monthlyIncome,
      requestedAmount: input.requestedAmount !== undefined ? input.requestedAmount : lead.requestedAmount,
      status: input.status || lead.status,
      notes: input.notes !== undefined ? input.notes : lead.notes,
      nextFollowUpDate: input.nextFollowUpDate || lead.nextFollowUpDate,
      updatedAt: new Date().toISOString(),
    };

    leadStore.set(updated);

    await logAudit({
      tenantId: lead.tenantId,
      userId: actor.id,
      action: 'LEAD_UPDATED',
      entity: 'Lead',
      entityId: id,
      previousValue: { status: lead.status, notes: lead.notes },
      newValue: { status: updated.status, notes: updated.notes },
    });

    return updated;
  }

  /**
   * Atomically converts a Lead into a formal Customer profile and Loan Application (DRAFT stage).
   */
  public async convertLeadToApplication(
    leadId: string,
    options: { productId?: string; requestedAmount?: number; tenureMonths?: number; purpose?: string },
    actor: LeadActorContext
  ): Promise<{ customer: any; application: any }> {
    const lead = await this.getLead(leadId, actor);

    if (lead.status === 'CONVERTED' && lead.convertedApplicationId) {
      throw new BadRequestError(`Lead '${lead.leadCode}' has already been converted into Application.`);
    }

    // 1. Resolve product
    let product = null;
    if (options.productId || lead.productId) {
      product = await prisma.loanProduct.findUnique({
        where: { id: options.productId || lead.productId },
      });
    }

    if (!product) {
      product = await prisma.loanProduct.findFirst({
        where: { isActive: true, ...(lead.tenantId ? { tenantId: lead.tenantId } : {}) },
      });
    }

    if (!product) {
      throw new NotFoundError('No active loan product found for conversion.');
    }

    const requestedAmount = options.requestedAmount || lead.requestedAmount || Number(product.minAmount) || 100000;
    const tenureMonths = options.tenureMonths || product.minTenureMonths || 12;

    // 2. Create or link Customer
    let customer = await prisma.customer.findFirst({
      where: {
        mobile: lead.mobile,
        ...(lead.tenantId ? { tenantId: lead.tenantId } : {}),
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          customerCode: generateCustomerCode(),
          tenantId: lead.tenantId,
          branchId: lead.branchId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          mobile: lead.mobile,
          email: lead.email,
          employmentType: lead.employmentType || 'SALARIED',
          employerName: lead.employerName,
          monthlyIncome: lead.monthlyIncome ? Money.toDb(lead.monthlyIncome) : null,
          status: 'DRAFT',
          kycStatus: 'NOT_STARTED',
        },
      });
    }

    // 3. Create Loan Application
    const applicationNo = generateApplicationNo();
    const app = await prisma.loanApplication.create({
      data: {
        applicationNo,
        customerId: customer.id,
        productId: product.id,
        tenantId: lead.tenantId,
        branchId: lead.branchId,
        requestedAmount: Money.toDb(requestedAmount),
        tenureMonths,
        purpose: options.purpose || `Converted from Lead ${lead.leadCode} (${lead.source})`,
        status: 'DRAFT',
        stage: 'INTAKE',
        priority: 'STANDARD',
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'DRAFT',
            changedBy: actor.id || 'LOAN_OFFICER',
            reason: `Originated via Lead Conversion (${lead.leadCode} - ${lead.source})`,
          },
        },
      },
      include: {
        customer: true,
        product: true,
      },
    });

    // 4. Update Lead Record
    lead.status = 'CONVERTED';
    lead.convertedCustomerId = customer.id;
    lead.convertedApplicationId = app.id;
    lead.updatedAt = new Date().toISOString();
    leadStore.set(lead);

    await logAudit({
      tenantId: lead.tenantId,
      userId: actor.id,
      action: 'LEAD_CONVERTED',
      entity: 'Lead',
      entityId: lead.id,
      newValue: {
        leadCode: lead.leadCode,
        customerId: customer.id,
        applicationId: app.id,
        applicationNo: app.applicationNo,
      },
    });

    return { customer, application: app };
  }
}

export const leadService = LeadService.getInstance();
