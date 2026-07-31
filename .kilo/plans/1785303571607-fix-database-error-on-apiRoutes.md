# Fix "Database error" on API Routes

## Goal
Resolve the 500 "Database error: Please run migrations and seed the database." that all API routes return, causing InternDashboard and DailyLogForm to fail completely.

---

## Root Cause Analysis

The error originates in `withAuth.ts:53` — a catch-all that **masks the real Prisma error**:

```
withAuth.ts line 32-35: prisma.user.findUnique() ← THIS THROWS
withAuth.ts line 46-53: catch block swallows the real error → "Database error"
```

When `prisma.user.findUnique()` fails (table missing, schema mismatch, connection issue), the error message doesn't contain "Unauthorized" or "inactive", so it falls through to line 53 and becomes the generic "Database error".

The most likely reason: **migrations have not been applied** to the live SupabaseDB, so the `User` table (and possibly other tables) don't exist yet at the Prisma/DB level.

Evidence chain:
- `.env` has a valid Supabase pooler URL → `getPrisma()` returns a real PrismaClient (not mock)
- The mock PrismaClient would return `isActive: true` users, avoiding this error entirely
- The real DB query fails because the schema doesn't exist in Supabase
- The seed script (`prisma/seed.ts`) creates users with `isActive: true` but can't run if the tables don't exist

---

## Plan

### Task 1 — Improve error visibility in `withAuth.ts`
**File:** `app/api/_lib/withAuth.ts`

Add the real Prisma error to the catch-all message so future failures are debuggable:
- Change line 53 from generic `"Database error: Please run migrations and seed the database."` to include the original error message, e.g. `"Database error: <original message>".`
- OR log the error before replacing it

**Why:** The catch-all at line 53 currently hides the actual cause (missing table, connection failure, schema mismatch). Surface the real error so debugging is possible.

**Acceptance:** When a Prisma query fails, the API response includes the real Prisma error message (at least in dev).

---

### Task 2 — Apply pending migrations to SupabaseDB
**Command:** `npx prisma migrate deploy`

Run all pending Prisma migrations against the live SupabaseDB.

**Why:** The `User` table and all related tables may not exist in the live DB yet. The migration SQL files exist in `prisma/migrations/` but haven't been applied.

**Risk:** If a migration has already been partially applied, `prisma migrate deploy` is idempotent and safe to re-run. It only applies migrations that haven't been recorded in the `_prisma_migrations` table.

**Acceptance:** `prisma migrate status` shows all migrations applied. No schema drift.

---

### Task 3 — Re-run the seed script
**Command:** `npx tsx prisma/seed.ts`

Seed the database with demo users, projects, logs, tasks, messages, questions, audit logs, and system settings.

**Why:** Even if the DB tables exist, the demo data (users, projects, etc.) is missing. The seed script creates all demo accounts with `isActive: true`.

**Note:** DO NOT pipe output to `tail` (PowerShell incompatibility). Run directly and capture output.

**Acceptance:** Script completes with "Database Seeding Completed Successfully!" message and no errors.

---

### Task 4 — Verify demo users are active in the real DB
**Action:** Query the DB via Prisma to confirm `int-sam` and other demo users are active.

If the seed script succeeded but users were previously toggled to `isActive: false` (via DashboardShell status toggle), the seed script's `upsert` with `isActive: true` should have re-activated them. Verify by checking if the error changes from "Database error" to either working or "This account is inactive."

**Why:** The previous session showed `int-sam` had `isActive: false` in the real DB, which would produce "This account is inactive." instead of "Database error."

**Acceptance:** `prisma.user.findUnique({ where: { id: "int-sam" } })` returns a user with `isActive: true`.

---

### Task 5 — Fix pre-existing TS error in `superadmin/overview/route.ts`
**File:** `app/api/superadmin/overview/route.ts`

Line 108 uses `mapAuditLog(l)` but only imports `logAudit` from mappers — `mapAuditLog` is NOT imported.

Add `mapAuditLog` to the import from `"@/app/api/_lib/mappers"`.

**Why:** This TS error would prevent `npm run build` from succeeding, even if the runtime error is fixed.

**Acceptance:** `npm run build` completes with no TS errors in API routes.

---

### Task 6 — Verify build and runtime
1. `npm run build` — must succeed with zero errors
2. `npm run start` — app starts on port 3000
3. Log in as `sam@intern.com` — InternDashboard loads with stats, tasks, logs
4. Log in as `superadmin@company.com` — SuperAdminOverview loads
5. Check that no console errors show "Database error" from API routes

---

## Execution Order
1. Task 1 (error visibility) — 10 min
2. Task 2 (migrations) — 5 min
3. Task 3 (seed) — 5 min
4. Task 5 (TS fix) — 5 min
5. Task 4 (verify users active) — 5 min
6. Task 6 (build + runtime verification) — 15 min

## Key Decisions
- `withAuth.ts` should NOT be changed to remove the `isActive` check or weaken auth — the catch-all error masking is the only part that needs fixing
- The mock PrismaClient fallback in `src/db/prisma.ts` should NOT be used as a workaround — it bypasses the real DB and would hide the problem
- The fix assumes the DATABASE_URL in `.env` is correct and points to a live SupabaseDB

## Risks
- If the SupabaseDB connection is down or the pooler URL is invalid, `prisma migrate deploy` will fail
- If the `SUPER_ADMIN` role enum value doesn't exist in the DB (missing migration), the seed script will fail with a constraint error — but the migration file `20260727104016_add_super_admin_and_audit_models` does add it via `ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN'`
- The seed script uses `upsert` for SuperAdmin but `create` for all other users — if run twice, non-superadmin users would fail on duplicate email (but they use `prisma.user.create` without `upsert`, so idempotency for those is not guaranteed)

## Critical Context
- The `DEMO_EMAILS` set in `AuthContext.tsx` bypasses Supabase Auth password validation for all test accounts — any password works for log in
- The `.env` has `DATABASE_URL` pointing to `aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` — this is the live SupabaseDB, not a local DB
- The `getPrisma()` function returns real PrismaClient when DATABASE_URL is a valid postgresql URL — the mock fallback is never triggered in this environment
- Previous session confirmed `int-sam` had `isActive: false` in the real DB, causing "This account is inactive." errors (pre-fix)