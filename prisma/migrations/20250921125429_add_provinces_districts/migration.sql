-- CreateTable
CREATE TABLE "public"."Province" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "divisionType" TEXT NOT NULL,
    "codename" TEXT NOT NULL,
    "phoneCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."District" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "divisionType" TEXT NOT NULL,
    "codename" TEXT NOT NULL,
    "provinceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Province_code_key" ON "public"."Province"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Province_codename_key" ON "public"."Province"("codename");

-- CreateIndex
CREATE INDEX "Province_code_idx" ON "public"."Province"("code");

-- CreateIndex
CREATE INDEX "Province_divisionType_idx" ON "public"."Province"("divisionType");

-- CreateIndex
CREATE UNIQUE INDEX "District_code_key" ON "public"."District"("code");

-- CreateIndex
CREATE UNIQUE INDEX "District_codename_key" ON "public"."District"("codename");

-- CreateIndex
CREATE INDEX "District_code_idx" ON "public"."District"("code");

-- CreateIndex
CREATE INDEX "District_provinceId_idx" ON "public"."District"("provinceId");

-- CreateIndex
CREATE INDEX "District_divisionType_idx" ON "public"."District"("divisionType");

-- AddForeignKey
ALTER TABLE "public"."District" ADD CONSTRAINT "District_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "public"."Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;
