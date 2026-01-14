/*
  Warnings:

  - You are about to drop the column `date` on the `Day` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Day" DROP COLUMN "date";

-- AlterTable
ALTER TABLE "public"."Trip" ADD COLUMN     "endDate" TIMESTAMP(3);
