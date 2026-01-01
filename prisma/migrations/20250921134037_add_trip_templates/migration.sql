-- CreateTable
CREATE TABLE "public"."TripTemplate" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "provinceId" UUID,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "TripTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TripTemplateDay" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dayOrder" INTEGER NOT NULL,
    "tripTemplateId" UUID NOT NULL,

    CONSTRAINT "TripTemplateDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TripTemplateActivity" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TEXT,
    "durationMin" INTEGER,
    "location" TEXT,
    "notes" TEXT,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "activityOrder" INTEGER NOT NULL,
    "dayId" UUID NOT NULL,

    CONSTRAINT "TripTemplateActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripTemplate_provinceId_idx" ON "public"."TripTemplate"("provinceId");

-- CreateIndex
CREATE INDEX "TripTemplate_userId_idx" ON "public"."TripTemplate"("userId");

-- CreateIndex
CREATE INDEX "TripTemplateDay_tripTemplateId_idx" ON "public"."TripTemplateDay"("tripTemplateId");

-- CreateIndex
CREATE INDEX "TripTemplateActivity_dayId_idx" ON "public"."TripTemplateActivity"("dayId");

-- AddForeignKey
ALTER TABLE "public"."TripTemplate" ADD CONSTRAINT "TripTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TripTemplate" ADD CONSTRAINT "TripTemplate_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "public"."Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TripTemplateDay" ADD CONSTRAINT "TripTemplateDay_tripTemplateId_fkey" FOREIGN KEY ("tripTemplateId") REFERENCES "public"."TripTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TripTemplateActivity" ADD CONSTRAINT "TripTemplateActivity_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."TripTemplateDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
