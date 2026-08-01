# InternTrack - Custom Username/Password Auth Plan

## Current State Assessment

The project currently uses Supabase Auth. The user wants to replace it with a custom username/password system where:
- Only Super Admin and Manager can create users
- New users get auto-generated unique username + password
- Credentials are stored hashed in the database
- Login validates against the database directly

---

## Phase 1: Database Schema Changes

**Goal:** Add fields needed for custom auth.

1. **Remove Supabase Auth dependency:**
   - Remove `supabaseAuthId` field from `User` model (added in previous migration)
   - Drop the unique index on `supabaseAuthId`

2. **Add auth fields to `User` model:**
   ```
   username        String   @unique
   passwordHash    String
   mustChangePassword Boolean @default(true)
   ```

3. **Create migration:**
   - Add `username` (unique), `passwordHash`, `mustChangePassword` columns
   - Remove `supabaseAuthId` column and its indexes

---

## Phase 2: Remove Supabase Auth Infrastructure

**Goal:** Strip out all Supabase Auth dependencies from the codebase.

1. **Remove Supabase client files:**
   - Delete `src/lib/supabaseClient.ts` (browser-side auth client)
   - Delete `src/lib/supabase.ts` (admin client) — keep only if storage uploads are needed, otherwise delete
   - Remove `@supabase/supabase-js` and `@supabase/ssr` from dependencies in `package.json`

2. **Remove Supabase Auth from API routes:**
   - `app/api/auth/login/route.ts` — rewrite to check username + passwordHash
   - `app/api/auth/register/route.ts` — rewrite to create user with hashed password
   - `app/api/auth/check-email/route.ts` — remove or repurpose for username checks
   - `app/api/_lib/withAuth.ts` — rewrite to use session cookies/JWT instead of Supabase JWT

3. **Remove Supabase Auth from frontend:**
   - `src/context/AuthContext.tsx` — remove all Supabase auth calls, replace with custom login
   - `src/services/api.ts` — remove Supabase token handling from `getAuthHeaders()`

