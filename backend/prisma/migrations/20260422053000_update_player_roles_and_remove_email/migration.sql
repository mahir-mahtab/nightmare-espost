-- Remove email uniqueness indexes before dropping the column.
DROP INDEX IF EXISTS "players_event_id_email_key";
DROP INDEX IF EXISTS "players_email_key";

-- Remove the email column from players table
ALTER TABLE "players" DROP COLUMN "email";

-- CreateEnum - Create new PlayerRole enum with updated values
CREATE TYPE "PlayerRole_new" AS ENUM ('IGL', 'Support', 'Assaulter', 'Rusher');

-- Alter existing enum column to use new type and remap deprecated values.
ALTER TABLE "players"
ALTER COLUMN "role" TYPE "PlayerRole_new"
USING (
	CASE
		WHEN "role"::text = 'Sniper' THEN 'Rusher'
		ELSE "role"::text
	END
)::"PlayerRole_new";

-- Drop old enum and rename new one
DROP TYPE "PlayerRole";
ALTER TYPE "PlayerRole_new" RENAME TO "PlayerRole";

