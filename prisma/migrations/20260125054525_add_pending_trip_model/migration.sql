-- CreateEnum
CREATE TYPE "public"."PendingTripStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."PendingTrip" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "status" "public"."PendingTripStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PendingTrip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingTrip_userId_idx" ON "public"."PendingTrip"("userId");

-- CreateIndex
CREATE INDEX "PendingTrip_status_idx" ON "public"."PendingTrip"("status");

-- AddForeignKey
ALTER TABLE "public"."PendingTrip" ADD CONSTRAINT "PendingTrip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
