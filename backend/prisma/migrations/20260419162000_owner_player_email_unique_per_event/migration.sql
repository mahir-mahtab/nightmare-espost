-- Switch from global email uniqueness to per-event email uniqueness

DROP INDEX IF EXISTS "owners_email_key";
DROP INDEX IF EXISTS "players_email_key";

CREATE UNIQUE INDEX "owners_event_id_email_key" ON "owners"("event_id", "email");
CREATE UNIQUE INDEX "players_event_id_email_key" ON "players"("event_id", "email");
