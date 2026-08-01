-- Custom username/password auth fields replace Supabase Auth linkage
-- Remove Supabase Auth id column and its indexes
DROP INDEX IF EXISTS "User_supabaseAuthId_idx";
DROP INDEX IF EXISTS "User_supabaseAuthId_key";
ALTER TABLE "User" DROP COLUMN IF EXISTS "supabaseAuthId";

-- Add custom auth columns
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- Username must be unique; backfill a placeholder so the unique constraint can be added safely on existing rows
UPDATE "User" SET "username" = LOWER("email") WHERE "username" IS NULL;
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Password hash is required; existing rows without one will be forced to reset on first login via mustChangePassword
UPDATE "User" SET "passwordHash" = '' WHERE "passwordHash" IS NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
