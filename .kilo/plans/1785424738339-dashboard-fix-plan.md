# Dashboard Fix Plan

## Root Cause Analysis

The project was converted from a previous framework (likely React Router) to Next.js App Router. The conversion broke several things:

1. **Dead route group `app/(dashboard)/`** — Contains only a `layout.tsx` (a duplicate DashboardShell) that tries to `router.push` to `/dashboard/xxx` URLs that have no corresponding page files. This is dead code that never renders.

2. **`app/dashboard/page.tsx` always renders the same view per role** — The `activeTab` state is initialized based on role but never actually used to switch views. Clicking sidebar tabs for tech_lead/manager/super_admin navigates to 404 URLs.

3. **Critical bugs** in API routes and components cause specific features to be broken.

---

## Issues and Fixes

### Issue 1: Can't start the day (intern)
**Root cause:** `withAuth.ts` line 41-43 rejects requests from users with `isActive: false`. A new intern's account starts as active in the mock DB, but if the account was deactivated, they can never start a day session. This creates a deadlock.
**Fix:** In `withAuth.ts`, the `isActive` check should not block day session start/end endpoints. Move the `isActive` check to be less restrictive, or exclude day-session endpoints from the `isActive` gate. The cleanest fix: remove the `isActive` check from `withAuth.ts` entirely, since the login flow already filters inactive users, and the admin can toggle status separately.

### Issue 2: Intern starts day, but tech lead dashboard doesn't update
**Root cause:** `app/api/analytics/route.ts` line 80 — `todaySession` is hardcoded to `null as any` instead of using the already-fetched `iTodaySession` variable computed on line 60.
**Fix:** Change line 80 from `todaySession: null as any` to `todaySession: iTodaySession || null`.

### Issue 3: "My Projects" page not displaying on intern dashboard
**Root cause:** `app/projects/page.tsx` line 12 — `activeTab` is hardcoded to `"dashboard"` instead of `"projects"`, so the sidebar "My Projects" nav item is never highlighted. Also, the project page uses `DashboardShell` which wraps content in a layout, but the dashboard page also uses `DashboardShell`, causing potential double-wrapping when navigating between them.
**Fix:** Change `activeTab` to `"projects"` on line 12 of `app/projects/page.tsx`.

### Issue 4: "Ask the Team" not working
**Root cause:** The `app/(dashboard)/layout.tsx` (dead code) navigates to `/dashboard/discussions`, but the actual page is at `/discussions`. The `app/dashboard/page.tsx` uses `src/components/layout/DashboardShell` which has an `activeTab` for `"discussions"` but the `InternDashboard` component doesn't render `<AskTeamThread>`. The `/discussions` standalone page exists and works, but the sidebar link points to the wrong URL.
**Fix:** 
- Fix the `DashboardShell` navigation for intern role: change the `/dashboard/discussions` link to point to `/discussions`
- Add `<AskTeamThread>` to `InternDashboard.tsx` so it renders inline when "Ask the Team" tab is active

### Issue 5: Daily log submit only shows one log (Past Logs History empty)
**Root cause:** `app/api/logs/route.ts` lines 72-91 — When an intern submits a log for a day that already has one, the POST handler **updates** the existing log (`prisma.dailyLog.update`) instead of creating a new entry. This means there's only ever one log per day per intern. Additionally, the `DailyLogTimeline` component filters logs, and if the user has a date filter active, past logs may be hidden.
**Fix:** The POST handler should create a new log entry even if one already exists for the same day, rather than overwriting. Change lines 79-91 to always create a new log. Alternatively, if overwriting is intentional (only one log per day allowed), then the "Past Logs History" showing only one log is expected behavior and needs clarification. Most likely fix: change the overwrite logic to create a new entry with an incremented date or a counter suffix, OR remove the `findFirst` check and always `create`.

### Issue 6: Tech Lead dashboard — online/working interns not displaying
**Root cause:** Same as Issue 2 — `analytics/route.ts` line 80 hardcodes `todaySession: null` and line 51 uses generic `u.isActive` instead of checking for an active day session.
**Fix:** Same fix as Issue 2 — use `iTodaySession` instead of `null`. Also fix the `activeCount` calculation to count interns with an active today session rather than using `u.isActive`.

### Issue 7: Tech Lead — Ask the Team option missing
**Root cause:** The `TeamOverview.tsx` component doesn't include an "Ask the Team" section or link. The `DashboardShell` sidebar shows the "Ask the Team" tab for tech leads (when `ask_the_team_enabled` is true), but clicking it navigates to `/dashboard/discussions` which is a 404.
**Fix:** 
- Fix navigation to go to `/discussions` instead of `/dashboard/discussions`  
- OR add an embedded AskTeamThread component in TeamOverview when the tab is active

