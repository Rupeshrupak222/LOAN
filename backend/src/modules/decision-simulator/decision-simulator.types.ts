export interface HypotheticalInputs {
  requestedAmount?: number;
  tenureMonths?: number;
  interestRatePct?: number;
  monthlyIncome?: number;
  existingObligations?: number;
}

export interface SimulationRequest {
  applicationId: string;
  hypotheticalInputs: HypotheticalInputs;
}

export interface StateMetric<T> {
  actual: T;
  simulated: T;
  delta: number | string;
  improved: boolean;
}

export interface SimulationChangedCondition {
  condition: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  detail: string;
}

export interface SimulationResult {
  simulationId: string;
  applicationId: string;
  applicationNo: string;
  customerName: string;
  simulatedAt: string;
  isHypothetical: true;
  metrics: {
    requestedAmount: StateMetric<number>;
    tenureMonths: StateMetric<number>;
    interestRatePct: StateMetric<number>;
    monthlyIncome: StateMetric<number>;
    existingObligations: StateMetric<number>;
    emi: StateMetric<number>;
    totalInterest: StateMetric<number>;
    totalRepayment: StateMetric<number>;
    foirPercent: StateMetric<number>;
    eligibilityResult: StateMetric<string>;
    eligibilityScore: StateMetric<number>;
    riskScore: StateMetric<number>;
    riskCategory: StateMetric<string>;
  };
  changedConditions: SimulationChangedCondition[];
  warnings: string[];
  aiExplanation?: {
    summary: string;
    tradeoffs: string[];
    underwriterTakeaway: string;
  };
}

export interface SavedSimulationSnapshot {
  id: string;
  name: string;
  applicationId: string;
  applicationNo: string;
  customerName: string;
  createdBy: string;
  createdAt: string;
  assumptions: HypotheticalInputs;
  result: SimulationResult;
}
