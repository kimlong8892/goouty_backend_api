/*
  Warnings:

  - Added the required column `type` to the `Otp` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."OtpType" AS ENUM ('FORGOT_PASSWORD', 'VERIFY_EMAIL', 'LOGIN');

-- DropIndex
DROP INDEX "public"."Otp_email_idx";

-- AlterTable
ALTER TABLE "public"."Otp" ADD COLUMN     "type" "public"."OtpType" NOT NULL;

-- CreateIndex
CREATE INDEX "Otp_email_type_idx" ON "public"."Otp"("email", "type");
