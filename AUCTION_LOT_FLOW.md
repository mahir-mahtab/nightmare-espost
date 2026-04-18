 # Auction Lot Creation & State Flow

## Overview

Auction lots are **automatically created when players are created**. Each player gets exactly one corresponding auction lot. The auction lot serves as the bidding container for that player during the auction event.

---

## Part 1: Auction Lot Creation

### When Are Auction Lots Created?

Auction lots are created **automatically as part of the player creation process**. When you upload players to an event (via admin panel or bulk upload), the system immediately creates a corresponding auction lot for each player.

### Creation Flow

```
1. Admin/System creates Players
   ↓
2. For each Player → Create corresponding AuctionLot
   ↓
3. Each lot initialized with:
   - status: PENDING
   - lotOrder: sequential number (1, 2, 3, ...)
   - endsAt: null (not yet in auction)
   - liveBids: {} (empty)
```

### Code Reference

**File:** `backend/src/services/eventService.ts`

**Method:** `createPlayers(eventId, players)`

```typescript
// Create players and auction lots in transaction
const createdPlayers = await prisma.$transaction(
  players.map((player) =>
    prisma.player.create({
      data: {
        ...player,
        eventId,
        status: PlayerStatus.ACTIVE,  // Player starts ACTIVE
      },
    })
  )
);

// Create auction lots for all players
const auctionLots = await prisma.$transaction(
  createdPlayers.map((player, index) =>
    prisma.auctionLot.create({
      data: {
        eventId,
        playerId: player.id,
        status: AuctionStatus.PENDING,  // Lot starts PENDING
        lotOrder: index + 1,             // Sequential order: 1, 2, 3...
        endsAt: null,                    // No end time yet
      },
    })
  )
);
```

### Initial State

When a lot is created:

| Property | Value | Meaning |
|----------|-------|---------|
| `status` | `PENDING` | Not yet being auctioned |
| `lotOrder` | 1, 2, 3... | Sequential order in auction |
| `endsAt` | `null` | No active bidding window |
| `playerId` | UUID | Link to player being auctioned |
| `eventId` | UUID | Link to event |
| `createdAt` | timestamp | When lot was created |

---

## Part 2: Auction Lot State Machine

### State Diagram

```
┌─────────────┐
│   PENDING   │ ← Initial state (waiting to be auctioned)
└──────┬──────┘
       │ startAuction() or setLotStatus('ACTIVE')
       ↓
┌─────────────┐
│   ACTIVE    │ ← Currently being auctioned (bidding window open)
└──────┬──────┘
       │
       ├─ settleLot() with bid winner
       ├─ finalizePurchase() with admin override
       └─ setLotStatus('SOLD' or 'UNSOLD')
       ↓
    ┌──────────────────────┐
    │                      │
    ↓                      ↓
┌─────────┐         ┌──────────┐
│  SOLD   │         │  UNSOLD  │
└─────────┘         └──────────┘
(player won)        (no bid/passed)
(terminal state)    (terminal state)
```

### All Possible State Transitions

| From State | To State | Trigger | Condition | Result |
|-----------|----------|---------|-----------|--------|
| PENDING | ACTIVE | `startAuction()` | First PENDING lot exists | Bidding window opens |
| PENDING | ACTIVE | `setLotStatus('ACTIVE')` | Manual admin action | Bidding window opens immediately |
| ACTIVE | SOLD | `placeBid()` → `settleLot()` | Bidding window closes, winner exists | Player assigned to winning team |
| ACTIVE | SOLD | `finalizePurchase()` | Admin force-finalizes | Player assigned with override amount |
| ACTIVE | UNSOLD | `settleLot()` | Bidding window closes, no winner | Player remains ACTIVE, not sold |
| ACTIVE | UNSOLD | `setLotStatus('UNSOLD')` | Manual admin action | Lot marked unsold immediately |
| ACTIVE | PENDING | `activateNextLot()` | Auto-progress to next lot | Previous lot reverts to PENDING |
| SOLD ↔ any | N/A | N/A | Lot is terminal | Cannot transition from SOLD |
| UNSOLD ↔ any | N/A | N/A | Lot is terminal | Cannot transition from UNSOLD |

---

## Part 3: Detailed State Transitions

### 1️⃣ PENDING → ACTIVE

