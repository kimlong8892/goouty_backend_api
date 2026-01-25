-- AlterTable
ALTER TABLE "public"."Activity" ADD COLUMN     "isNotificationOnCreate" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Day" ADD COLUMN     "isNotificationOnCreate" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Trip" ADD COLUMN     "isNotificationOnCreate" BOOLEAN NOT NULL DEFAULT true;
