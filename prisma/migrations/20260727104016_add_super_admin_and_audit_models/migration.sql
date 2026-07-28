ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SystemSetting_key_key" UNIQUE ("key")
);

CREATE TABLE "ContentFlag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ContentFlag_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL;

ALTER TABLE "ContentFlag" ADD CONSTRAINT "ContentFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX "ContentFlag_userId_idx" ON "ContentFlag"("userId");
CREATE INDEX "ContentFlag_contentId_idx" ON "ContentFlag"("contentId");
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"("key");