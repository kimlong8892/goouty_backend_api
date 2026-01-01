/*
  Warnings:

  - You are about to drop the column `destination` on the `Trip` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Trip" DROP COLUMN "destination",
ADD COLUMN     "provinceId" UUID;

-- CreateIndex
CREATE INDEX "Trip_provinceId_idx" ON "public"."Trip"("provinceId");

-- AddForeignKey
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "public"."Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;
