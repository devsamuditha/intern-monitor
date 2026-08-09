-- Performance indexes migration
-- Run this in Supabase Dashboard > SQL Editor if direct migration fails

-- DailyLog composite index for common dashboard queries
CREATE INDEX IF NOT EXISTS "DailyLog_organizationId_internId_date_idx" 
  ON "DailyLog" ("organizationId", "internId", "date");

-- Task composite index for assigned tasks + status queries
CREATE INDEX IF NOT EXISTS "Task_assignedToId_status_idx" 
  ON "Task" ("assignedToId", "status");

-- Mistake composite index for intern + resolved filters
CREATE INDEX IF NOT EXISTS "Mistake_internId_resolved_idx" 
  ON "Mistake" ("internId", "resolved");

-- Mark composite index for intern + date queries
CREATE INDEX IF NOT EXISTS "Mark_internId_date_idx" 
  ON "Mark" ("internId", "date");

-- DaySession composite index for today's sessions by org + status
CREATE INDEX IF NOT EXISTS "DaySession_organizationId_date_status_idx" 
  ON "DaySession" ("organizationId", "date", "status");
