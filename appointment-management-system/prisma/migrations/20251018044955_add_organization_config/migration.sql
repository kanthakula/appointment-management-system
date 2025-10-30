/*
  Warnings:

  - Added the required column `email` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Timeslot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Registration" DROP CONSTRAINT "Registration_userId_fkey";

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "partySize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Timeslot" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "remaining" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "OrganizationConfig" (
    "id" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL DEFAULT 'DarshanFlow',
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "secondaryColor" TEXT NOT NULL DEFAULT '#10B981',
    "accentColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "backgroundColor" TEXT NOT NULL DEFAULT '#F9FAFB',
    "textColor" TEXT NOT NULL DEFAULT '#111827',
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "emailWhitelist" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
