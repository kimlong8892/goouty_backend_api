/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `TripMember` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."TripMember" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "invitedById" UUID,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'accepted';

-- CreateIndex
CREATE UNIQUE INDEX "TripMember_inviteToken_key" ON "public"."TripMember"("inviteToken");
