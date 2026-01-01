/*
  Warnings:

  - A unique constraint covering the columns `[tripId,debtorId,creditorId]` on the table `PaymentSettlement` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PaymentSettlement_tripId_debtorId_creditorId_key" ON "public"."PaymentSettlement"("tripId", "debtorId", "creditorId");
