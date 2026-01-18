-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'PAYMENT_COMPLETED';

-- AlterTable
ALTER TABLE "public"."PaymentSettlement" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(20,2);
