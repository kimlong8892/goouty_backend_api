-- AlterTable
ALTER TABLE "public"."Activity" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "lastUpdatedById" UUID;

-- AlterTable
ALTER TABLE "public"."Day" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "lastUpdatedById" UUID;

-- AlterTable
ALTER TABLE "public"."Trip" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "lastUpdatedById" UUID;

-- AddForeignKey
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Day" ADD CONSTRAINT "Day_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Day" ADD CONSTRAINT "Day_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
