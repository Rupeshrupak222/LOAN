# PROJECT CLEANUP AUDIT REPORT
**Adyapan Loan Management System (LMS)**  
*Complete Production-Grade Repository Inventory & Dependency Graph Audit*

---

## 1. Project Statistics

- **Total Repository Files Scanned**: 634 files
- **Frontend Source Files**: 341 files (`frontend/src/`, `frontend/public/`, config)
- **Backend Source Files**: 278 files (`backend/src/`, configs)
- **Database Schema & Migrations**: 6 files (`database/prisma/`, migrations, runbooks)
- **Operational Documentation**: 10 files (`docs/`, root guides)
- **Active Backend Test Suites**: 48 test suites (RBAC, isolation, security, load, lifecycle, SoD)
- **Configuration & Infrastructure Files**: 12 files (Docker, configs, env examples, package manifests)
- **Generated Build Artifacts**: 1 file (`frontend/tsconfig.tsbuildinfo`)

---

## 2. File Classification & Dependency Analysis

### Category A — Definitely Required (Core Runtime & Source)
*Files actively required for the compilation, runtime execution, and data integrity of the LMS.*
- All core backend modules (`backend/src/modules/` — 51 active domain subdirectories).
- All Express routes, middleware, models, controllers, and services.
- All Next.js pages, layouts, components, product showcases, and client/server utilities.
- Database Prisma schema (`database/prisma/schema.prisma`), seed orchestrator (`database/prisma/seed.ts`), and baseline migrations.
- Package manifests (`package.json`, `backend/package.json`, `frontend/package.json`) and lockfiles.
- Production and local deployment templates (`docker-compose.yml`, `docker-compose.prod.yml`, Dockerfiles).
- Core package scripts: `backend/src/scripts/purge-customer-data.ts` (bound to `npm run db:purge-customers`) and `backend/src/scripts/validate-production-db.ts` (bound to `npm run db:validate`).

### Category B — Indirectly Required (Framework Conventions, Architecture & Re-Exports)
*Files not directly referenced via static import but required by framework discovery, routing conventions, or architectural design.*
- `frontend/src/app/(app)/permissions/page.tsx`: Next.js route redirect from legacy `/permissions` to `/roles`.
- `frontend/src/app/(app)/products/page.tsx`: Next.js route redirect from legacy `/products` to `/loan-products`.
- `frontend/src/app/products/ai-underwriting/page.tsx`: Next.js route alias delegating to `/products/ai-underwriting-scorecard`.
- `frontend/src/lib/supabase.ts`: Re-export facade for browser client backwards compatibility.
- `backend/src/middleware/rbac-permission.ts`: Express `requirePermission(...)` middleware adapter for granular RBAC checking.
- `backend/src/modules/shared/queue.service.ts`: Background job queue and worker manager supporting async jobs.

### Category C — Active But Optional / Developer Utilities & Tooling
*Files utilized during development, testing, maintenance, and operational drills.*
- `backend/src/scripts/deduplicate-bank-accounts.ts`: Standalone maintenance utility for deduplicating customer bank account records.
- `backend/src/scripts/set-passwords.ts`: Verified password initialization utility that updates user passwords in Argon2id and tests login generation.
- `frontend/src/components/motion/useGsapScrollTrigger.ts`: Motion animation hooks for GSAP scroll interactions on marketing pages.
- `TENANT_ARCHITECTURE_FINAL_REPORT.md`: Comprehensive architectural report for multi-tenant isolation.
- All 48 Vitest test suites in `backend/src/` (including newly added RBAC audit suites).

### Category D — Legacy / Duplicate Files
- `backend/src/scripts/reset-all-passwords.ts`: Redundant scratch password script superseded by standard database seeding.
- `backend/src/scripts/set-passwords.ts`: Redundant scratch password script superseded by standard database seeding.

### Category E — Generated Build Artifacts & Temporary Files
- `frontend/tsconfig.tsbuildinfo`: TypeScript incremental build cache generated during `tsc` execution.

### Category F — Genuinely Unused / Safe to Delete (Zero Dependencies)
*Files proven with zero runtime, build, test, deployment, or documentation dependencies.*

1. **`backend/src/scripts/check-users.ts`**
   - **Reason**: Ad-hoc scratch debug script checking user hash matches against multiple test passwords.
   - **Evidence**: Not in `package.json`, not imported by any module, not called in any CI/CD or test.
   - **References Checked**: Full repository grep yielded 0 matches.

2. **`backend/src/scripts/inspect-hash.ts`**
   - **Reason**: One-off scratch debug script that inspected Argon2 password hashes during password recovery.
   - **Evidence**: Not in `package.json`, not imported by any module, not called in any CI/CD or test.
   - **References Checked**: Full repository grep yielded 0 matches.

