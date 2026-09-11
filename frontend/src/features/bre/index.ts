// Business Rules Engine (BRE) Domain
export interface BreRuleRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  field: string;
  operator: string;
  value: any;
  severity: string;
  actionOnPass: string;
  actionOnFail: string;
  reasonCode: string;
}

export interface BrePolicyResult {
  verdict: string;
  overallScore: number;
  riskTier: string;
  summary: string;
  reasonCodes: string[];
}
