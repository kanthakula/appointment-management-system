-- AlterTable
ALTER TABLE "Timeslot" ADD COLUMN     "autoPublishDateTime" TIMESTAMP(3),
ADD COLUMN     "autoPublishEnabled" BOOLEAN DEFAULT false,
ADD COLUMN     "autoPublishHoursBefore" INTEGER,
ADD COLUMN     "autoPublishType" TEXT,
ADD COLUMN     "autoPublished" BOOLEAN NOT NULL DEFAULT false;
