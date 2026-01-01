/*
  Warnings:

  - You are about to drop the `District` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."District" DROP CONSTRAINT "District_provinceId_fkey";

-- DropTable
DROP TABLE "public"."District";
