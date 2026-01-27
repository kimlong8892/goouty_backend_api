-- CreateTable
CREATE TABLE "public"."PendingTripTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "tripTemplateId" UUID,
    "status" "public"."PendingTripStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PendingTripTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingTripTemplate_url_key" ON "public"."PendingTripTemplate"("url");

-- CreateIndex
CREATE INDEX "PendingTripTemplate_userId_idx" ON "public"."PendingTripTemplate"("userId");

-- CreateIndex
CREATE INDEX "PendingTripTemplate_status_idx" ON "public"."PendingTripTemplate"("status");

-- CreateIndex
CREATE INDEX "PendingTripTemplate_tripTemplateId_idx" ON "public"."PendingTripTemplate"("tripTemplateId");

-- AddForeignKey
ALTER TABLE "public"."PendingTripTemplate" ADD CONSTRAINT "PendingTripTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PendingTripTemplate" ADD CONSTRAINT "PendingTripTemplate_tripTemplateId_fkey" FOREIGN KEY ("tripTemplateId") REFERENCES "public"."TripTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
