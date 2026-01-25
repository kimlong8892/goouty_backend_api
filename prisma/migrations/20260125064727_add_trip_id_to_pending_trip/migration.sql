-- AlterTable
ALTER TABLE "public"."PendingTrip" ADD COLUMN     "tripId" UUID;

-- CreateIndex
CREATE INDEX "PendingTrip_tripId_idx" ON "public"."PendingTrip"("tripId");

-- AddForeignKey
ALTER TABLE "public"."PendingTrip" ADD CONSTRAINT "PendingTrip_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
