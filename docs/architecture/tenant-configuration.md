# Tenant Configuration Bundle Architecture

## Unified Configuration Studio

The `TenantConfigurationCenter` provides a unified multi-engine configuration studio for Tenant Administrators and Platform Super Administrators:

1. **Organization Profile & Statutory**:
   - Company Name, Corporate Identity Number (CIN), RBI NBFC Registration Certificate number.
   - Portal custom domain, contact email, support hotline, base currency, timezone.
2. **Readiness & Health Engine**:
   - Real-time diagnostic evaluation of 8 operational domains with action triggers.
3. **Branch Networks**:
   - Operating branch jurisdictions, branch codes, city/state assignments.
4. **Staff Users & Role Delegation**:
   - Institutional staff roster with role scoping (`LOAN_OFFICER`, `UNDERWRITER`, `BRANCH_MANAGER`, `COMPLIANCE_OFFICER`, `ADMIN`).
   - Strict rejection of unauthorized privilege escalation (`SUPER_ADMIN` blocked).
5. **Loan Products**:
   - Product catalog, minimum/maximum loan amounts, tenure windows, interest rate methods, fee schedules.
6. **Workflows & Stages**:
   - Pipeline stages, entry/exit criteria, stage-gate checklists, SLAs.
7. **Decision Rules (BRE)**:
   - Rule groups (FOIR, Bureau, Age, Income, Employment, Banking, Fraud), cutoff thresholds, risk grades.
8. **Approval Authority Matrix**:
   - Tiered sanction limits, four-eyes committee mandates, delegation rules.
9. **Credit Limits & Revolving Facilities**:
   - Multi-cap exposure ceilings, facility types, drawdown constraints.
10. **White-Label Branding**:
    - Primary and secondary brand colors, contrast checks, portal titles, logo/favicon links, email signatures.