**How:** When auction starts or admin manually activates a lot

**What Happens:**

```javascript
// In auctionService.startAuction() or setLotStatus('ACTIVE')
await prisma.auctionLot.update({
  where: { id: lot.id },
  data: {
    status: AuctionStatus.ACTIVE,
    endsAt: new Date(Date.now() + event.auctionWindowSeconds * 1000),
  },
});

// Update runtime state
runtime.activeLotId = lot.id;
runtime.activeLotEndsAt = endsAtMs;  // Timestamp when bidding closes
runtime.isRunning = true;
```

**Associated Changes:**
- Player status: remains `ACTIVE`
- Bidding window opens for `auctionWindowSeconds` (typically 30 seconds)
- All previous ACTIVE lots revert to PENDING
- Runtime tracks current active lot ID and end time

**Code Location:** `backend/src/services/auctionService.ts` lines 557-603

---

### 2️⃣ ACTIVE → SOLD

**How:** When bidding window closes with a winning bid

**Trigger:** `settleCurrentLot()` or automatic when bidding timer expires

**What Happens:**

```javascript
// In settleLot() - called when lot finishes ACTIVE
const liveBid = runtime.liveBids[lot.id];
const finalOwnerId = liveBid?.ownerId;
const finalAmount = liveBid?.amount;

// If there's a bid, mark as SOLD
if (finalOwnerId && finalAmount) {
  await prisma.$transaction(async (tx) => {
    // 1. Deduct coins from winning team
    await tx.team.update({
      where: { id: winningTeamId },
      data: { coinsLeft: { decrement: finalAmount } },
    });

    // 2. Update player to SOLD
    await tx.player.update({
      where: { id: lot.playerId },
      data: {
        status: PlayerStatus.SOLD,
        soldToTeamId: winningTeamId,
        finalPrice: finalAmount,
      },
    });

    // 3. Update lot to SOLD
    await tx.auctionLot.update({
      where: { id: lot.id },
      data: {
        status: AuctionStatus.SOLD,
        endsAt: null,
      },
    });
  });
}
```

**State After SOLD:**

| Entity | Change |
|--------|--------|
| `AuctionLot.status` | SOLD |
| `Player.status` | SOLD |
| `Player.soldToTeamId` | Set to winning team |
| `Player.finalPrice` | Winning bid amount |
| `Team.coinsLeft` | Decreased by purchase amount |
| `runtime.liveBids[lotId]` | Deleted |
| `runtime.isRunning` | Set to false (if no next lot) |

**Code Location:** `backend/src/services/auctionService.ts` lines 367-425

---

### 3️⃣ ACTIVE → UNSOLD

**How:** When bidding window closes without a winning bid

**Trigger:** `settleCurrentLot()` with no bids

**What Happens:**

```javascript
// In settleLot() - if no final owner
if (!finalOwnerId) {
  await prisma.$transaction(async (tx) => {
    // 1. Update player to UNSOLD
    await tx.player.update({
      where: { id: lot.playerId },
      data: {
        status: PlayerStatus.UNSOLD,
        soldToTeamId: null,
        finalPrice: null,
      },
    });

    // 2. Update lot to UNSOLD
    await tx.auctionLot.update({
      where: { id: lot.id },
      data: {
        status: AuctionStatus.UNSOLD,
        endsAt: null,
      },
    });
  });
}
```

**State After UNSOLD:**

| Entity | Change |
|--------|---------|
| `AuctionLot.status` | UNSOLD |
| `Player.status` | UNSOLD |
| `Player.soldToTeamId` | null |
| `Player.finalPrice` | null |
| `Team.coinsLeft` | No change (no purchase) |
| `runtime.liveBids[lotId]` | Deleted |

---

### 4️⃣ ACTIVE → PENDING (Revert)

**How:** When moving to next lot without settling current

**Trigger:** `activateNextLot()` - moves to next PENDING lot

**What Happens:**

```javascript
// When moving to next lot
await prisma.auctionLot.updateMany({
  where: {
    eventId: event.id,
    status: AuctionStatus.ACTIVE,
    id: { not: nextLot.id }  // Exclude the new active lot
  },
  data: {
    status: AuctionStatus.PENDING,
    endsAt: null,
  },
});
```

