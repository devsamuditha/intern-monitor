CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

ALTER TABLE "Project"
ADD COLUMN "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "startDate" TIMESTAMP,
ADD COLUMN "endDate" TIMESTAMP,
ADD COLUMN "assignedTechLeadId" TEXT;

CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_startDate_idx" ON "Project"("startDate");
CREATE INDEX "Project_assignedTechLeadId_idx" ON "Project"("assignedTechLeadId");
