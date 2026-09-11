'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import {
  DecisionRule,
  RuleCategory,
  RuleOperator,
  RuleSeverity,
  RuleAction,
} from '../types';

interface RuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: DecisionRule) => void;
  initialRule?: DecisionRule | null;
  category?: RuleCategory;
}

const FIELD_SUGGESTIONS: Record<RuleCategory, Array<{ field: string; label: string; defaultOp: RuleOperator; defaultVal: any; desc: string }>> = {
  ELIGIBILITY: [
    { field: 'borrower.age', label: 'Borrower Age (Years)', defaultOp: 'BETWEEN', defaultVal: [21, 58], desc: 'Applicant age at application' },
    { field: 'borrower.employmentType', label: 'Employment Type', defaultOp: 'IN', defaultVal: ['SALARIED', 'SELF_EMPLOYED'], desc: 'Salaried, Self-Employed, etc.' },
    { field: 'borrower.workExperienceMonths', label: 'Work Experience (Months)', defaultOp: 'GREATER_THAN_OR_EQUAL', defaultVal: 12, desc: 'Total continuous employment tenure' },
    { field: 'borrower.isIndianResident', label: 'Indian Resident Status', defaultOp: 'EQUALS', defaultVal: true, desc: 'Citizenship / Tax residency' },
  ],
  CREDIT: [
    { field: 'credit.bureauScore', label: 'Credit / CIBIL Bureau Score', defaultOp: 'GREATER_THAN_OR_EQUAL', defaultVal: 700, desc: 'TransUnion / CRIF / Experian credit score' },
    { field: 'credit.maxDpdLast12M', label: 'Max DPD (Last 12 Months)', defaultOp: 'LESS_THAN_OR_EQUAL', defaultVal: 0, desc: 'Days Past Due delinquency' },
    { field: 'credit.enquiriesLast3M', label: 'Credit Enquiries (Last 3 Months)', defaultOp: 'LESS_THAN_OR_EQUAL', defaultVal: 3, desc: 'Hard credit enquiries count' },
    { field: 'credit.writtenOffCount', label: 'Written-Off / Suit-Filed Accounts', defaultOp: 'EQUALS', defaultVal: 0, desc: 'Severe negative credit trade lines' },
    { field: 'credit.settledCount', label: 'Settled Accounts Count', defaultOp: 'EQUALS', defaultVal: 0, desc: 'Settled credit history' },
    { field: 'credit.activeOverdueAmount', label: 'Total Active Overdue (₹)', defaultOp: 'LESS_THAN_OR_EQUAL', defaultVal: 0, desc: 'Current outstanding overdue balances' },
  ],
  FINANCIAL: [
    { field: 'financial.foir', label: 'FOIR / Debt-Burden (%)', defaultOp: 'LESS_THAN_OR_EQUAL', defaultVal: 55, desc: 'Fixed Obligation to Income Ratio' },
    { field: 'financial.monthlyIncome', label: 'Net Monthly Income (₹)', defaultOp: 'GREATER_THAN_OR_EQUAL', defaultVal: 25000, desc: 'Verified monthly salary / business income' },
    { field: 'financial.dti', label: 'DTI Ratio (%)', defaultOp: 'LESS_THAN_OR_EQUAL', defaultVal: 65, desc: 'Total Debt to Income Ratio' },
    { field: 'financial.disposableIncome', label: 'Net Disposable Income (₹)', defaultOp: 'GREATER_THAN_OR_EQUAL', defaultVal: 12000, desc: 'Residual income after all EMI & living expenses' },
  ],
  BANKING: [
    { field: 'banking.avgMonthlyBalance', label: 'Average Monthly Balance (₹)', defaultOp: 'GREATER_THAN_OR_EQUAL', defaultVal: 5000, desc: '6-month banking statement average balance' },
    { field: 'banking.salaryCreditDetected', label: 'Direct Salary Credit Verified', defaultOp: 'EQUALS', defaultVal: true, desc: 'Regular payroll ECS/NEFT identified' },
    { field: 'banking.bounceCountLast6M', label: 'Inward / Outward Cheque Bounces (6M)', defaultOp: 'LESS_THAN_OR_EQUAL', defaultVal: 0, desc: 'Financial indiscipline / ECS returns' },
    { field: 'banking.negativeBalanceDays', label: 'Negative Balance Days (6M)', defaultOp: 'EQUALS', defaultVal: 0, desc: 'Overdraft / zero-balance incidents' },
  ],
  KYC_DOCS: [
    { field: 'kyc.panVerified', label: 'PAN NSDL / NSDL Verification Status', defaultOp: 'EQUALS', defaultVal: true, desc: 'Government tax identifier valid' },
    { field: 'kyc.aadhaarVerified', label: 'Aadhaar OKYC / e-KYC Complete', defaultOp: 'EQUALS', defaultVal: true, desc: 'Biometric / OTP address & identity verified' },
    { field: 'kyc.addressVerified', label: 'Proof of Address Document Verified', defaultOp: 'EQUALS', defaultVal: true, desc: 'Utility bill, passport or voter card verified' },
    { field: 'kyc.incomeProofSubmitted', label: 'Income Document Verified', defaultOp: 'EQUALS', defaultVal: true, desc: 'Payslips / Form 16 / ITR verified' },
  ],
  FRAUD_RISK: [
    { field: 'fraud.isDuplicateApplicant', label: 'Duplicate Applicant / Identity Flag', defaultOp: 'EQUALS', defaultVal: false, desc: 'Multi-application match across tenant database' },
    { field: 'fraud.isHighRiskArea', label: 'Negative / High-Risk Postal Pincode', defaultOp: 'EQUALS', defaultVal: false, desc: 'Known high-risk geographic perimeter' },
    { field: 'fraud.velocityCheckPassed', label: 'Application Velocity Threshold', defaultOp: 'EQUALS', defaultVal: true, desc: 'Device / IP / phone velocity limits' },
    { field: 'fraud.fraudFlag', label: 'Internal Watchlist / Fraud Hit', defaultOp: 'EQUALS', defaultVal: false, desc: 'Negative list cross-check' },
  ],
  PRODUCT_POLICY: [
    { field: 'requestedLoan.amount', label: 'Requested Loan Amount (₹)', defaultOp: 'LESS_THAN_OR_EQUAL', defaultVal: 500000, desc: 'Product policy maximum loan cap' },
    { field: 'requestedLoan.tenureMonths', label: 'Tenure (Months)', defaultOp: 'LESS_THAN_OR_EQUAL', defaultVal: 60, desc: 'Product maximum duration in months' },
  ],
};

