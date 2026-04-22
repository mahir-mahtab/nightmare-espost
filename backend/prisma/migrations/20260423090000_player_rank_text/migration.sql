-- Convert player rank_point from INTEGER to TEXT for rank string support.
ALTER TABLE "players" ALTER COLUMN "rank_point" DROP DEFAULT;

ALTER TABLE "players"
ALTER COLUMN "rank_point" TYPE TEXT
USING "rank_point"::text;
