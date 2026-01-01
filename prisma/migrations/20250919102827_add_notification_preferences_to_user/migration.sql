-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushSubscription" TEXT;
