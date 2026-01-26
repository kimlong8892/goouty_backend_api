-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "lastUpdatedById" UUID;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
