-- AlterTable
ALTER TABLE "public"."Trip" ADD COLUMN     "templateId" UUID;

-- CreateIndex
CREATE INDEX "Trip_templateId_idx" ON "public"."Trip"("templateId");

-- AddForeignKey
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."TripTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
