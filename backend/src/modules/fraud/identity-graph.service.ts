import { v4 as uuid } from 'uuid';
import {
  IdentityGraphCluster,
  IdentityGraphNode,
  IdentityGraphEdge,
  FraudSignalSeverity,
  FraudSignalItem,
} from './fraud.types';
import { prisma } from '../../config/prisma';

export interface EntityRegistrationPayload {
  customerId: string;
  customerCode?: string;
  customerName: string;
  tenantId: string;
  pan?: string;
  mobile?: string;
  email?: string;
  bankAccount?: string;
  deviceId?: string;
  ipAddress?: string;
  partnerId?: string;
}

export class IdentityGraphService {
  private static instance: IdentityGraphService;

  // In-memory cluster registry for fast multi-tenant graph lookups
  private readonly entityRegistry = new Map<string, EntityRegistrationPayload[]>();

  private constructor() {
    this.seedCanonicalGraph('tenant-adyapan-default');
    this.seedCanonicalGraph('tenant-apex-nbfc');
  }

  public static getInstance(): IdentityGraphService {
    if (!IdentityGraphService.instance) {
      IdentityGraphService.instance = new IdentityGraphService();
    }
    return IdentityGraphService.instance;
  }

  public seedCanonicalGraph(tenantId: string): void {
    const seedRecords: EntityRegistrationPayload[] = [
      {
        customerId: 'cust-demo-001',
        customerCode: 'CUST-001',
        customerName: 'Aarav Sharma',
        tenantId,
        pan: 'ABCPS1234F',
        mobile: '+919876543210',
        email: 'aarav.sharma@example.com',
        bankAccount: 'HDFC0001928374',
        deviceId: 'dev-fingerprint-001',
        ipAddress: '103.21.14.88',
        partnerId: 'partner-fintech-demo',
      },
      {
        customerId: 'cust-demo-002',
        customerCode: 'CUST-002',
        customerName: 'Rohan Verma',
        tenantId,
        pan: 'XYZPV9876K',
        mobile: '+919876543211',
        email: 'rohan.verma@example.com',
        bankAccount: 'HDFC0001928374', // Shared Bank Account with cust-001 (High Risk Link)
        deviceId: 'dev-fingerprint-002',
        ipAddress: '103.21.14.88', // Shared IP
        partnerId: 'partner-fintech-demo',
      },
      {
        customerId: 'cust-demo-003',
        customerCode: 'CUST-003',
        customerName: 'Priya Patel',
        tenantId,
        pan: 'JKLPP5432M',
        mobile: '+919876543212',
        email: 'priya.patel@example.com',
        bankAccount: 'ICIC0009876543',
        deviceId: 'dev-fingerprint-003',
        ipAddress: '103.45.67.89',
      },
      {
        customerId: 'cust-demo-fraud-syndicate-1',
        customerCode: 'CUST-SYND-01',
        customerName: 'Vikram Malhotra',
        tenantId,
        pan: 'MALPV1111A',
        mobile: '+919999900001',
        email: 'syndicate.user1@burner.co',
        bankAccount: 'SBIN0001122334',
        deviceId: 'dev-burner-device-X',
        ipAddress: '45.33.32.156',
      },
      {
        customerId: 'cust-demo-fraud-syndicate-2',
        customerCode: 'CUST-SYND-02',
        customerName: 'Sameer Khan',
        tenantId,
        pan: 'KHANS2222B',
        mobile: '+919999900002',
        email: 'syndicate.user2@burner.co',
        bankAccount: 'SBIN0001122334', // Shared account with syndicate 1
        deviceId: 'dev-burner-device-X', // Shared device with syndicate 1 (Critical link)
        ipAddress: '45.33.32.156', // Shared VPN IP
      },
    ];

    this.entityRegistry.set(tenantId, seedRecords);
  }

