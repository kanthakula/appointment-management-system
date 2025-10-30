-- Migration: Add partySize and update Registration table to support standalone bookings
-- Run this with: psql "$DATABASE_URL" -f scripts/add_party_size_migration.sql

-- Ensure remaining column exists and is NOT NULL on Timeslot
ALTER TABLE "Timeslot" ALTER COLUMN "remaining" SET DEFAULT 1;
ALTER TABLE "Timeslot" ALTER COLUMN "remaining" DROP NOT NULL;
UPDATE "Timeslot" SET "remaining" = "capacity" WHERE "remaining" IS NULL;
ALTER TABLE "Timeslot" ALTER COLUMN "remaining" SET NOT NULL;

-- Add fullName, email, phone columns to Registration if they don't exist
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "fullName" text;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "phone" text;

-- Make userId optional (allow devotees without user accounts)
ALTER TABLE "Registration" ALTER COLUMN "userId" DROP NOT NULL;

-- Ensure partySize exists with default 1
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "partySize" integer DEFAULT 1;
UPDATE "Registration" SET "partySize" = 1 WHERE "partySize" IS NULL;
ALTER TABLE "Registration" ALTER COLUMN "partySize" SET NOT NULL;

-- Set default values for existing registrations (back-populate from User table where possible)
UPDATE "Registration" r
SET 
  "fullName" = COALESCE(r."fullName", u."name", 'Guest'),
  "email" = COALESCE(r."email", u."email", ''),
  "phone" = COALESCE(r."phone", u."phone", '')
FROM "User" u
WHERE r."userId" = u."id" AND (r."fullName" IS NULL OR r."email" IS NULL OR r."phone" IS NULL);

-- Set NOT NULL constraints after back-populating
UPDATE "Registration" SET "fullName" = 'Guest' WHERE "fullName" IS NULL OR "fullName" = '';
UPDATE "Registration" SET "email" = '' WHERE "email" IS NULL;
UPDATE "Registration" SET "phone" = '' WHERE "phone" IS NULL;

ALTER TABLE "Registration" ALTER COLUMN "fullName" SET NOT NULL;
ALTER TABLE "Registration" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "Registration" ALTER COLUMN "phone" SET NOT NULL;

-- Show summary
SELECT 'Migration completed successfully. Summary:' as status;
SELECT 
  (SELECT COUNT(*) FROM "Timeslot") as total_timeslots,
  (SELECT COUNT(*) FROM "Registration") as total_registrations,
  (SELECT SUM("remaining") FROM "Timeslot") as total_remaining_seats;
