# Production Deployment Runbook

This guide outlines the standard zero-downtime deployment process for Adyapan Lending OS.

---

## 1. Deployment Pipeline Lifecycle

```text
1. Git Commit / Release Tag
            │
            ▼
2. Automated Test & TypeScript CI Verification (0 errors required)
            │
            ▼
3. Production Environment Secret Validation (`enforceProductionEnvironmentValidation`)
            │
            ▼
4. Database Schema Migration (`npx prisma migrate deploy`)
            │
            ▼
5. Build Artifact Compilation (`npm run build`)
            │
            ▼
6. Container Startup & Liveness/Readiness Probe Polling
            │
            ▼
7. Smoke Test Verification & Traffic Routing
```

---

## 2. Deployment Execution Steps

### Step 1: Pre-Flight Environment Validation
```bash
# Verify all environment variables
npm run env:check
```

### Step 2: Database Migration
```bash
cd backend
npx prisma migrate deploy
```

### Step 3: Production Build
```bash
# Backend build
cd backend && npm run build

# Frontend build
cd ../frontend && npm run build
```

### Step 4: Process Startup
```bash
# Start backend cluster with PM2 / Docker
cd backend && npm run start:prod
```

### Step 5: Smoke Test & Health Check
```bash
curl -f http://localhost:4000/health/ready
```
Ensure HTTP 200 `status: "READY"` with all database and worker pools operational.