4. **Update environment variables:**
   - Remove `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from `.env` and `.env.example`
   - Add `SESSION_SECRET` for signing session cookies/JWT

---

## Phase 3: Implement Custom Auth System

**Goal:** Build username/password auth from scratch.

### 3.1 Backend — Auth Routes

**`app/api/auth/login/route.ts`:**
1. Accept `username` and `password` in body
2. Find user by `username` in database
3. Compare `password` with stored `passwordHash` using bcrypt
4. If valid, create session (JWT or session cookie)
5. Return user data (without passwordHash)

**`app/api/auth/register/route.ts` (admin-only):**
1. Accept `name`, `username`, `password`, `role`, `techLeadId`
2. Validate `username` is unique
3. Hash password with bcrypt
4. Create user in database with `mustChangePassword: true`
5. Return the generated plaintext password ONCE (so admin can share it)
6. **Important:** After this response, the plaintext password is never shown again

**`app/api/auth/check-username/route.ts`:**
1. Accept `username`
2. Return whether username already exists

**`app/api/auth/logout/route.ts`:**
1. Clear session cookie/JWT

### 3.2 Backend — Session Management

**Option A: JWT (simpler, stateless)**
- Create signed JWT with `userId`, `role`, `expiry`
- Store in HttpOnly cookie
- Verify on each request via middleware

**Option B: Session cookies (more control, requires DB table)**
- Create `Session` model in Prisma
- Store session token hash in DB
- Verify on each request

**Recommended: Option A (JWT)** — simpler for this app, no extra DB table needed.

### 3.3 Backend — Middleware

**`middleware.ts`:**
1. Read session cookie from request
2. Verify JWT signature and expiry
3. If valid, attach user to request headers
4. If invalid/missing, redirect to login for protected routes
5. Protect all `/dashboard/*` and `/api/*` routes except public ones

### 3.4 Backend — API Auth

**`app/api/_lib/withAuth.ts`:**
1. Read user from request (set by middleware)
2. Look up user in database by ID
3. Check `isActive` status
4. Return user or throw 401/403

---

## Phase 4: Frontend Auth Updates

**Goal:** Update all frontend auth flows to use username/password.

1. **`src/context/AuthContext.tsx`:**
   - Remove all Supabase imports and calls
   - Add `login(username, password)` → calls `/api/auth/login`
   - Add `signUp(...)` → calls admin user creation endpoint
   - Add `logout()` → calls `/api/auth/logout`
   - On mount, check session cookie via `/api/auth/session` endpoint
   - Store user in React state + localStorage (for persistence)

2. **`src/views/auth/Login.tsx`:**
   - Change form fields: email → username, add password
   - Remove demo quick-login buttons (already done)
   - Show password field prominently

3. **`src/services/api.ts`:**
   - Remove `getAuthHeaders()` Supabase token logic
   - Rely on HttpOnly cookies for auth (no manual headers needed)
   - Add `/api/auth/session` call to check current session

---

## Phase 5: User Management (Super Admin / Manager)

**Goal:** Only authorized roles can create users, with auto-generated credentials.

1. **`src/views/superadmin/SuperAdminUsers.tsx` & `src/components/manager/UserManagement.tsx`:**
   - Add "Create User" form with fields: name, role, tech lead assignment (if intern)
   - On submit, call `/api/auth/register` (protected, admin-only)
   - Backend generates unique username + random password
   - Display generated credentials in a modal/alert **ONE TIME ONLY**
   - User must change password on first login (`mustChangePassword` flag)

2. **Username generation logic:**
   - Format: `firstname.lastname` or `first.last` + random 2 digits if collision
   - Example: `alex.rivera`, `alex.rivera2`

3. **Password generation logic:**
   - 12 characters, mix of upper/lower/numbers/symbols
   - Example: `X7$mP9@qL2#v`

4. **First login flow:**
   - If `mustChangePassword` is true, redirect to `/change-password`
   - User enters current password + new password
   - Update `passwordHash` and set `mustChangePassword: false`

---

## Phase 6: Security Hardening

**Goal:** Ensure the custom auth is secure.

1. **Password hashing:** Use bcrypt with cost factor 12+
2. **Session cookies:** HttpOnly, Secure, SameSite=Strict, short expiry (1 hour)
3. **Rate limiting:** Add rate limiting to `/api/auth/login` to prevent brute force
4. **JWT signing:** Use strong `SESSION_SECRET` env var (min 32 chars)
5. **Input validation:** Zod schemas for all auth endpoints

---

## Phase 7: Cleanup & Migration

**Goal:** Remove all Supabase remnants.

1. **Delete Supabase files:**
   - `src/lib/supabaseClient.ts`
   - `src/lib/supabase.ts` (or strip it down to just storage if needed)
   - Any Supabase-related imports in components

2. **Remove Supabase packages:**
   - Uninstall `@supabase/supabase-js` and `@supabase/ssr`

3. **Update `.env.example`:**
   - Remove Supabase vars
   - Add `SESSION_SECRET`
   - Document auth setup

4. **Update `README.md`:**
   - Remove Supabase setup instructions
   - Add custom auth instructions

---

## Open Questions

1. **Session storage:** JWT vs database sessions?
   - **Recommended:** JWT with HttpOnly cookie. Simpler, no extra DB table, works well for this app size.

2. **Password reset:** Should we implement "forgot password"?
   - **Out of scope for initial implementation.** Can be added later with email integration.

3. **Username format:** Should username be email or custom string?
   - **Recommended:** Custom username (e.g., `alex.rivera`). More flexible, separates login from contact info.

---

## Execution Order Summary

| Step | Action |
|------|--------|
| 1 | Remove `supabaseAuthId` from Prisma schema, create migration |
| 2 | Add `username`, `passwordHash`, `mustChangePassword` to User model |
| 3 | Delete Supabase client files and uninstall packages |
| 4 | Rewrite `app/api/auth/login/route.ts` for username/password |
| 5 | Rewrite `app/api/auth/register/route.ts` for admin user creation |
| 6 | Implement JWT session management in `middleware.ts` |
| 7 | Rewrite `withAuth.ts` to use JWT instead of Supabase |
| 8 | Rewrite `AuthContext.tsx` for custom auth |
| 9 | Update `Login.tsx` UI for username/password |
| 10 | Update user management components with create-user flow |
| 11 | Add `/change-password` page and endpoint |
| 12 | Add rate limiting to login endpoint |
| 13 | Update `.env.example` and `README.md` |
| 14 | Test end-to-end: admin creates user → user logs in → changes password |