  public registerEntity(payload: EntityRegistrationPayload): void {
    const list = this.entityRegistry.get(payload.tenantId) || [];
    const existingIndex = list.findIndex((e) => e.customerId === payload.customerId);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...payload };
    } else {
      list.push(payload);
    }
    this.entityRegistry.set(payload.tenantId, list);
  }

  public buildCluster(
    tenantId: string,
    customerId: string,
    fallbackPayload?: Partial<EntityRegistrationPayload>
  ): IdentityGraphCluster {
    const records = this.entityRegistry.get(tenantId) || [];
    let currentRecord = records.find((r) => r.customerId === customerId);

    if (!currentRecord && fallbackPayload) {
      currentRecord = {
        customerId,
        customerName: fallbackPayload.customerName || 'Applicant',
        tenantId,
        pan: fallbackPayload.pan,
        mobile: fallbackPayload.mobile,
        email: fallbackPayload.email,
        bankAccount: fallbackPayload.bankAccount,
        deviceId: fallbackPayload.deviceId,
        ipAddress: fallbackPayload.ipAddress,
        partnerId: fallbackPayload.partnerId,
      };
      this.registerEntity(currentRecord);
    }

    if (!currentRecord) {
      currentRecord = {
        customerId,
        customerName: 'Customer',
        tenantId,
        mobile: '+919800000000',
      };
    }

    const nodes: IdentityGraphNode[] = [];
    const edges: IdentityGraphEdge[] = [];
    const nodeMap = new Map<string, IdentityGraphNode>();

    const addNode = (node: IdentityGraphNode) => {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
        nodes.push(node);
      }
    };

    const addEdge = (source: string, target: string, relation: string, severity: FraudSignalSeverity) => {
      const edgeId = `edge-${source}-${target}-${relation}`;
      if (!edges.some((e) => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          sourceNodeId: source,
          targetNodeId: target,
          relationType: relation,
          severity,
          discoveredAt: new Date().toISOString(),
        });
      }
    };

    // 1. Add Primary Customer Node
    const primaryCustNodeId = `node-cust-${currentRecord.customerId}`;
    addNode({
      id: primaryCustNodeId,
      type: 'CUSTOMER',
      label: currentRecord.customerName,
      value: currentRecord.customerId,
      isPrimary: true,
      metadata: { customerCode: currentRecord.customerCode },
    });

    // 2. Add Primary Entity Attribute Nodes
    if (currentRecord.pan) {
      const panNodeId = `node-pan-${currentRecord.pan}`;
      addNode({ id: panNodeId, type: 'PAN', label: 'PAN Card', value: currentRecord.pan });
      addEdge(primaryCustNodeId, panNodeId, 'OWNS_PAN', 'LOW');
    }

    if (currentRecord.mobile) {
      const mobNodeId = `node-mob-${currentRecord.mobile}`;
      addNode({ id: mobNodeId, type: 'MOBILE', label: 'Primary Mobile', value: currentRecord.mobile });
      addEdge(primaryCustNodeId, mobNodeId, 'REGISTERED_MOBILE', 'LOW');
    }

    if (currentRecord.email) {
      const emailNodeId = `node-email-${currentRecord.email}`;
      addNode({ id: emailNodeId, type: 'EMAIL', label: 'Contact Email', value: currentRecord.email });
      addEdge(primaryCustNodeId, emailNodeId, 'REGISTERED_EMAIL', 'LOW');
    }

    if (currentRecord.bankAccount) {
      const bankNodeId = `node-bank-${currentRecord.bankAccount}`;
      addNode({ id: bankNodeId, type: 'BANK_ACCOUNT', label: 'Disbursement Account', value: currentRecord.bankAccount });
      addEdge(primaryCustNodeId, bankNodeId, 'LINKED_BANK_ACCOUNT', 'LOW');
    }

    if (currentRecord.deviceId) {
      const devNodeId = `node-dev-${currentRecord.deviceId}`;
      addNode({ id: devNodeId, type: 'DEVICE', label: 'Device Fingerprint', value: currentRecord.deviceId });
      addEdge(primaryCustNodeId, devNodeId, 'ACCESSED_VIA_DEVICE', 'LOW');
    }

    if (currentRecord.ipAddress) {
      const ipNodeId = `node-ip-${currentRecord.ipAddress}`;
      addNode({ id: ipNodeId, type: 'IP', label: 'Origination IP', value: currentRecord.ipAddress });
      addEdge(primaryCustNodeId, ipNodeId, 'ORIGINATED_FROM_IP', 'LOW');
    }

    // 3. Scan other records in the same tenant to discover cross-entity links
    let linkedCustomersCount = 0;
    let linkedDevicesCount = 0;
    let linkedAccountsCount = 0;
    let linkedIpsCount = 0;
    let clusterRiskScore = 0;
    let maxSeverity: FraudSignalSeverity = 'LOW';

    const upgradeSeverity = (sev: FraudSignalSeverity) => {
      const rank: Record<FraudSignalSeverity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      if (rank[sev] > rank[maxSeverity]) {
        maxSeverity = sev;
      }
    };

    records.forEach((other) => {
      if (other.customerId === currentRecord.customerId) return;

      const otherCustNodeId = `node-cust-${other.customerId}`;
      let hasCrossLink = false;

      // Check Shared Bank Account (HIGH severity)
      if (currentRecord.bankAccount && other.bankAccount === currentRecord.bankAccount) {
        hasCrossLink = true;
        linkedAccountsCount++;
        clusterRiskScore += 35;
        upgradeSeverity('HIGH');

        const bankNodeId = `node-bank-${currentRecord.bankAccount}`;
        addNode({
          id: otherCustNodeId,
          type: 'CUSTOMER',
          label: other.customerName,
          value: other.customerId,
          metadata: { note: 'Shared Bank Account with Applicant' },
        });
        addEdge(otherCustNodeId, bankNodeId, 'SHARED_BANK_ACCOUNT', 'HIGH');
      }

      // Check Shared Device (CRITICAL severity if multiple customers on same device)
      if (currentRecord.deviceId && other.deviceId === currentRecord.deviceId) {
        hasCrossLink = true;
        linkedDevicesCount++;
        clusterRiskScore += 45;
        upgradeSeverity('CRITICAL');

        const devNodeId = `node-dev-${currentRecord.deviceId}`;
        addNode({
          id: otherCustNodeId,
          type: 'CUSTOMER',
          label: other.customerName,
          value: other.customerId,
          metadata: { note: 'Shared Hardware Fingerprint' },
        });
        addEdge(otherCustNodeId, devNodeId, 'SHARED_DEVICE_HARDWARE', 'CRITICAL');
      }

      // Check Shared Mobile / Email / PAN (CRITICAL identity reuse)
      if (currentRecord.pan && other.pan === currentRecord.pan) {
        hasCrossLink = true;
        clusterRiskScore += 50;
        upgradeSeverity('CRITICAL');

        const panNodeId = `node-pan-${currentRecord.pan}`;
        addNode({ id: otherCustNodeId, type: 'CUSTOMER', label: other.customerName, value: other.customerId });
        addEdge(otherCustNodeId, panNodeId, 'DUPLICATE_PAN_HOLDER', 'CRITICAL');
      }

      if (currentRecord.mobile && other.mobile === currentRecord.mobile) {
        hasCrossLink = true;
        clusterRiskScore += 25;
        upgradeSeverity('MEDIUM');

        const mobNodeId = `node-mob-${currentRecord.mobile}`;
        addNode({ id: otherCustNodeId, type: 'CUSTOMER', label: other.customerName, value: other.customerId });
        addEdge(otherCustNodeId, mobNodeId, 'SHARED_PHONE_NUMBER', 'MEDIUM');
      }

      // Check Shared IP
      if (currentRecord.ipAddress && other.ipAddress === currentRecord.ipAddress) {
        hasCrossLink = true;
        linkedIpsCount++;
        clusterRiskScore += 15;
        upgradeSeverity('MEDIUM');

        const ipNodeId = `node-ip-${currentRecord.ipAddress}`;
        addNode({ id: otherCustNodeId, type: 'CUSTOMER', label: other.customerName, value: other.customerId });
        addEdge(otherCustNodeId, ipNodeId, 'SHARED_ORIGINATION_IP', 'MEDIUM');
      }

      if (hasCrossLink) {
        linkedCustomersCount++;
      }
    });

    clusterRiskScore = Math.min(100, Math.max(0, clusterRiskScore));

    let clusterSummary = 'Clean entity cluster: No suspicious cross-profile identity or account linkages detected.';
    if (linkedCustomersCount > 0) {
      clusterSummary = `Cluster Alert: Linked with ${linkedCustomersCount} other customer profile(s) via ${linkedAccountsCount} shared bank account(s), ${linkedDevicesCount} shared device(s), and ${linkedIpsCount} shared network IP(s).`;
    }

    return {
      primaryCustomerId: currentRecord.customerId,
      nodes,
      edges,
      linkedCustomersCount,
      linkedDevicesCount,
      linkedAccountsCount,
      linkedIpsCount,
      clusterRiskScore,
      maxSeverity,
      clusterSummary,
    };
  }

  public extractGraphFraudSignals(cluster: IdentityGraphCluster): FraudSignalItem[] {
    const signals: FraudSignalItem[] = [];

    if (cluster.linkedAccountsCount > 0) {
      signals.push({
        id: 'fraud-sig-bank-reuse',
        code: 'FRAUD_BANK_ACCOUNT_REUSE',
        name: 'Shared Bank Account Reuse',
        category: 'BANK_ACCOUNT',
        actualValue: `${cluster.linkedAccountsCount} linked accounts across other borrowers`,
        thresholdValue: '0 linked accounts',
        severity: 'HIGH',
        scoreImpact: 35,
        reason: 'The applicant disbursement bank account is linked to multiple customer records.',
        recommendedAction: 'Trigger manual fraud verification and mandate cancelled cheque / bank passbook proof.',
      });
    }

    if (cluster.linkedDevicesCount > 0) {
      signals.push({
        id: 'fraud-sig-device-sharing',
        code: 'FRAUD_DEVICE_HARDWARE_SHARING',
        name: 'Shared Device Hardware Fingerprint',
        category: 'DEVICE',
        actualValue: `${cluster.linkedDevicesCount} linked borrower(s) on same hardware device`,
        thresholdValue: '1 customer per device',
        severity: 'CRITICAL',
        scoreImpact: 45,
        reason: 'Multiple loan applications originated from the exact same hardware device ID.',
        recommendedAction: 'Mandate live video KYC with geolocation verification or escalate to Fraud Investigator.',
      });
    }

    if (cluster.linkedIpsCount >= 3) {
      signals.push({
        id: 'fraud-sig-ip-velocity',
        code: 'FRAUD_HIGH_IP_VELOCITY',
        name: 'High Origination IP Velocity',
        category: 'NETWORK',
        actualValue: `${cluster.linkedIpsCount} profiles sharing identical IP address`,
        thresholdValue: '< 3 profiles per IP',
        severity: 'MEDIUM',
        scoreImpact: 20,
        reason: 'Elevated application density detected from this IP subnet.',
        recommendedAction: 'Verify geographical alignment between applicant residence and IP location.',
      });
    }

    return signals;
  }
}

export const identityGraphService = IdentityGraphService.getInstance();
