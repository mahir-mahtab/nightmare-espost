/*
  Warnings:

  - Changed the type of `role` on the `players` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('ES_P', 'NES_P', 'IGL', 'Support', 'Assaulter', 'Sniper');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "owner_coins" INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN     "player_base_price" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable - Handle existing role data by setting to default
ALTER TABLE "players" 
ALTER COLUMN "role" TYPE "PlayerRole" USING 'IGL'::"PlayerRole";
