# Fix Next.js Project Errors — Implementation Plan

## Goal
Make the project run without runtime or build errors, wire up all dashboards, and ensure the DB/auth/upload flows have safe fallbacks.

---

## Task 1 — Create Missing System Settings Route
**File to create:** `app/api/superadmin/system-settings/route.ts`

**What:** Add GET + PUT handlers for `/api/superadmin/system-settings`.
- GET returns all `SystemSetting` rows (include `updater`).
- PUT accepts `{ key: string, value: string }`, validates known keys, upserts via Prisma, logs audit.

**Why:** `SuperAdminSettings.tsx` calls `api.getSystemSettings()` → 404 today.

**Acceptance:** `curl -X GET http://localhost:3000/api/superadmin/system-settings` returns JSON array. PUT returns updated setting.

---

## Task 2 — Fix DashboardShell Navigation Props
**Files to edit:**
- `app/dashboard/page.tsx`
- `app/projects/page.tsx`
- `app/discussions/page.tsx`
- `app/team/page.tsx`
- `app/manager/page.tsx`
- `app/superadmin/overview/page.tsx`
- `app/superadmin/users/page.tsx`
- `app/superadmin/settings/page.tsx`
- `app/superadmin/moderation/page.tsx`
- `app/superadmin/audit/page.tsx`

**What:** Each wrapper currently renders:
```tsx
<DashboardShell settings={settings}>
```
Change to:
```tsx
<DashboardShell 
  settings={settings}
  activeTab={activeTab} 
  setActiveTab={setActiveTab}
>
```
Also add `const [activeTab, setActiveTab] = useState('dashboard')` (or role-appropriate default) in each wrapper.

**Why:** Sidebar buttons call `setActiveTab()` which is currently undefined → runtime error on click.

**Acceptance:** Clicking sidebar nav items switches the rendered child component without crashing.

---

## Task 3 — Align Types With API/Prisma (camelCase Decision)
**File to edit:** `src/types.ts`

**What:** Keep frontend types in **snake_case** (they already match the API mappers' output). Do NOT change types to camelCase because that would break every component that reads `task.assigned_to`, `log.intern_id`, etc.

Instead, verify that every API mapper in `app/api/_lib/mappers.ts` correctly converts Prisma camelCase → API snake_case, and that every route handler converts request snake_case → Prisma camelCase before DB calls.

**Why:** The types are already consistent with the API layer. The real issue is missing route files and prop mismatches, not the types themselves.

**Acceptance:** `npm run build` completes with no type errors.

---

## Task 4 — Fix getPrisma() Fallback
**File to edit:** `src/db/prisma.ts`

**What:** Replace the current throw-with-no-fallback logic with actual fallback:
```ts
export function getPrisma(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  const isValidUrl = dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'));
  const isPlaceholder = dbUrl && (
    dbUrl.includes('host:port') || dbUrl.includes('MY_DATABASE_URL') || dbUrl.includes('password@host')
  );

  if (!isValidUrl || isPlaceholder) {
    console.warn("DATABASE_URL missing/invalid — using in-memory MockPrismaClient fallback");
    return mockPrismaInstance as any;
  }

  if (!prisma) {
    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  }
  return prisma;
}
```

**Why:** Currently the app hard-crashes if DATABASE_URL is missing. The `MockPrismaClient` class exists but is never used.

**Acceptance:** App starts and shows demo data even when DATABASE_URL is removed.

---

## Task 5 — Wire Up Dashboard Role Routing
**File to edit:** `app/dashboard/page.tsx`

**What:** Replace the "Coming Soon" placeholders with actual routed content:
```tsx
{user.role === "tech_lead" && <TeamOverview currentUser={user} />}
{user.role === "manager" && <ManagerOverview currentUser={user} />}
{user.role === "super_admin" && <SuperAdminOverview currentUser={user} />}
```
Import the respective page components.

**Why:** The pages exist at `/team`, `/manager`, `/superadmin/overview` but the main dashboard router still shows placeholders.

**Acceptance:** Logging in as any role shows a fully functional dashboard, not a placeholder.

---

## Task 6 — Update Middleware CSP for Supabase
**File to edit:** `middleware.ts`

**What:** Update `connect-src` to include Supabase domains:
```
connect-src 'self' ws: wss: https://*.supabase.co https://*.pooler.supabase.com;
```
Also add `img-src` to allow Supabase storage images.

**Why:** Supabase realtime (WebSocket) and storage URLs are on different domains. Current CSP blocks them.

**Acceptance:** Realtime subscriptions connect without console CSP errors. Screenshot images load from Supabase storage.

---

## Task 7 — Add reactStrictMode
**File to edit:** `next.config.ts`

**What:** Add `reactStrictMode: true` to the config.

**Why:** Helps catch double-invoke bugs in development.

**Acceptance:** `next dev` runs with strict mode enabled.

---

## Task 8 — Run Migrations & Seed
**Commands to run:**
```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

**Why:** The database schema exists in migrations but hasn't been applied to the live Supabase DB. Seed populates demo users, projects, logs, tasks, messages, questions, audit logs, and settings.

**Acceptance:** `prisma migrate status` shows all migrations applied. Seed completes without errors.

---

## Task 9 — Create Supabase Screenshots Bucket
**Manual step in Supabase Dashboard:**

1. Go to Supabase → Storage
2. Create a new bucket named `screenshots`
3. Set it to **Public**
4. (Optional) Add RLS policy to allow authenticated uploads

**Why:** `uploadBase64Image()` in `src/lib/supabase.ts` uploads to the `screenshots` bucket. Without it, screenshot uploads fail and fall back to base64 or error out.

**Acceptance:** Uploading a screenshot via the Daily Log form succeeds and returns a public URL.

---

## Execution Order
1. Task 1 (missing route) — 5 min
2. Task 2 (DashboardShell props) — 10 min
3. Task 3 (types alignment check) — 5 min
4. Task 4 (getPrisma fallback) — 5 min
5. Task 5 (dashboard routing) — 5 min
6. Task 6 (CSP middleware) — 5 min
7. Task 7 (strict mode) — 2 min
8. Task 8 (migrations + seed) — 5 min
9. Task 9 (Supabase bucket) — 5 min (manual)

**Total estimated effort:** ~45 minutes of coding + 5 minutes of manual Supabase setup.

---

## Validation Steps
1. `npm run build` — must succeed with zero errors
2. `npm run dev` — app starts on port 3000
3. Visit `/login` — login form renders
4. Log in as `sam@intern.com` — redirects to intern dashboard with stats, tasks, log form
5. Log in as `alex@techlead.com` — redirects to tech lead team overview with review queue
6. Log in as `elena@manager.com` — redirects to manager org analytics
7. Log in as `superadmin@company.com` — redirects to super admin overview with users/audit/moderation/settings tabs
8. Navigate via sidebar in each role — no crashes
9. Submit a daily log with screenshot — succeeds
10. Start/End day — session updates in DB
11. Assign a task as tech lead — appears in intern's board
12. Review a log with score + mistake flag — persists to DB
13. Post a question in Ask the Team — appears in feed
14. Toggle settings in Super Admin Settings — persists
15. Check audit logs — actions appear
16. Disconnect DATABASE_URL — app still starts with mock data (no crash)
