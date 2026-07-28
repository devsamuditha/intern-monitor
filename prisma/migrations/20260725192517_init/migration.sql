-- CreateEnum
CREATE TYPE "Role" AS ENUM ('INTERN', 'TECH_LEAD', 'MANAGER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "MistakeSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "techLeadId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "githubUrl" TEXT NOT NULL,
    "techStack" TEXT[],
    "ownerId" TEXT NOT NULL,
    "screenshots" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "technologies" TEXT[],
    "changes" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "githubUrl" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "completedAt" TEXT,
    "score" INTEGER,
    "comment" TEXT,
    "blockers" TEXT,
    "prLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mark" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "givenById" TEXT NOT NULL,
    "relatedLogId" TEXT,
    "relatedTaskId" TEXT,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mistake" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "flaggedById" TEXT NOT NULL,
    "relatedLogId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "severity" "MistakeSeverity" NOT NULL,
    "date" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mistake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DaySession" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startedAt" TEXT NOT NULL,
    "endedAt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "todayProject" TEXT,
    "todayPlan" TEXT,
    "questions" TEXT,
    "gitLink" TEXT,
    "endJournal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DaySession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_techLeadId_idx" ON "User"("techLeadId");

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

-- CreateIndex
CREATE INDEX "DailyLog_internId_idx" ON "DailyLog"("internId");

-- CreateIndex
CREATE INDEX "DailyLog_projectId_idx" ON "DailyLog"("projectId");

-- CreateIndex
CREATE INDEX "DailyLog_date_idx" ON "DailyLog"("date");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_assignedById_idx" ON "Task"("assignedById");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Mark_internId_idx" ON "Mark"("internId");

-- CreateIndex
CREATE INDEX "Mark_givenById_idx" ON "Mark"("givenById");

-- CreateIndex
CREATE INDEX "Mark_relatedLogId_idx" ON "Mark"("relatedLogId");

-- CreateIndex
CREATE INDEX "Mark_relatedTaskId_idx" ON "Mark"("relatedTaskId");

-- CreateIndex
CREATE INDEX "Mistake_internId_idx" ON "Mistake"("internId");

-- CreateIndex
CREATE INDEX "Mistake_flaggedById_idx" ON "Mistake"("flaggedById");

-- CreateIndex
CREATE INDEX "Mistake_relatedLogId_idx" ON "Mistake"("relatedLogId");

-- CreateIndex
CREATE INDEX "Message_fromId_idx" ON "Message"("fromId");

-- CreateIndex
CREATE INDEX "Message_toId_idx" ON "Message"("toId");

-- CreateIndex
CREATE INDEX "Question_internId_idx" ON "Question"("internId");

-- CreateIndex
CREATE INDEX "Reply_questionId_idx" ON "Reply"("questionId");

-- CreateIndex
CREATE INDEX "Reply_authorId_idx" ON "Reply"("authorId");

-- CreateIndex
CREATE INDEX "DaySession_internId_idx" ON "DaySession"("internId");

-- CreateIndex
CREATE INDEX "DaySession_date_idx" ON "DaySession"("date");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_techLeadId_fkey" FOREIGN KEY ("techLeadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_internId_fkey" FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_internId_fkey" FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_givenById_fkey" FOREIGN KEY ("givenById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_relatedLogId_fkey" FOREIGN KEY ("relatedLogId") REFERENCES "DailyLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_relatedTaskId_fkey" FOREIGN KEY ("relatedTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_internId_fkey" FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_flaggedById_fkey" FOREIGN KEY ("flaggedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_relatedLogId_fkey" FOREIGN KEY ("relatedLogId") REFERENCES "DailyLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_internId_fkey" FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DaySession" ADD CONSTRAINT "DaySession_internId_fkey" FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
