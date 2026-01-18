-- CreateTable
CREATE TABLE "public"."Template" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "message" TEXT,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Template_code_key" ON "public"."Template"("code");