### Issue 8: Tech Lead — Functions not working
**Root cause:** `src/components/techlead/InternDetail.tsx` lines 367-371 — The "Avg Marks" calculation uses a fake/simulated algorithm (`logs.indexOf(l)` in reduce + hardcoded `sum + 4.5`) instead of using the actual `iMarks` data.
**Fix:** Replace the fake calculation with a proper average from `iMarks`: `avgMarks = iMarks.length > 0 ? iMarks.reduce((sum, m) => sum + m.score, 0) / iMarks.length : 0`

### Issue 9: Super Admin — Features missing
**Root cause:** `app/dashboard/page.tsx` only renders `SuperAdminOverview` for super_admin role. The sidebar links to `/dashboard/users`, `/dashboard/audit`, `/dashboard/moderation`, `/dashboard/settings` all navigate to 404 URLs because there are no page files at those paths.
**Fix:** Create page files at:
- `app/dashboard/users/page.tsx` → renders `SuperAdminUsers`
- `app/dashboard/audit/page.tsx` → renders `SuperAdminAudit`  
- `app/dashboard/moderation/page.tsx` → renders `SuperAdminModeration`
- `app/dashboard/settings/page.tsx` → renders `SuperAdminSettings`

Each page wraps its content in `DashboardShell` with the correct `activeTab` and fetches settings.

### Issue 10: Streak always shows 0 in analytics
**Root cause:** `app/api/analytics/route.ts` line 75 hardcodes `streak: 0` for every intern. No streak calculation logic exists.
**Fix:** Implement streak calculation by counting consecutive days with day sessions starting from today backwards. This is a lower-priority fix.

---

## Implementation Order

1. **Fix `analytics/route.ts`** — Use `iTodaySession` instead of `null` (fixes Issues 2, 6)
2. **Fix `withAuth.ts`** — Remove `isActive` block or make it role-aware (fixes Issue 1)
3. **Fix `logs/route.ts` POST** — Create new log entries instead of overwriting (fixes Issue 5)
4. **Fix `projects/page.tsx`** — Set correct `activeTab` (fixes Issue 3)
5. **Fix `dashboard/page.tsx`** — Make `activeTab` actually switch views per role (fixes Issues 7, 9)
6. **Fix `DashboardShell` navigation** — Change `/dashboard/discussions` to `/discussions` for intern role (fixes Issue 4)
7. **Fix `InternDetail.tsx`** — Real marks calculation (fixes Issue 8)
8. **Create missing page files** under `app/dashboard/` for super admin tabs (fixes Issue 9)
9. **Fix `InternDashboard.tsx`** — Add AskTeamThread component for inline use (fixes Issue 4)
10. **Fix TS extension imports** — Remove `.ts` from imports in `MyProjects.tsx`, `DailyLogForm.tsx`, `AskTeamThread.tsx` (consistency)

---

## Key Files to Modify

| File | Change |
|------|--------|
| `app/api/analytics/route.ts` | Use `iTodaySession` instead of `null`; fix `activeCount` |
| `app/api/_lib/withAuth.ts` | Remove or relax `isActive` check |
| `app/api/logs/route.ts` | Always create new log instead of overwriting |
| `app/projects/page.tsx` | Set `activeTab` to `"projects"` |
| `app/dashboard/page.tsx` | Use `activeTab` to conditionally render views |
| `src/components/layout/DashboardShell.tsx` | Fix navigation URLs for intern/discussions |
| `src/components/techlead/InternDetail.tsx` | Fix fake marks calculation |
| `src/views/intern/InternDashboard.tsx` | Add AskTeamThread inline render |
| `app/dashboard/users/page.tsx` | Create (new file) |
| `app/dashboard/audit/page.tsx` | Create (new file) |
| `app/dashboard/moderation/page.tsx` | Create (new file) |
| `app/dashboard/settings/page.tsx` | Create (new file) |
| `src/views/intern/MyProjects.tsx` | Remove `.ts` from import |
| `src/components/intern/DailyLogForm.tsx` | Remove `.ts` from import |
| `src/components/intern/AskTeamThread.tsx` | Remove `.ts` from imports |

---

## Verification Steps

1. Log in as each demo user (intern, tech_lead, manager, super_admin)
2. **Intern**: Start day → verify tech lead dashboard shows "Started today"; Submit log → verify it appears in past logs; Click "My Projects" → verify projects page loads; Click "Ask the Team" → verify discussions loads
3. **Tech Lead**: Verify roster shows "Started/Ended" status for interns; Click "Ask the Team" → verify discussions loads
4. **Super Admin**: Click each sidebar item (Users, Audit, Moderation, Settings) → verify each page loads with correct content
5. Run `npx tsc --noEmit` to verify no type errors