**Use Case:** Admin manually progresses without settling → Previous lot reverts to PENDING status

---

### 5️⃣ Admin Override: Force SOLD/UNSOLD

**How:** `finalizePurchase()` - emergency admin action

**Trigger:** Admin clicks "Finalize as Sold" button

**What Happens:**

```javascript
// In finalizePurchase()
await this.settleLot(event, lotId, runtime, {
  forcedStatus: 'SOLD',
  overrideOwnerId: adminProvidedOwnerId,
  overrideAmount: adminProvidedAmount,
});

// Logs the action for audit trail
await this.logAdminAction(event.id, 'EMERGENCY_OVERRIDE_FINALIZE', {
  admin: adminIdentity,
  lotId,
  previousStatus: lotBefore.status,
  previousOwnerId: lotBefore.player?.soldToTeam?.ownerId,
  overrideOwnerId: adminProvidedOwnerId,
  overrideAmount: adminProvidedAmount,
});
```

**Bypasses:**
- Ignores current bid amount
- Ignores bidding window time
- Forces status to SOLD regardless of bids
- Used for emergency situations (technical issues, disputes, etc.)

---

## Part 4: Complete Auction Lifecycle Example

### Scenario: Auction with 3 Players

```
SETUP PHASE
───────────────────────────────────────
Timeline: T=0 (Players created)
  Player 1 → AuctionLot 1 (PENDING, lotOrder=1)
  Player 2 → AuctionLot 2 (PENDING, lotOrder=2)
  Player 3 → AuctionLot 3 (PENDING, lotOrder=3)

Event status: UPCOMING


AUCTION START
───────────────────────────────────────
Timeline: T=0 seconds
Admin clicks "Start Auction"

  AuctionLot 1: PENDING → ACTIVE (endsAt = T+30s)
  runtime.activeLotId = Lot1
  runtime.isRunning = true
  Event status: UPCOMING → LIVE

Timeline: T=0-30 seconds
  Owners can place bids on Lot 1
  runtime.liveBids[Lot1] = { ownerId, amount, updatedAt }

Timeline: T=30 seconds (Lot 1 bidding window closes)
Admin clicks "Settle Current Lot"

  settleLot() checks runtime.liveBids[Lot1]
  ✓ Bid exists from Owner A (5000 coins)
  
  AuctionLot 1: ACTIVE → SOLD
  Player 1: ACTIVE → SOLD (soldToTeamId = Owner A's team)
  Team (A): coinsLeft = 5000
  runtime.liveBids[Lot1] = deleted


NEXT LOT
───────────────────────────────────────
Timeline: T=30 seconds
Admin clicks "Activate Next Lot"

  AuctionLot 2: PENDING → ACTIVE (endsAt = T+60s)
  runtime.activeLotId = Lot2
  runtime.isRunning = true

Timeline: T=30-60 seconds
  Owners can place bids on Lot 2
  runtime.liveBids[Lot2] = { ownerId: Owner B, amount: 3500, updatedAt }

Timeline: T=60 seconds
Auto-settle (or admin settles manually)

  settleLot() checks runtime.liveBids[Lot2]
  ✓ Bid exists from Owner B (3500 coins)
  
  AuctionLot 2: ACTIVE → SOLD
  Player 2: ACTIVE → SOLD
  Team (B): coinsLeft = 3500


LAST LOT
───────────────────────────────────────
Timeline: T=60 seconds
Admin clicks "Activate Next Lot"

  AuctionLot 3: PENDING → ACTIVE (endsAt = T+90s)
  runtime.activeLotId = Lot3
  runtime.isRunning = true

Timeline: T=60-90 seconds
  No one bids on Lot 3
  runtime.liveBids[Lot3] = {} (empty)

Timeline: T=90 seconds
Admin settles last lot

  settleLot() checks runtime.liveBids[Lot3]
  ✗ No bid exists
  
  AuctionLot 3: ACTIVE → UNSOLD
  Player 3: ACTIVE → UNSOLD (remains unassigned)
  Team (A,B): coinsLeft unchanged


AUCTION COMPLETE
───────────────────────────────────────
Timeline: T=90 seconds
After settling Lot 3:
  All lots are either SOLD or UNSOLD (terminal states)
  runtime.activeLotId = null
  runtime.isRunning = false
  Event status: LIVE → COMPLETED
```

