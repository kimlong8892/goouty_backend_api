/*
  Warnings:

  - You are about to drop the column `endDate` on the `Trip` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Trip" DROP COLUMN "endDate";

-- AlterTable
ALTER TABLE "public"."TripTemplate" ADD COLUMN     "fee" DECIMAL(20,2) NOT NULL DEFAULT 0;