export const RuleBuilderModal: React.FC<RuleBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRule,
  category = 'ELIGIBILITY',
}) => {
  const [formData, setFormData] = useState<Partial<DecisionRule>>({
    code: '',
    name: '',
    description: '',
    category: category,
    field: '',
    operator: 'GREATER_THAN_OR_EQUAL',
    expectedValue: '',
    severity: 'HIGH',
    actionOnPass: 'PASS',
    actionOnFail: 'FAIL',
    reasonCode: '',
    customerReason: '',
    weight: 15,
    enabled: true,
    priority: 10,
  });

  const [valueType, setValueType] = useState<'number' | 'string' | 'boolean' | 'range' | 'array'>('number');
  const [rangeMin, setRangeMin] = useState<string>('21');
  const [rangeMax, setRangeMax] = useState<string>('58');
  const [arrayStr, setArrayStr] = useState<string>('SALARIED, SELF_EMPLOYED');

  useEffect(() => {
    if (initialRule) {
      setFormData({ ...initialRule });
      if (initialRule.operator === 'BETWEEN' && Array.isArray(initialRule.expectedValue)) {
        setValueType('range');
        setRangeMin(String(initialRule.expectedValue[0] || ''));
        setRangeMax(String(initialRule.expectedValue[1] || ''));
      } else if (['IN', 'NOT_IN'].includes(initialRule.operator) && Array.isArray(initialRule.expectedValue)) {
        setValueType('array');
        setArrayStr(initialRule.expectedValue.join(', '));
      } else if (typeof initialRule.expectedValue === 'boolean') {
        setValueType('boolean');
      } else if (typeof initialRule.expectedValue === 'number') {
        setValueType('number');
      } else {
        setValueType('string');
      }
    } else {
      const defaultField = FIELD_SUGGESTIONS[category]?.[0];
      setFormData({
        code: `${category}_RULE_${Date.now().toString().slice(-4)}`,
        name: defaultField?.label || 'New Rule',
        description: defaultField?.desc || 'Evaluates criteria for decision engine',
        category: category,
        field: defaultField?.field || 'borrower.age',
        operator: defaultField?.defaultOp || 'GREATER_THAN_OR_EQUAL',
        expectedValue: defaultField?.defaultVal ?? 700,
        severity: 'HIGH',
        actionOnPass: 'PASS',
        actionOnFail: 'FAIL',
        reasonCode: `${category}_POLICY_CRITERIA`,
        customerReason: 'Criteria not met for loan product policy',
        weight: 15,
        enabled: true,
        priority: 10,
      });
    }
  }, [initialRule, category, isOpen]);

  if (!isOpen) return null;

  const handleFieldSelect = (fieldKey: string) => {
    const list = FIELD_SUGGESTIONS[formData.category || 'ELIGIBILITY'] || [];
    const item = list.find((x) => x.field === fieldKey);
    if (item) {
      setFormData((prev) => ({
        ...prev,
        field: item.field,
        name: item.label,
        description: item.desc,
        operator: item.defaultOp,
        expectedValue: item.defaultVal,
        reasonCode: `${item.field.replace('.', '_').toUpperCase()}_MISMATCH`,
      }));

      if (item.defaultOp === 'BETWEEN' && Array.isArray(item.defaultVal)) {
        setValueType('range');
        setRangeMin(String(item.defaultVal[0]));
        setRangeMax(String(item.defaultVal[1]));
      } else if (['IN', 'NOT_IN'].includes(item.defaultOp) && Array.isArray(item.defaultVal)) {
        setValueType('array');
        setArrayStr(item.defaultVal.join(', '));
      } else if (typeof item.defaultVal === 'boolean') {
        setValueType('boolean');
      } else if (typeof item.defaultVal === 'number') {
        setValueType('number');
      } else {
        setValueType('string');
      }
    } else {
      setFormData((prev) => ({ ...prev, field: fieldKey }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let computedValue: any = formData.expectedValue;
    if (formData.operator === 'BETWEEN') {
      computedValue = [parseFloat(rangeMin) || 0, parseFloat(rangeMax) || 0];
    } else if (['IN', 'NOT_IN'].includes(formData.operator || '')) {
      computedValue = arrayStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (valueType === 'number') {
      computedValue = parseFloat(String(formData.expectedValue)) || 0;
    } else if (valueType === 'boolean') {
      computedValue = String(formData.expectedValue) === 'true';
    }

    const finalRule: DecisionRule = {
      id: initialRule?.id || `rule_${Date.now()}`,
      code: (formData.code || `RULE_${Date.now()}`).toUpperCase().trim(),
      name: formData.name || 'Unnamed Rule',
      description: formData.description || '',
      category: formData.category || 'ELIGIBILITY',
      field: formData.field || 'credit.bureauScore',
      operator: formData.operator || 'GREATER_THAN_OR_EQUAL',
      expectedValue: computedValue,
      severity: formData.severity || 'HIGH',
      actionOnPass: formData.actionOnPass || 'PASS',
      actionOnFail: formData.actionOnFail || 'FAIL',
      reasonCode: (formData.reasonCode || 'POLICY_REJECT').toUpperCase().trim(),
      customerReason: formData.customerReason || 'Loan policy requirement was not met.',
      weight: Number(formData.weight) || 0,
      enabled: formData.enabled ?? true,
      priority: Number(formData.priority) || 10,
    };

    onSave(finalRule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {initialRule ? 'Edit Decision Rule' : 'Create New Decision Rule'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure deterministic underwriting policy logic for loan product evaluation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 mt-4">
          {/* Category & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Rule Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value as RuleCategory;
                  setFormData((prev) => ({ ...prev, category: cat }));
                  const defaultField = FIELD_SUGGESTIONS[cat]?.[0];
                  if (defaultField) handleFieldSelect(defaultField.field);
                }}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ELIGIBILITY">Eligibility Criteria</option>
                <option value="CREDIT">Credit Bureau & History</option>
                <option value="FINANCIAL">Financial Ratios (FOIR/DTI)</option>
                <option value="BANKING">Banking & Cashflow Metrics</option>
                <option value="KYC_DOCS">KYC & Document Verification</option>
                <option value="FRAUD_RISK">Fraud & Negative Risk</option>
                <option value="PRODUCT_POLICY">Product Limits & Policy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Unique Rule Code
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. MIN_CIBIL_SCORE"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Rule Name & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Rule Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Minimum CIBIL Score Requirement"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description & Underwriting Rationale
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain why this rule exists and when it blocks the loan"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Field Selection & Operator */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/90 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Evaluation Target & Condition
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Field / Context Path</label>
                <div className="space-y-1.5">
                  <select
                    value={
                      FIELD_SUGGESTIONS[formData.category || 'ELIGIBILITY']?.some((x) => x.field === formData.field)
                        ? formData.field
                        : 'CUSTOM'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'CUSTOM') {
                        handleFieldSelect(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <optgroup label="Preset Standard Fields">
                      {(FIELD_SUGGESTIONS[formData.category || 'ELIGIBILITY'] || []).map((sug) => (
                        <option key={sug.field} value={sug.field}>
                          {sug.label} ({sug.field})
                        </option>
                      ))}
                    </optgroup>
                    <option value="CUSTOM">-- Custom Context Path --</option>
                  </select>

                  <input
                    type="text"
                    required
                    value={formData.field}
                    onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                    placeholder="e.g. credit.bureauScore or financial.foir"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Operator</label>
                <select
                  value={formData.operator}
                  onChange={(e) => {
                    const op = e.target.value as RuleOperator;
                    setFormData({ ...formData, operator: op });
                    if (op === 'BETWEEN') setValueType('range');
                    else if (['IN', 'NOT_IN'].includes(op)) setValueType('array');
                    else if (['EXISTS', 'NOT_EXISTS'].includes(op)) setValueType('boolean');
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="GREATER_THAN_OR_EQUAL">&gt;= (Greater Than or Equal)</option>
                  <option value="LESS_THAN_OR_EQUAL">&lt;= (Less Than or Equal)</option>
                  <option value="GREATER_THAN">&gt; (Greater Than)</option>
                  <option value="LESS_THAN">&lt; (Less Than)</option>
                  <option value="EQUALS">== (Equals)</option>
                  <option value="NOT_EQUALS">!= (Not Equals)</option>
                  <option value="BETWEEN">BETWEEN (Range [Min, Max])</option>
                  <option value="IN">IN (Included in List)</option>
                  <option value="NOT_IN">NOT IN (Not in List)</option>
                  <option value="CONTAINS">CONTAINS (Substring / Item)</option>
                  <option value="EXISTS">EXISTS (Not Null / Defined)</option>
                </select>
              </div>
            </div>

            {/* Expected Value Input depending on Operator */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Expected Comparison Value
              </label>

              {formData.operator === 'BETWEEN' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Min Threshold:</span>
                    <input
                      type="number"
                      value={rangeMin}
                      onChange={(e) => setRangeMin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      placeholder="e.g. 21"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Max Threshold:</span>
                    <input
                      type="number"
                      value={rangeMax}
                      onChange={(e) => setRangeMax(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      placeholder="e.g. 58"
                    />
                  </div>
                </div>
              ) : ['IN', 'NOT_IN'].includes(formData.operator || '') ? (
                <div>
                  <input
                    type="text"
                    value={arrayStr}
                    onChange={(e) => setArrayStr(e.target.value)}
                    placeholder="Comma separated values e.g. SALARIED, SELF_EMPLOYED, BUSINESS"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Separate acceptable values with commas.</p>
                </div>
              ) : ['EXISTS', 'NOT_EXISTS'].includes(formData.operator || '') ? (
                <div className="text-xs text-indigo-300 font-mono py-1.5 px-3 bg-indigo-950/40 rounded-lg border border-indigo-900/50">
                  Checks whether key exists and is non-empty in evaluation payload.
                </div>
              ) : typeof formData.expectedValue === 'boolean' || valueType === 'boolean' ? (
                <select
                  value={String(formData.expectedValue)}
                  onChange={(e) => setFormData({ ...formData, expectedValue: e.target.value === 'true' })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                >
                  <option value="true">True / Positive Flag</option>
                  <option value="false">False / Negative Flag</option>
                </select>
              ) : (
                <input
                  type={valueType === 'number' ? 'number' : 'text'}
                  value={formData.expectedValue ?? ''}
                  onChange={(e) => setFormData({ ...formData, expectedValue: e.target.value })}
                  placeholder="e.g. 700 or 50000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              )}
            </div>
          </div>

          {/* Severity, Action & Scoring Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Severity
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as RuleSeverity })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                <option value="HARD_STOP">HARD STOP (Instant Reject)</option>
                <option value="HIGH">HIGH (Major Defect)</option>
                <option value="MEDIUM">MEDIUM (Refer / Review)</option>
                <option value="LOW">LOW (Minor)</option>
                <option value="INFO">INFO (Advisory Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Action On Fail
              </label>
              <select
                value={formData.actionOnFail}
                onChange={(e) => setFormData({ ...formData, actionOnFail: e.target.value as RuleAction })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                <option value="FAIL">FAIL (Block Application)</option>
                <option value="REFER">REFER (Send to Manual Review)</option>
                <option value="CONDITION">CONDITION (Approve with Stipulation)</option>
                <option value="WARNING">WARNING (Log Warning Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Risk Weight (+/- Pts)
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 20"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Reason Code & Customer Explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Internal Reason Code
              </label>
              <input
                type="text"
                required
                value={formData.reasonCode}
                onChange={(e) => setFormData({ ...formData, reasonCode: e.target.value })}
                placeholder="e.g. CIBIL_BELOW_MINIMUM"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Customer-Facing Reason
              </label>
              <input
                type="text"
                value={formData.customerReason}
                onChange={(e) => setFormData({ ...formData, customerReason: e.target.value })}
                placeholder="e.g. Credit score does not meet product criteria"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Toggle Enabled & Priority */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-300">Rule Enabled for Active Evaluation</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                {initialRule ? 'Update Rule' : 'Add Rule to Group'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
