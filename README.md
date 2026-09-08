# Adyapan Loan Management System

A production-style Loan Management System (LMS) for **Adyapan IT Solution**.

> Portfolio / reference implementation. Uses synthetic demo data. Not a live lending platform until KYC, lending, data-protection, and regulatory requirements are implemented.

## Structure

This repository is intentionally split into three clearly separated parts:

```
LOAN/
├── backend/        # Node.js + Express + TypeScript REST API
├── frontend/       # Next.js + TypeScript + Tailwind (FinTech UI)
├── database/       # Prisma schema, migrations, seed (shared by backend)
├── docker-compose.yml
├── .env.example
└── README.md
```

- **backend** — REST API, business logic, auth, money/EMI engine.
- **frontend** — enterprise FinTech UI that consumes the backend API.
- **database** — Prisma schema + seed. The backend imports the generated client.

## Quick start (local)

1. Copy env files:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Start infrastructure (PostgreSQL + Redis):
   ```bash
   docker compose up -d
   ```
3. Backend:
   ```bash
   cd backend
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```
4. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

- API: http://localhost:4000/api/v1
- API docs: http://localhost:4000/api/docs
- Web: http://localhost:3000

## Demo users (after seed)

| Role         | Email                       | Password            |
|--------------|-----------------------------|---------------------|
| Super Admin  | superadmin@adyapan.dev      | DevStaffSeed2026!   |
| Admin        | admin@adyapan.dev           | DevStaffSeed2026!   |
| Loan Officer | officer@adyapan.dev         | DevStaffSeed2026!   |
| Customer     | customer@adyapan.dev        | DevStaffSeed2026!   |

## Money & correctness

- All persisted monetary values use PostgreSQL `NUMERIC`.
- Calculations use `decimal.js`, never native floating point.
- Financial writes run inside database transactions.
