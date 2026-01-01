-- AlterTable
ALTER TABLE "public"."TripMember" ADD COLUMN     "invitedEmail" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "TripMember_invitedEmail_tripId_idx" ON "public"."TripMember"("invitedEmail", "tripId");
