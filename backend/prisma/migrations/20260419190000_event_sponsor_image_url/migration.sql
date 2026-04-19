-- Add optional sponsor image URL for event cards
ALTER TABLE "events"
ADD COLUMN "sponsor_image_url" TEXT;
