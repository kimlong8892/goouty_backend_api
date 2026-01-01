/*
  Warnings:

  - Added the required column `amount` to the `ExpenseParticipant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ExpenseParticipant" ADD COLUMN     "amount" DECIMAL(20,2) NOT NULL;
