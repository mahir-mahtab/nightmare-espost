-- Drop old runtime columns from auction lots
ALTER TABLE "auction_lots" DROP CONSTRAINT IF EXISTS "auction_lots_current_owner_id_fkey";

ALTER TABLE "auction_lots"
  DROP COLUMN IF EXISTS "current_bid",
  DROP COLUMN IF EXISTS "current_owner_id",
  DROP COLUMN IF EXISTS "time_left";

-- Add server-authoritative lot end time
ALTER TABLE "auction_lots"
  ADD COLUMN IF NOT EXISTS "ends_at" TIMESTAMP(3);
