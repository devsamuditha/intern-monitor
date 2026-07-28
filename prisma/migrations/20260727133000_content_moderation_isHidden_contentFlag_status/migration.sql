ALTER TABLE "Message" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Question" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Reply" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DailyLog" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ContentFlag" DROP COLUMN "resolved";
ALTER TABLE "ContentFlag" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "ContentFlag" ADD COLUMN "dismissedAt" TIMESTAMP(3);

CREATE INDEX "ContentFlag_status_idx" ON "ContentFlag"("status");
CREATE INDEX "Message_isHidden_idx" ON "Message"("isHidden");
CREATE INDEX "Question_isHidden_idx" ON "Question"("isHidden");
CREATE INDEX "Reply_isHidden_idx" ON "Reply"("isHidden");
CREATE INDEX "DailyLog_isHidden_idx" ON "DailyLog"("isHidden");
