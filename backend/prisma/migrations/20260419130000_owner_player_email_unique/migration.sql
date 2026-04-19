-- AlterTable
ALTER TABLE "owners"
ADD COLUMN "email" TEXT;

-- Backfill existing owners with deterministic unique placeholders
UPDATE "owners"
SET "email" = CONCAT('owner+', "id", '@placeholder.local')
WHERE "email" IS NULL;

ALTER TABLE "owners"
ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "owners_email_key" ON "owners"("email");

-- AlterTable
ALTER TABLE "players"
ADD COLUMN "email" TEXT;

-- Backfill existing players with deterministic unique placeholders
UPDATE "players"
SET "email" = CONCAT('player+', "id", '@placeholder.local')
WHERE "email" IS NULL;

ALTER TABLE "players"
ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "players_email_key" ON "players"("email");
