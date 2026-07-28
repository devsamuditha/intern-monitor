ALTER TABLE "AuditLog" ADD COLUMN "targetType" TEXT;

CREATE INDEX "AuditLog_targetType_idx" ON "AuditLog"("targetType");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
