# Consolidate Duplicate app/ Directories and Fix Config Issues

## Goal
Remove the duplicate `src/app/` directory that Next.js ignores, standardize all imports, secure `.env`, update the README, and verify the build succeeds.

---

## Task 1 -- Remove Duplicate `src/app/` Directory

**What:** Delete the entire `src/app/` directory tree (it is a duplicate of root `app/` and is not used by Next.js).

**Why:** Next.js App Router uses the `app/` directory at the project root. All imports in root `app/` files resolve correctly against `@/*` -> `"./*"`. The `src/app/` copy is stale (last edited 7/30 vs root `app/` at 7/28-29 for most files) and creates confusion.

**Actions:**
1. Delete `D:\Projects\monitor-app-1.2\src\app\` recursively
2. Verify that `D:\Projects\monitor-app-1.2\app\` still has all routing files (it does: `app/layout.tsx`, `app/page.tsx`, `app/api/`, `app/dashboard/`, etc.)
3. Confirm no other files import from `src/app/` paths (grep for `from "@/src/app/`)

**Risk:** None -- `src/app/` is dead code that Next.js never routes through. All page components and API logic live at root `app/` or in `src/components/`, `src/pages/`, `src/lib/`, etc.

**Acceptance:** `src/app/` no longer exists. `npm run build` succeeds.

---

## Task 2 -- Standardize Import Paths Across All Source Files

**What:** Ensure every import in the project uses a consistent `@/` alias pattern that resolves correctly against the repo root (`"@/*"` -> `"./*"` in `tsconfig.json`).

**Why:** Root `app/` API routes import from a mix of `"@/app/api/_lib/..."`, `"@/src/db/prisma"`, and `"@/lib/..."` -- these are inconsistent and some resolve incorrectly depending on file location.

**Actions:**
1. Grep all source files for imports using `"@/src/` and verify each resolves correctly:
   - `"@/src/db/prisma"` -> resolves to `./src/db/prisma.ts` (exists at root level -- correct)
   - `"@/src/lib/..."` -> resolves to `./src/lib/...` (exists -- correct)
   - `"@/src/components/..."` -- if used, verify it resolves
   - `"@/src/pages/..."` -- if used, verify it resolves
   - `"@/src/services/..."` -- if used, verify it resolves
2. Grep for `"@/lib/..."` imports -- these resolve to `./lib/...` which does NOT exist (files are at `src/lib/`). Replace with `"@/src/lib/..."`.
3. Grep for `"@/app/api/_lib/..."` imports -- these resolve to `./app/api/_lib/...` which exists at root -- correct.
4. Fix any other inconsistent imports found in Step 1 grep.
5. After fixing, run `npx tsc --noEmit` to verify no broken imports.

**Risk:** Low -- just string replacements in import statements.

**Acceptance:** `npx tsc --noEmit` reports zero errors. All imports use consistent `@/` pattern.

---

## Task 3 -- Secure `.env` and `.env.example`

**What:** Remove real credentials from `.env` and ensure `.env.example` has only placeholder values. Ensure `.env` is in `.gitignore`.

**Why:** `.env` currently contains live Supabase connection string, service role key, and superadmin password. These are sensitive and should never be committed.

**Actions:**
1. Verify `.env` is listed in `.gitignore` (it is: `.env*` with `!.env.example` is already in `.gitignore`)
2. Replace `.env` credential values with placeholder format matching `.env.example`:
   - `DATABASE_URL=postgresql://postgres:password@localhost:5432/interntrack`
   - `DIRECT_URL=postgresql://postgres:password@localhost:5432/interntrack`
   - `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key`
   - `SUPERADMIN_EMAIL=superadmin@company.com`
   - `SUPERADMIN_PASSWORD=change-me`
3. Keep `APP_URL=http://localhost:3000` as-is (non-sensitive)
4. Document in a `.env.setup` or comment in `.env.example` how to obtain each value

**Risk:** Developers who need the real credentials must re-add them to their local `.env`.

**Acceptance:** `.env` contains no live credentials. `.env.example` has all required placeholder keys.

---

## Task 4 -- Update README for Next.js Stack

**What:** Rewrite README "Tech Stack", "Setup", and "Production" sections to reflect the current Next.js architecture.

**Why:** README currently describes Vite 6 + Express 4 stack, which is the pre-conversion architecture. Next.js 15, Prisma, Supabase, and Tailwind v4 are the actual stack.

**Actions:**
1. Update **Tech Stack** section:
   - Replace "Vite 6, Tailwind CSS v4" -> "Next.js 15, Tailwind CSS v4"
   - Remove "Express 4" (no longer used; API routes are in Next.js App Router)
   - Keep PostgreSQL, Prisma, Supabase, Gemini, Realtime
2. Update **Setup** section:
   - Replace `npm install` context -- keep as-is but clarify Next.js commands
   - Replace `npx prisma migrate dev` with `npx prisma migrate deploy` (production-grade)
   - Keep `npx prisma db seed` or `npm run seed`
   - Replace `npm run dev` -> kept, but clarify it runs Next.js dev server
   - Remove references to Vite/Express/tsx where they don't belong
3. Update **Production** section:
   - Keep `npm run build` and `npm start` (these already work for Next.js)
4. Update `metadata.json` capabilities if relevant

**Risk:** None -- documentation-only change.

**Acceptance:** README accurately describes the Next.js stack and setup process.

---

## Task 5 -- Run Build Verification

**What:** Run `npm run build` and confirm zero errors.

**Actions:**
1. Ensure `node_modules` are installed (`npm install` if needed)
2. Run `npm run build`
3. Verify output: no TypeScript errors, no route collisions, no missing imports
4. If build fails, diagnose and fix any issues before completing the plan

**Risk:** Build failures may surface additional issues not caught by `tsc --noEmit` (e.g., runtime route collisions between `app/` and `src/app/` if any files remain).

**Acceptance:** `npm run build` completes with zero errors.

---

## Execution Order
1. Task 1 (delete `src/app/`) -- 5 min
2. Task 2 (standardize imports + `tsc --noEmit`) -- 15 min
3. Task 3 (sanitize `.env`) -- 5 min
4. Task 4 (update README) -- 10 min
5. Task 5 (build verification) -- 15 min

---

## Open Questions
- After deleting `src/app/`, are there any CI/CD configs (GitHub Actions, etc.) that reference `src/app/` paths? Check `.github/`, `.vscode/`, and `scripts/` for such references.
- Does `src/app/page.tsx` or `src/app/route.ts` exist as a separate entry point? Need to verify no orphan files remain after deletion.
