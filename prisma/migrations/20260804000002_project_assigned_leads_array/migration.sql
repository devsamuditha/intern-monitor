DROP INDEX IF EXISTS "Project_assignedTechLeadId_idx";
ALTER TABLE "Project" RENAME COLUMN "assignedTechLeadId" TO "assignedTechLeadIds";
ALTER TABLE "Project" ALTER COLUMN "assignedTechLeadIds" TYPE TEXT[] USING
  CASE
    WHEN "assignedTechLeadIds" IS NULL THEN ARRAY[]::TEXT[]
    ELSE ARRAY["assignedTechLeadIds"]
  END;
ALTER TABLE "Project" ALTER COLUMN "assignedTechLeadIds" SET DEFAULT '{}';
CREATE INDEX "Project_assignedTechLeadIds_idx" ON "Project" USING GIN ("assignedTechLeadIds");
