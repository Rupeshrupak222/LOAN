import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { calculateEmi } from '../finance/emi';
import { generateGeminiContent } from '../ai/gemini.service';
import { logAudit } from '../audit/audit.service';
import {
  HypotheticalInputs,
  SavedSimulationSnapshot,
  SimulationChangedCondition,
  SimulationRequest,
  SimulationResult,
  StateMetric,
} from './decision-simulator.types';

export class DecisionSimulatorService {
  private static instance: DecisionSimulatorService;

  // In-memory snapshot repository: id -> SavedSimulationSnapshot
  private readonly savedSnapshots = new Map<string, SavedSimulationSnapshot>();

  // In-memory cache of recent simulations: simulationId -> SimulationResult
  private readonly simulationCache = new Map<string, SimulationResult>();

  private constructor() {}

  public static getInstance(): DecisionSimulatorService {
    if (!DecisionSimulatorService.instance) {
      DecisionSimulatorService.instance = new DecisionSimulatorService();
    }
    return DecisionSimulatorService.instance;
  }

  /**
   * Runs a non-destructive What-If simulation against an existing loan application.
   */
  public async runSimulation(
    req: SimulationRequest,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<SimulationResult> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot execute decision simulations.');
    }

    const { applicationId, hypotheticalInputs } = req;
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            employmentDetails: true,
            documents: true,
            loans: true,
          },
        },
        product: true,
        eligibility: true,
        riskAssessment: true,
      },
    });

    if (!app) {
      throw new NotFoundError(`Loan application '${applicationId}' not found.`);
    }

    // 1. Establish Authoritative Actual State
    const actualAmount = Number(app.requestedAmount);
    const actualTenure = app.tenureMonths;
    const actualRate = Number(app.product.interestRate);
    const actualIncome = Number(app.customer.monthlyIncome || 0);
    const actualObligations = Number(app.customer.existingObligations || 0);

    const actualEmiCalc = calculateEmi(actualAmount, actualRate, actualTenure);
    const actualEmi = Number(actualEmiCalc.emi);
    const actualTotalRepayment = Number(actualEmiCalc.totalRepayment);
    const actualTotalInterest = Number(actualEmiCalc.totalInterest);

    const actualTotalDebt = actualObligations + actualEmi;
    const actualFoir = actualIncome > 0 ? Number(((actualTotalDebt / actualIncome) * 100).toFixed(1)) : 100;

    const actualEligibilityResult = app.eligibility?.result || (actualFoir <= 55 ? 'ELIGIBLE' : 'NOT_ELIGIBLE');
    const actualEligibilityScore = app.eligibility?.factors
      ? Math.max(20, 100 - (actualFoir > 55 ? 40 : 0))
      : 75;

    const actualRiskScore = app.riskAssessment?.score ?? 70;
    const actualRiskCategory = app.riskAssessment?.category || (actualRiskScore >= 75 ? 'LOW' : actualRiskScore >= 45 ? 'MEDIUM' : 'HIGH');

    // 2. Establish Simulated State (Hypothetical)
    const simAmount = hypotheticalInputs.requestedAmount !== undefined ? Number(hypotheticalInputs.requestedAmount) : actualAmount;
    const simTenure = hypotheticalInputs.tenureMonths !== undefined ? Number(hypotheticalInputs.tenureMonths) : actualTenure;
    const simRate = hypotheticalInputs.interestRatePct !== undefined ? Number(hypotheticalInputs.interestRatePct) : actualRate;
    const simIncome = hypotheticalInputs.monthlyIncome !== undefined ? Number(hypotheticalInputs.monthlyIncome) : actualIncome;
    const simObligations = hypotheticalInputs.existingObligations !== undefined ? Number(hypotheticalInputs.existingObligations) : actualObligations;

    const simEmiCalc = calculateEmi(simAmount, simRate, simTenure);
    const simEmi = Number(simEmiCalc.emi);
    const simTotalRepayment = Number(simEmiCalc.totalRepayment);
    const simTotalInterest = Number(simEmiCalc.totalInterest);

    const simTotalDebt = simObligations + simEmi;
    const simFoir = simIncome > 0 ? Number(((simTotalDebt / simIncome) * 100).toFixed(1)) : 100;

    // 3. Simulated Deterministic Eligibility Evaluation
    let simFails = 0;
    let simWarnings = 0;

    if (simFoir > 55) {
      simFails++;
    } else if (simFoir > 45) {
      simWarnings++;
    }

    const minRequiredIncome = app.product.productType === 'BUSINESS' ? 50000 : 25000;
    if (simIncome < minRequiredIncome) {
      simFails++;
    }

    let simEligibilityResult: 'ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'NOT_ELIGIBLE' = 'ELIGIBLE';
    if (simFails > 0) simEligibilityResult = 'NOT_ELIGIBLE';
    else if (simWarnings > 0) simEligibilityResult = 'CONDITIONALLY_ELIGIBLE';

    const simEligibilityScore = Math.max(10, Math.min(100, 100 - simFails * 35 - simWarnings * 15));

    // 4. Simulated Deterministic Risk Scoring (4-Pillar Model)
    // Pillar A: Employment Stability (Vintage)
    const expYears = app.customer.employmentDetails[0]?.workExperienceYears || 2;
    let empScore = expYears >= 5 ? 95 : expYears >= 2 ? 80 : 50;

    // Pillar B: Debt Service Capacity (FOIR)
    let dtiScore = 60;
    const simDtiRatio = simFoir / 100;
    if (simDtiRatio <= 0.25) dtiScore = 95;
    else if (simDtiRatio <= 0.45) dtiScore = 75;
    else if (simDtiRatio <= 0.6) dtiScore = 55;
    else dtiScore = 30;

    // Pillar C: Document Completeness
    const docScore = app.customer.kycStatus === 'VERIFIED' ? 90 : 65;

    // Pillar D: Credit Repayment Track
    const overdueLoans = app.customer.loans.filter((l) => l.status === 'OVERDUE');
    const creditScore = overdueLoans.length === 0 ? 85 : 40;

    const simRiskScore = Math.round(empScore * 0.25 + dtiScore * 0.3 + docScore * 0.2 + creditScore * 0.25);
    const simRiskCategory = simRiskScore >= 75 ? 'LOW' : simRiskScore >= 45 ? 'MEDIUM' : 'HIGH';

    // 5. Build Comparative Metrics
    const metrics: SimulationResult['metrics'] = {
      requestedAmount: {
        actual: actualAmount,
        simulated: simAmount,
        delta: simAmount - actualAmount,
        improved: simAmount < actualAmount,
      },
      tenureMonths: {
        actual: actualTenure,
        simulated: simTenure,
        delta: simTenure - actualTenure,
        improved: simTenure !== actualTenure,
      },
      interestRatePct: {
        actual: actualRate,
        simulated: simRate,
        delta: Number((simRate - actualRate).toFixed(2)),
        improved: simRate < actualRate,
      },
      monthlyIncome: {
        actual: actualIncome,
        simulated: simIncome,
        delta: simIncome - actualIncome,
        improved: simIncome > actualIncome,
      },
      existingObligations: {
        actual: actualObligations,
        simulated: simObligations,
        delta: simObligations - actualObligations,
        improved: simObligations < actualObligations,
      },
      emi: {
        actual: actualEmi,
        simulated: simEmi,
        delta: Number((simEmi - actualEmi).toFixed(2)),
        improved: simEmi < actualEmi,
      },
      totalInterest: {
        actual: actualTotalInterest,
        simulated: simTotalInterest,
        delta: Number((simTotalInterest - actualTotalInterest).toFixed(2)),
        improved: simTotalInterest < actualTotalInterest,
      },
      totalRepayment: {
        actual: actualTotalRepayment,
        simulated: simTotalRepayment,
        delta: Number((simTotalRepayment - actualTotalRepayment).toFixed(2)),
        improved: simTotalRepayment < actualTotalRepayment,
      },
      foirPercent: {
        actual: actualFoir,
        simulated: simFoir,
        delta: Number((simFoir - actualFoir).toFixed(1)),
        improved: simFoir < actualFoir,
      },
      eligibilityResult: {
        actual: actualEligibilityResult,
        simulated: simEligibilityResult,
        delta: `${actualEligibilityResult} -> ${simEligibilityResult}`,
        improved:
          (actualEligibilityResult === 'NOT_ELIGIBLE' && simEligibilityResult !== 'NOT_ELIGIBLE') ||
          (actualEligibilityResult === 'CONDITIONALLY_ELIGIBLE' && simEligibilityResult === 'ELIGIBLE'),
      },
      eligibilityScore: {
        actual: actualEligibilityScore,
        simulated: simEligibilityScore,
        delta: simEligibilityScore - actualEligibilityScore,
        improved: simEligibilityScore > actualEligibilityScore,
      },
      riskScore: {
        actual: actualRiskScore,
        simulated: simRiskScore,
        delta: simRiskScore - actualRiskScore,
        improved: simRiskScore > actualRiskScore,
      },
      riskCategory: {
        actual: actualRiskCategory,
        simulated: simRiskCategory,
        delta: `${actualRiskCategory} -> ${simRiskCategory}`,
        improved:
          (actualRiskCategory === 'HIGH' && simRiskCategory !== 'HIGH') ||
          (actualRiskCategory === 'MEDIUM' && simRiskCategory === 'LOW'),
      },
    };

    // 6. Changed Conditions & Warnings
    const changedConditions: SimulationChangedCondition[] = [];
    const warnings: string[] = [];

    if (simFoir < actualFoir) {
      changedConditions.push({
        condition: 'FOIR & Debt Service Capacity',
        impact: 'POSITIVE',
        detail: `FOIR decreases by ${Math.abs(Number(metrics.foirPercent.delta))}% from ${actualFoir}% to ${simFoir}%, expanding borrower cash buffer.`,
      });
    } else if (simFoir > actualFoir) {
      changedConditions.push({
        condition: 'FOIR & Debt Service Capacity',
        impact: 'NEGATIVE',
        detail: `FOIR increases by ${metrics.foirPercent.delta}% from ${actualFoir}% to ${simFoir}%, increasing monthly debt stress.`,
      });
    }

    if (simFoir > 55) {
      warnings.push(`Simulated FOIR (${simFoir}%) breaches standard 55% policy ceiling.`);
    }

    if (simTotalInterest > actualTotalInterest) {
      changedConditions.push({
        condition: 'Cumulative Interest Cost',
        impact: 'NEUTRAL',
        detail: `Extended repayment period increases total borrower interest payout by INR ${Math.round(simTotalInterest - actualTotalInterest).toLocaleString('en-IN')}.`,
      });
    } else if (simTotalInterest < actualTotalInterest) {
      changedConditions.push({
        condition: 'Cumulative Interest Cost',
        impact: 'POSITIVE',
        detail: `Total borrower interest payout decreases by INR ${Math.round(actualTotalInterest - simTotalInterest).toLocaleString('en-IN')}.`,
      });
    }

    if (simRiskScore > actualRiskScore) {
      changedConditions.push({
        condition: 'Credit Risk Model Category',
        impact: 'POSITIVE',
        detail: `Credit risk score improves by ${simRiskScore - actualRiskScore} points (${actualRiskCategory} -> ${simRiskCategory}).`,
      });
    }

    // 7. Simulation ID & Result Assembly
    const simulationId = `SIM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const result: SimulationResult = {
      simulationId,
      applicationId: app.id,
      applicationNo: app.applicationNo,
      customerName: `${app.customer.firstName} ${app.customer.lastName}`,
      simulatedAt: new Date().toISOString(),
      isHypothetical: true,
      metrics,
      changedConditions,
      warnings,
    };

    // 8. Centralized Gemini Advisory Synthesis
    result.aiExplanation = await this.synthesizeSimulationAdvisory(result);

    // Cache in memory for quick save
    this.simulationCache.set(simulationId, result);

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'SIMULATION_EXECUTED',
      entity: 'LoanApplication',
      entityId: applicationId,
      newValue: {
        simulationId,
        hypotheticalInputs,
        simFoir,
        simEmi,
      },
    }).catch(() => {});

    return result;
  }

  /**
   * Saves a simulation snapshot for future underwriting review.
   */
  public async saveSimulation(
    simulationId: string,
    name: string,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<SavedSimulationSnapshot> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot save decision simulations.');
    }

    const cached = this.simulationCache.get(simulationId);
    if (!cached) {
      throw new NotFoundError(`Simulation '${simulationId}' not found in active session cache.`);
    }

    const snapshotId = `SNAP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const snapshot: SavedSimulationSnapshot = {
      id: snapshotId,
      name: name.trim() || `What-If Scenario ${new Date().toLocaleDateString('en-IN')}`,
      applicationId: cached.applicationId,
      applicationNo: cached.applicationNo,
      customerName: cached.customerName,
      createdBy: actor.email,
      createdAt: new Date().toISOString(),
      assumptions: {
        requestedAmount: cached.metrics.requestedAmount.simulated,
        tenureMonths: cached.metrics.tenureMonths.simulated,
        interestRatePct: cached.metrics.interestRatePct.simulated,
        monthlyIncome: cached.metrics.monthlyIncome.simulated,
        existingObligations: cached.metrics.existingObligations.simulated,
      },
      result: cached,
    };

    this.savedSnapshots.set(snapshotId, snapshot);

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'SIMULATION_SAVED',
      entity: 'SavedSimulationSnapshot',
      entityId: snapshotId,
      newValue: { name: snapshot.name, applicationId: snapshot.applicationId },
    }).catch(() => {});

    return snapshot;
  }

  /**
   * Lists saved snapshots for an application.
   */
  public listSavedSimulations(applicationId: string, actor: { id: string; roles: string[] }): SavedSimulationSnapshot[] {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view decision simulations.');
    }

    return Array.from(this.savedSnapshots.values())
      .filter((s) => s.applicationId === applicationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Retrieves single snapshot by ID.
   */
  public getSavedSimulation(snapshotId: string, actor: { id: string; roles: string[] }): SavedSimulationSnapshot {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view decision simulations.');
    }

    const snapshot = this.savedSnapshots.get(snapshotId);
    if (!snapshot) {
      throw new NotFoundError(`Saved simulation snapshot '${snapshotId}' not found.`);
    }
    return snapshot;
  }

  /**
   * Synthesizes advisory explanation using Gemini with strict fallback.
   */
  private async synthesizeSimulationAdvisory(sim: SimulationResult) {
    const prompt = `
SIMULATION DELTA ANALYSIS:
Application: ${sim.applicationNo} (${sim.customerName})
Amount: INR ${sim.metrics.requestedAmount.actual.toLocaleString('en-IN')} -> INR ${sim.metrics.requestedAmount.simulated.toLocaleString('en-IN')} (Delta: ${sim.metrics.requestedAmount.delta})
Tenure: ${sim.metrics.tenureMonths.actual} mos -> ${sim.metrics.tenureMonths.simulated} mos
Rate: ${sim.metrics.interestRatePct.actual}% -> ${sim.metrics.interestRatePct.simulated}%
Monthly EMI: INR ${sim.metrics.emi.actual.toLocaleString('en-IN')} -> INR ${sim.metrics.emi.simulated.toLocaleString('en-IN')}
Total Interest: INR ${sim.metrics.totalInterest.actual.toLocaleString('en-IN')} -> INR ${sim.metrics.totalInterest.simulated.toLocaleString('en-IN')}
FOIR: ${sim.metrics.foirPercent.actual}% -> ${sim.metrics.foirPercent.simulated}%
Eligibility: ${sim.metrics.eligibilityResult.actual} -> ${sim.metrics.eligibilityResult.simulated}
Risk Score: ${sim.metrics.riskScore.actual} (${sim.metrics.riskCategory.actual}) -> ${sim.metrics.riskScore.simulated} (${sim.metrics.riskCategory.simulated})
Warnings: ${sim.warnings.join('; ') || 'None'}
`;

    const systemInstruction = `
You are the Chief Credit Underwriter AI for Adyapan Loan Management System.
Analyze this hypothetical What-If lending simulation scenario.
Provide:
1. Executive Summary (1-2 sentences on how the hypothetical structure changes loan viability).
2. Financial Tradeoffs (2 concise bullet points contrasting affordability vs overall cost).
3. Underwriter Takeaway (1 clear actionable recommendation for the credit officer).

Return ONLY valid JSON matching:
{
  "summary": "1-2 sentence executive appraisal of scenario viability.",
  "tradeoffs": ["Tradeoff 1", "Tradeoff 2"],
  "underwriterTakeaway": "Actionable recommendation for underwriter."
}
`;

    try {
      const response = await generateGeminiContent({
        prompt,
        systemInstruction,
        temperature: 0.1,
      });
      const cleaned = response.text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        summary: parsed.summary || 'Simulated parameters shift monthly obligations and debt-servicing ratios.',
        tradeoffs: Array.isArray(parsed.tradeoffs)
          ? parsed.tradeoffs
          : ['Lower EMI improves monthly affordability.', 'Longer tenure increases total interest outflow.'],
        underwriterTakeaway: parsed.underwriterTakeaway || 'Review borrower disposable income before approving restructured loan parameters.',
      };
    } catch {
      return {
        summary: `Adjusting requested loan amount to INR ${sim.metrics.requestedAmount.simulated.toLocaleString('en-IN')} shifts monthly EMI to INR ${sim.metrics.emi.simulated.toLocaleString('en-IN')} with FOIR at ${sim.metrics.foirPercent.simulated}%.`,
        tradeoffs: [
          `EMI changes by INR ${Math.abs(Number(sim.metrics.emi.delta)).toLocaleString('en-IN')}.`,
          `Total interest payout alters by INR ${Math.abs(Number(sim.metrics.totalInterest.delta)).toLocaleString('en-IN')}.`,
        ],
        underwriterTakeaway:
          sim.metrics.foirPercent.simulated <= 50
            ? 'Scenario comfortably satisfies debt-service criteria and qualifies for standard credit sanction.'
            : 'Simulated commitments exceed ideal policy ceiling; consider secondary guarantor or tenure extension.',
      };
    }
  }

  public clearForTesting(): void {
    this.savedSnapshots.clear();
    this.simulationCache.clear();
  }
}

export const decisionSimulatorService = DecisionSimulatorService.getInstance();
