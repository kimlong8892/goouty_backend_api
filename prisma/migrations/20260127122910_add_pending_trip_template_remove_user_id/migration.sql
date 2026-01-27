/*
  Warnings:

  - You are about to drop the column `userId` on the `PendingTripTemplate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PendingTripTemplate" DROP CONSTRAINT "PendingTripTemplate_userId_fkey";

-- DropIndex
DROP INDEX "public"."PendingTripTemplate_userId_idx";

-- AlterTable
ALTER TABLE "public"."PendingTripTemplate" DROP COLUMN "userId";
