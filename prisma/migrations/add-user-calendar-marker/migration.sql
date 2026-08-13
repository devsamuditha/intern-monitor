-- CreateTable
CREATE TABLE "UserCalendarMarker" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCalendarMarker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCalendarMarker_userId_date_key" ON "UserCalendarMarker"("userId", "date");

-- CreateIndex
CREATE INDEX "UserCalendarMarker_userId_idx" ON "UserCalendarMarker"("userId");

-- CreateIndex
CREATE INDEX "UserCalendarMarker_date_idx" ON "UserCalendarMarker"("date");

-- CreateIndex
CREATE INDEX "UserCalendarMarker_organizationId_idx" ON "UserCalendarMarker"("organizationId");

-- AddForeignKey
ALTER TABLE "UserCalendarMarker" ADD CONSTRAINT "UserCalendarMarker_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCalendarMarker" ADD CONSTRAINT "UserCalendarMarker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