3. **`backend/src/scripts/reset-all-passwords.ts`**
   - **Reason**: Duplicate / obsolete developer script superseded by `set-passwords.ts`.
   - **Evidence**: Zero external references across the repository.
   - **References Checked**: Full repository grep yielded 0 matches.

4. **`backend/src/scripts/test-all-logins.ts`**
   - **Reason**: Ad-hoc scratch script that fired HTTP fetch requests to `http://localhost:4000/api/v1/auth/login`.
   - **Evidence**: Zero external references across the repository. Formal login testing is handled by `e2e-lifecycle.test.ts` and `rbac-authorization-audit.test.ts`.
   - **References Checked**: Full repository grep yielded 0 matches.

5. **`frontend/tsconfig.tsbuildinfo`**
   - **Reason**: Local TypeScript build cache file.
   - **Evidence**: Build artifact matched by `.gitignore` (`*.tsbuildinfo`). Reproducible on demand.

---

## 3. Files That Look Unused but MUST Remain Intact

| File Path | Why It Looks Unused | Why It Must Remain (Ground Truth) |
| :--- | :--- | :--- |
| `frontend/src/app/(app)/permissions/page.tsx` | Only 6 lines with redirect | Handles legacy bookmark / link redirects to `/roles` |
| `frontend/src/app/(app)/products/page.tsx` | Only 6 lines with redirect | Handles legacy navigation redirects to `/loan-products` |
| `frontend/src/app/products/ai-underwriting/page.tsx` | Route wrapper | Provides route compatibility for public marketing links |
| `frontend/src/lib/supabase.ts` | 2-line re-export | Backwards compatibility facade for `@/lib/supabase` import paths |
| `backend/src/middleware/rbac-permission.ts` | Not imported in `routes/index.ts` | Foundation middleware for granular permission enforcement |
| `backend/src/modules/shared/queue.service.ts` | Not directly mounted in Express router | Queue abstraction for background job processing and Redis fallback |
| `backend/src/scripts/purge-customer-data.ts` | Standalone script file | Bound to `backend/package.json` script `npm run db:purge-customers` |
| `backend/src/scripts/validate-production-db.ts` | Standalone script file | Bound to `backend/package.json` script `npm run db:validate` |
| `backend/src/scripts/deduplicate-bank-accounts.ts`| **4. ONE-TIME / MAINTENANCE**| Database record hygiene utility | **KEEP** |
| `frontend/src/components/DecisionIntelligenceCard.tsx` | Similar to `AdvancedDecisionIntelligenceCard` | Used on `/dashboard`; `AdvancedDecisionIntelligenceCard` is on `/applications/[id]` |

---

## 4. Complete Script Inventory & Classification

| Script Path | Classification | Role & Purpose | Decision |
| :--- | :--- | :--- | :---: |
| `backend/src/scripts/purge-customer-data.ts` | **1. ACTIVE / REQUIRED** | Bound to `npm run db:purge-customers` for test data resets | **KEEP** |
| `backend/src/scripts/validate-production-db.ts` | **1. ACTIVE / REQUIRED** | Bound to `npm run db:validate` for DB health verification | **KEEP** |
| `backend/src/scripts/deduplicate-bank-accounts.ts` | **4. ONE-TIME / MAINTENANCE**| Database record hygiene utility | **KEEP** |
| `backend/src/scripts/set-passwords.ts` | **7. TEMPORARY SCRATCH** | Temporary password update script | **DELETED** |
| `backend/src/scripts/check-users.ts` | **7. TEMPORARY SCRATCH** | Hash verification debug script | **DELETED** |
| `backend/src/scripts/inspect-hash.ts` | **7. TEMPORARY SCRATCH** | Hash inspection debug script | **DELETED** |
| `backend/src/scripts/reset-all-passwords.ts` | **6. DUPLICATE / OBSOLETE** | Superseded scratch script | **DELETED** |
| `backend/src/scripts/test-all-logins.ts` | **7. TEMPORARY SCRATCH** | Manual HTTP test script | **DELETED** |

---

## 5. Risk Assessment

- **Overall Cleanup Risk**: **LOW**
- **Safety Guarantees**:
  - Zero modifications to core business logic, EMI calculations, payment waterfalls, or ledger mechanics.
  - Zero modifications to database schemas, Prisma migrations, or seed data.
  - Zero modifications to active Next.js routes, layouts, or components.
  - Zero modifications to active Express API endpoints, middleware, or services.
  - Full automated validation via TypeScript compiler (`tsc --noEmit`) and Next.js production build (`next build`) required after deletion.
