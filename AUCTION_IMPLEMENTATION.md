# Current Auction Implementation

Last updated: 2026-04-20

This document describes the current auction implementation used by the backend and admin UI, including runtime behavior, APIs, socket events, auto-progress semantics, and known guardrails.

## 1. High-Level Architecture

The auction system has three core layers:

- API layer (Express controllers + routes)
- Service layer (business logic in auctionService and eventService)
- Realtime layer (Socket.IO ticker and state broadcasts)

Main files:

- backend/src/services/auctionService.ts
- backend/src/services/eventService.ts
- backend/src/controllers/auction.controller.ts
- backend/src/controllers/events.controller.ts
- backend/src/realtime/socketServer.ts
- backend/src/routes/auction.routes.ts
- backend/src/routes/events.routes.ts

## 2. Runtime State Model

Auction runtime state is stored in Redis per event under key:

- auction:{eventId}:state

Shape (logical):

- eventId: string
- activeLotId: string | null
- isRunning: boolean
- autoProgress: boolean
- lotDuration: number
- activeLotEndsAt: number | null (epoch ms)
- lastUpdatedAt: number
- liveBids: Record<lotId, { ownerId, amount, updatedAt }>

Important behavior:

- Runtime is the source of truth for currently active lot timing.
- DB lot statuses are persisted state; runtime carries ephemeral timer + live bid snapshot.

## 3. Data Model (DB)

Key DB entities used by auction flow:

- Event
- AuctionLot (status: PENDING | ACTIVE | SOLD | UNSOLD)
- Player (status: ACTIVE | SOLD | UNSOLD)
- Team / Owner (coin balance and ownership)

Auction progression uses:

- AuctionLot.status
- AuctionLot.lotOrder
- AuctionLot.createdAt
- AuctionLot.id

## 4. API Surface

### 4.1 Public/Event Session APIs

Under /api/events:

- POST /:eventId/auth/login
- POST /:eventId/signup/owner
- POST /:eventId/signup/player
- GET /:eventId/auction (requires event auth)

Auth middleware:

- requireEventAuth validates event session token and eventId/slug match.
- requireOwnerRole required for owner bidding path.

### 4.2 Auction Control APIs

Under /api/auction:

- GET /:eventId/state (event auth)
- POST /:eventId/bid (owner session)
- POST /:eventId/start (admin)
- POST /:eventId/stop (admin)
- POST /:eventId/next-lot (admin)
- PATCH /:eventId/runtime (admin; autoProgress toggle)
- POST /:eventId/extend-timer (admin)
- POST /:eventId/lots/settle-current (admin)
- POST /:eventId/lots/reset-pending (admin)
- POST /:eventId/lots/:lotId/status (admin)
- POST /:eventId/lots/:lotId/finalize (admin)
- POST /:eventId/manual-lot-override (admin)

## 5. Realtime / Ticker

Global ticker:

- Implemented in socketServer as a scheduled 1s setTimeout loop.
- Calls auctionService.getTickableEventIds() and tickAuction(eventId).

Concurrency control:

- tickerInFlight guard prevents overlapping global tick cycles.
- Per-event lock in auctionService (Redis NX lock) serializes event mutations.

Socket broadcasts:

- auction_state
- timer_tick
- new_bid
- lot_status_changed
- active_lot_changed
- auction_started
- auction_stopped
- auction_error

Admin joins event-specific realtime room with:

- join_admin_event

Event session clients join via:

- join_event

## 6. Core Flow Semantics

### 6.1 Start Auction

startAuction(eventId, autoProgress?) behavior:

- Select ACTIVE lot if present, else first PENDING lot.
- Activate lot and set endsAt if needed.
- Set runtime.isRunning = true.
- Set runtime.autoProgress only when explicit boolean is provided.
- Persist runtime and mark event LIVE.

### 6.2 Bidding

placeBid validates:

- Auction is running.
- Target lot is the active lot.
- Bid window not closed.
- Owner/team exists and has sufficient coins.
- Amount is greater than current bid.

Bid is stored in runtime.liveBids (Redis), then realtime events are emitted.

### 6.3 Tick / Timeout

tickAuction(eventId):

- If lot not expired: no progression.
- If expired and autoProgress = false:
  - Settle active lot.
  - Stop runtime (isRunning false, active lot null).
- If expired and autoProgress = true:
  - Settle current lot.
  - Progress to next lot using _progressToNextLot.

### 6.4 Progression Ordering

_progressToNextLot uses deterministic ordering:

- Primary: lotOrder asc
- Secondary: createdAt asc
- Tertiary: id asc

Candidate selection is robust to duplicate lotOrder data:

1. Find tuple-greater candidate (lotOrder/createdAt/id)
2. Fallback: earliest remaining PENDING/ACTIVE lot excluding current
3. If none remains:
   - runtime.isRunning = false
   - runtime.autoProgress = false
   - runtime.activeLotId = null
   - event status -> COMPLETED

## 7. Critical Guardrails

### 7.1 Per-event Locking

All state-changing actions run inside withLock(eventId):

- Prevents concurrent conflicting actions.
- Returns AUCTION_LOCKED (409) if lock already held.

### 7.2 Settlement-First Safety

Manual progression and override paths settle active lots before activating another lot to prevent bid/state loss.

### 7.3 Runtime Toggle Ownership

Recommended behavior:

- PATCH /auction/:eventId/runtime controls autoProgress setting.
- Start action should not blindly override runtime setting unless explicitly requested.

## 8. Recent Fixes (Current State)

### Fix A: Optional autoProgress coercion

Issue:

- start endpoint coerced optional autoProgress with Boolean(...), which could disable auto-progress unintentionally.

Current behavior:

- startAuction receives autoProgress as optional.
- runtime.autoProgress changes only when explicit boolean is supplied.

### Fix B: Frontend stale override on start

Issue:

- Admin start action sent local autoProgress state every time, potentially overriding runtime with stale value.

Current behavior:

- Start call can send empty body.
- Runtime toggle endpoint remains source of truth.

### Fix C: Duplicate lotOrder causing stop-after-first-lot

Issue:

- createPlayers assigned lotOrder starting from 1 per call.
- Repeated single-player signup/admin calls produced duplicate lotOrder values (often all 1).
- Progression query based only on lotOrder > current.lotOrder could find no next lot and complete auction early.

Current behavior:

- createPlayers appends lotOrder from current max lotOrder in event.
- Progression query uses tuple ordering + fallback candidate search.

## 9. Operational Notes

- If an older event already has malformed lotOrder data, the new progression fallback can still continue across remaining lots.
- For clean ordering, new players/lots now append correctly.
- Lint status currently passes for backend and frontend in this branch.

## 10. Quick Verification Checklist

1. Create event.
2. Add at least 2 players (signup or admin flow).
3. Confirm lotOrder is sequential in auction board.
4. PATCH runtime autoProgress=true.
5. POST start with empty body.
6. Wait for timeout.
7. Verify first lot is SOLD/UNSOLD and next lot becomes ACTIVE.

## 11. Known Tradeoffs / Future Improvements

- Add DB-level uniqueness for (eventId, lotOrder) to prevent malformed ordering at data layer.
- Add automated integration tests for:
  - signup-player repeated calls
  - start-without-autoProgress payload
  - auto progression across duplicate order edge cases
- Add audit logs for runtime flag transitions (autoProgress/isRunning) for easier production debugging.
