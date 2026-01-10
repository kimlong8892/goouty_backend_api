/*
  Warnings:

  - You are about to drop the column `userId` on the `TripTemplate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TripTemplate" DROP CONSTRAINT "TripTemplate_userId_fkey";

-- DropIndex
DROP INDEX "public"."TripTemplate_userId_idx";

-- AlterTable
ALTER TABLE "public"."TripTemplate" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "public"."_UserWishlist" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_UserWishlist_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserWishlist_B_index" ON "public"."_UserWishlist"("B");

-- AddForeignKey
ALTER TABLE "public"."_UserWishlist" ADD CONSTRAINT "_UserWishlist_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."TripTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserWishlist" ADD CONSTRAINT "_UserWishlist_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
