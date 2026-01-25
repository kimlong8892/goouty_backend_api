-- AlterTable
ALTER TABLE "public"."Activity" ADD COLUMN     "templateId" UUID;

-- AlterTable
ALTER TABLE "public"."Day" ADD COLUMN     "templateId" UUID;

-- AddForeignKey
ALTER TABLE "public"."Day" ADD CONSTRAINT "Day_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."TripTemplateDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."TripTemplateActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