---

## Part 5: Data Models

### AuctionLot Schema (Prisma)

```typescript
model AuctionLot {
  id        String         @id @default(uuid())
  eventId   String         @map("event_id")
  event     Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  playerId  String         @map("player_id")
  player    Player         @relation(fields: [playerId], references: [id])
  
  status    AuctionStatus  @default(PENDING)  // PENDING, ACTIVE, SOLD, UNSOLD
  endsAt    DateTime?      @map("ends_at")    // When bidding window closes
  lotOrder  Int            @map("lot_order")  // Sequential number (1, 2, 3...)
  
  createdAt DateTime       @default(now())    @map("created_at")
  updatedAt DateTime       @updatedAt         @map("updated_at")

  @@index([eventId])
  @@index([status])
  @@index([lotOrder])
  @@map("auction_lots")
}

enum AuctionStatus {
  PENDING   // Not yet auctioned
  ACTIVE    // Currently being bid on
  SOLD      // Won by a team
  UNSOLD    // Not sold (no bid)
}
```

### Related Models

#### Player

```typescript
model Player {
  id              String        @id @default(uuid())
  name            String
  role            String
  basePrice       Int           // Starting bid price
  status          PlayerStatus  @default(ACTIVE)  // ACTIVE, SOLD, UNSOLD
  
  soldToTeamId    String?       // Which team won this player
  soldToTeam      Team?         @relation(fields: [soldToTeamId], references: [id])
  finalPrice      Int?          // Winning bid amount
  
  auctionLots     AuctionLot[]  // 1-to-1 relationship
}

enum PlayerStatus {
  ACTIVE    // Available for auction
  SOLD      // Won and assigned to team
  UNSOLD    // Auction ended, no buyer
}
```

#### Runtime State (Redis)

```typescript
interface AuctionRuntimeState {
  eventId: string
  activeLotId: string | null      // Current lot being bid on
  isRunning: boolean              // Auction in progress?
  autoProgress: boolean           // Auto-move to next lot?
  lotDuration: number             // Seconds for each lot
  activeLotEndsAt: number | null  // Timestamp when current lot bidding ends
  lastUpdatedAt: number           // When state was last saved
  
  liveBids: Record<string, {      // Real-time bids
    ownerId: string
    amount: number
    updatedAt: number
  }>
}
```

**Storage:** Redis key `auction:{eventId}:state` (JSON serialized)

---

## Part 6: Key Service Methods

### Creation
- **`eventService.createPlayers(eventId, players[])`** - Creates players + auction lots

### State Transitions
- **`auctionService.startAuction(eventId, autoProgress?)`** - PENDING → ACTIVE
- **`auctionService.setLotStatus(eventId, lotId, status)`** - Manual status change
- **`auctionService.settleLot(event, lotId, runtime, options?)`** - ACTIVE → SOLD/UNSOLD
- **`auctionService.finalizePurchase(eventId, lotId, ownerId, amount)`** - Admin override
- **`auctionService.activateNextLot(eventId)`** - Move to next PENDING lot

### Queries
- **`auctionService.getAuctionState(eventIdOrSlug, filters?)`** - Get all lots + current state
- **`eventService.getEventFullForAdmin(eventId)`** - Complete event data with lots

---

## Part 7: Key Takeaways

✅ **Auction lots are created automatically when players are created**
- 1 player = 1 auction lot
- Created in same transaction (all-or-nothing)
- No manual lot creation required

✅ **Lots follow a strict state machine**
- PENDING (initial) → ACTIVE (bidding) → SOLD/UNSOLD (terminal)
- Terminal states cannot transition
- Admin can override/revert at any point

✅ **State changes are transactional**
- When lot state changes, associated player/team data updates atomically
- If any part fails, entire transaction rolls back
- No partial/corrupt states possible

✅ **Real-time data stored in Redis**
- Current bids, active lot, timing stored in Redis for speed
- Persisted to PostgreSQL when lot settles
- Allows sub-second updates without database hits

✅ **Audit trail recorded**
- Critical admin actions logged (overrides, emergency finalizations)
- Stored in `ActionLog` table with full context
- Useful for dispute resolution

---

**Last Updated:** April 19, 2026
**Status:** Current - Reflects production codebase
