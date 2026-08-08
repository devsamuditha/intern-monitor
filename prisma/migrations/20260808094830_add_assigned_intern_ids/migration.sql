-- AlterTable
ALTER TABLE "Project" ADD COLUMN "assignedInternIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
