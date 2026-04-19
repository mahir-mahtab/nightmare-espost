# 🎮 Admin Dashboard User Guide

**Complete guide for managing esports auction events**

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Login & Dashboard Overview](#login--dashboard-overview)
3. [Managing Events](#managing-events)
4. [Managing Owners](#managing-owners)
5. [Managing Teams](#managing-teams)
6. [Managing Players](#managing-players)
7. [Auction Lots & Auctions](#auction-lots--auctions)
8. [Tips & Best Practices](#tips--best-practices)
9. [FAQ](#faq)

---

## Getting Started

### Prerequisites
- Access to the admin panel via **http://localhost:5173/admin/login** (or your production URL)
- Admin password provided by the development team
- Understanding of event structure: Events → Owners → Teams → Players

### First Login
1. Navigate to the **Admin Login** page
2. Enter the admin password
3. Click **Login**
4. You'll be redirected to the **Admin Dashboard**

---

## Login & Dashboard Overview

### Dashboard Home

Once logged in, you'll see:

```
┌─────────────────────────────────────────┐
│           ADMIN DASHBOARD               │
├─────────────────────────────────────────┤
│ [Create Event]  [Refresh]  [Logout]     │
├─────────────────────────────────────────┤
│                                         │
│  📋 Event List                          │
│  ├─ Event 1  [Select] [Delete]         │
│  ├─ Event 2  [Select] [Delete]         │
│  └─ Event 3  [Select] [Delete]         │
│                                         │
└─────────────────────────────────────────┘
```

### Top Controls

| Button | Function |
|--------|----------|
| **Create Event** | Add a new event to the system |
| **Refresh** | Reload all events from server |
| **Logout** | Exit admin mode and return to login |

---

## Managing Events

### Create a New Event

**Step 1: Click "Create Event"**
- A modal form will appear with these fields:

| Field | Description | Example | Rules |
|-------|-------------|---------|-------|
| **Event Slug** | URL-friendly unique ID | `valorant-s1` | 3-100 chars, lowercase, numbers/hyphens only |
| **Event Title** | Display name | `Valorant Season 1` | 3-255 characters |
| **Game** | Game name | `Valorant` | 2-100 characters |
| **Season** | Optional season info | `Season 1` or `Spring 2026` | Any text, optional |
| **Mode** | Game mode | `5v5 Competitive` | Any text, optional |
| **Password** | Event entry password | `abc123` | 4-50 characters (shared for all players/teams) |
| **Max Slots** | Maximum participants | `200` | 0-100,000 |
| **Auction Window** | Seconds per lot | `30` | 10-300 seconds |
| **Banner URL** | Event image | `https://example.com/banner.jpg` | Valid URL or blank |
| **Stream Start Time** | Event start time | `2026-04-20 19:00` | ISO format, optional |

**Step 2: Fill in the form**
```
Example:
├─ Slug: valorant-season1
├─ Title: Valorant Season 1 Championship
├─ Game: Valorant
├─ Season: Spring 2026
├─ Mode: 5v5 Competitive
├─ Password: EventPass123
├─ Max Slots: 100
├─ Auction Window: 30 seconds
└─ Banner: https://example.com/banner.jpg
```

**Step 3: Click "Create"**
- Event will be created and added to the list

### View & Edit Event Details

**To open an event:**
1. In the events list, click **[Select]** next to the event name
2. The event tabs will appear below:

```
[Overview] [Edit Event] [Owners] [Teams] [Players] [Auction Lots]
```

### Edit Event

**Tab: Edit Event**

Here you can modify:
- Event title, game, season, mode
- Event password
- Auction window duration
- Banner URL
- Stream start time
- Max slots

⚠️ **Note:** Event slug cannot be changed once created

**Steps to Edit:**
1. Click the **Edit Event** tab
2. Modify the fields you want to change
3. Click **Save** to update
4. Confirm the changes

### Delete Event

⚠️ **WARNING: This action is permanent and cannot be undone**

**Steps:**
1. Click the **[Delete]** button next to an event in the list
2. Confirm the deletion
3. Event and all associated data will be removed

---

## Managing Owners

### Overview

Owners are the team leaders/managers who participate in the auction. Each owner gets one team.

**Tab: Owners**

### Create Owner

**Step 1: Click [+ Add Owner]**

A form appears with:

| Field | Description | Example | Rules |
|-------|-------------|---------|-------|
| **Name** | Owner's name | `Alex Johnson` | Must start with letter, 2-100 chars, letters/spaces/apostrophe |
| **Password** | Owner login password | `OwnerPass123` | 4-100 characters (owners use this to log in) |
| **Avatar URL** | Profile image | `https://example.com/avatar.jpg` | Valid URL or blank |

**Step 2: Fill the form**
```
Name: Alex Johnson
Password: MySecurePass123
Avatar: https://example.com/alex-avatar.jpg
```

**Step 3: Click [Create]**
- Owner is created and added to the list

### Edit Owner

**Steps:**
1. In the Owners list, find the owner you want to edit
2. Click the **[Edit]** button
3. Modify the fields (password and avatar can be changed)
4. Click **[Save]** to confirm
5. Or click **[Cancel]** to discard changes

**What can be edited:**
- ✅ Name
- ✅ Password
- ✅ Avatar URL

### Delete Owner

⚠️ **If an owner has teams with players, review before deleting**

**Steps:**
1. Click **[Delete]** next to the owner
2. Confirm deletion
3. Owner is removed (teams are still valid)

### Owner Login
Owners use their credentials to:
- Log in to events
- Participate in auctions
- Place bids

---

## Managing Teams

### Overview

Teams are groups of players managed by an owner. Each owner has one team per event.

**Tab: Teams**

### Create Team

**Step 1: Click [+ Add Team]**

Form appears with:

| Field | Description | Example | Rules |
|-------|-------------|---------|-------|
| **Team Name** | Display name | `Red Squad` | Alphanumeric + spaces/hyphens/apostrophe, 2-100 chars |
| **Owner** | Team manager | `Alex Johnson` | Must select from existing owners |
| **Coins Left** | Auction budget | `10000` | Starting coins for bidding |

**Step 2: Fill the form**
```
Team Name: Red Squad
Owner: Alex Johnson
Coins Left: 10000
```

**Step 3: Click [Create]**

### Edit Team

**Steps:**
1. Click **[Edit]** on the team row
2. Modify name, owner, or coin budget
3. Click **[Save]** to apply changes
4. Or **[Cancel]** to discard

**Note:** Team coins automatically decrease when players are sold/won

### Delete Team

⚠️ **Deleting a team removes it from the system**

**Steps:**
1. Click **[Delete]** on the team
2. Confirm deletion

---

## Managing Players

### Overview

Players are the individuals being auctioned. Each player:
- Belongs to an event
- Has a base price (starting bid)
- Gets one Auction Lot created automatically
- Will be assigned to a team after auction

**Tab: Players**

### Create Player

**Step 1: Click [+ Add Player]**

Form with fields:

| Field | Description | Example | Rules |
|-------|-------------|---------|-------|
| **Player Name** | Full name | `John Smith` | Must start with letter, 2-255 chars |
| **Role** | Position/Role | `Duelist` or `IGL` | Alphanumeric + slash/hyphen, 2-40 chars |
| **Base Price** | Starting bid amount | `5000` | 0 or higher |
| **Rank Point** | Skill ranking | `2500` | 0 or higher, informational only |
| **Image URL** | Player photo | `https://example.com/player.jpg` | Valid URL or blank |

**Step 2: Fill the form**
```
Name: John Smith
Role: Duelist
Base Price: 5000
Rank Points: 2500
Image: https://example.com/smith-photo.jpg
```

**Step 3: Click [Create]**
- Player is added
- **Auction Lot is automatically created** (status: PENDING)

### Edit Player

⚠️ **Note:** Players in active auctions cannot be edited easily

**Steps:**
1. Click **[Edit]** on a player
2. Modify fields (except active lot players)
3. Click **[Save]**

**Important:**
- Only edit players who haven't started auction
- Once a player is SOLD or UNSOLD, minimal edits allowed

### Delete Player

⚠️ **Deleting removes player and associated Auction Lot**

**Steps:**
1. Click **[Delete]** on the player
2. Confirm deletion

---

## Auction Lots & Auctions

### Understanding Auction Lots

Each player automatically gets an **Auction Lot** when created:

| Lot Property | Meaning |
|--------------|---------|
| **Status** | PENDING → ACTIVE → SOLD/UNSOLD |
| **Lot Order** | Sequential auction order (1, 2, 3...) |
| **Base Price** | Player's starting bid |
| **Current Bid** | Highest bid received |
| **Current Owner** | Who's winning |
| **Time Left** | Seconds until bidding closes |

### Tab: Auction Lots

This tab shows:

```
┌─────────────────────────────────────────────┐
│  Lot #1 - John Smith (Duelist)              │
│  Status: PENDING                            │
│  Base Price: 5000                           │
│  Current Bid: -                             │
│  Owner: [Select Lot] [Open Auction]         │
└─────────────────────────────────────────────┘
```

### Auction Workflow

#### Phase 1: Setup (All PENDING)

All lots start as **PENDING** and wait to be auctioned.

#### Phase 2: Activate Auction

**Step 1: Click [Open Auction]** on the first PENDING lot
- Lot status changes: PENDING → ACTIVE
- Bidding window opens (timer starts)
- Owners can now place bids

**Step 2: Owners Place Bids**
- They bid on the ACTIVE lot
- Current bid and owner update in real-time
- Must bid higher than previous bid

#### Phase 3: Settle Lot

**Option A: Auto-Settle (Wait for Timer)**
- When bidding window expires (30 seconds default)
- Lot automatically settles
- Highest bidder wins

**Option B: Manual Settle**
- Click [Settle Current Lot] to end early
- Highest bidder wins immediately

#### Phase 4: Next Lot

**Step 1: Click [Activate Next Lot]**
- Previous lot finalizes
- Next PENDING lot becomes ACTIVE
- New bidding window opens
- Repeat Phase 2-4

#### Phase 5: Auction Complete

When no more PENDING lots exist:
- All players are either SOLD or UNSOLD
- Event status: COMPLETED
- Auction is over

### Lot Status Meanings

| Status | Meaning | What Happens |
|--------|---------|--------------|
| **PENDING** | Waiting to be auctioned | Will be activated soon |
| **ACTIVE** | Currently being bid on | Real-time bidding is live |
| **SOLD** | Player won by team | Player assigned to winning team, coins deducted |
| **UNSOLD** | No one bid | Player remains unassigned |

### Manual Lot Management

#### Force a Lot to SOLD

Use this if you want to manually close a lot as sold:

1. Click on the lot
2. Select **[Finalize as Sold]**
3. Choose an owner
4. Set the price
5. Click **[Confirm]**

#### Force a Lot to UNSOLD

1. Click on the lot
2. Select **[Mark as Unsold]**
3. Confirm

#### Override/Emergency Finalize

If there's a technical issue or dispute:

1. Click the lot
2. Click **[Emergency Override]**
3. Set final owner and price
4. Action is logged for audit

---

## Tips & Best Practices

### ✅ Before Starting an Auction

- [ ] Create event with correct password
- [ ] Add all owners
- [ ] Create teams for each owner (with initial coins)
- [ ] Add all players
- [ ] Set auction window duration (30 seconds default)
- [ ] Verify all data in the "Auction Lots" tab
- [ ] Test with one lot before full auction

### ✅ During Auction

- [ ] Monitor real-time bids on the dashboard
- [ ] Watch player profiles for issues
- [ ] Be ready to manually settle if needed
- [ ] Keep audience updated on current bids
- [ ] Have a backup plan if connection issues occur

### ✅ After Auction

- [ ] Review all SOLD players and prices
- [ ] Check team coin balances
- [ ] Export final results if needed
- [ ] Archive event data
- [ ] Prepare report for stakeholders

### Common Mistakes to Avoid

❌ **Don't:**
- Create event without password
- Start auction with uneven team budgets
- Forget to set player base prices
- Delete events without backup
- Allow bidding on inactive lots
- Delete owners with active teams

✅ **Do:**
- Test setup before going live
- Have team coin limits reviewed
- Set reasonable auction window timing
- Keep detailed event records
- Communicate changes to all owners
- Monitor auction progress

---

## FAQ

### Q: How do I change an owner's password?
**A:** Go to **Owners** tab → Click **[Edit]** → Update password field → Click **[Save]**

### Q: What happens if an owner runs out of coins?
**A:** They cannot bid on remaining lots. System prevents bids exceeding coin balance.

### Q: Can I edit a player who's currently being auctioned?
**A:** Not recommended. Wait until their lot settles (becomes SOLD/UNSOLD) before editing.

### Q: What if I make a mistake marking a lot as SOLD?
**A:** Use the **Emergency Override** feature to correct it. The action will be logged.

### Q: How do I reset an auction?
**A:** Currently, auctions progress forward only. Delete and recreate the event if needed.

### Q: Can teams bid on multiple players at once?
**A:** No. Only one lot is ACTIVE at a time. Teams bid on the current lot, then move to next.

### Q: What's the maximum time per lot?
**A:** 300 seconds. Minimum is 10 seconds.

### Q: Can I adjust a team's coins during auction?
**A:** Yes. Edit the team and modify "Coins Left" field. Coins auto-adjust on purchases.

### Q: How do I know if an owner is winning a lot?
**A:** Watch the **"Current Owner"** field in Auction Lots. Real-time updates as bids come in.

### Q: What if connection drops during auction?
**A:** System saves all bids in real-time. Refresh page to see current state. Auction continues.

### Q: How do I export final results?
**A:** Go to **Auction Lots** tab → All lots show final status, owner, and price. Take screenshots or use browser dev tools.

### Q: Can I run multiple auctions simultaneously?
**A:** Yes! Create multiple events. Each can have independent auctions running.

### Q: How long does data persist?
**A:** Event data is permanent until you delete the event. Player assignments are stored with team data.

---

## Support & Troubleshooting

### Common Issues

**Issue: "Login unsuccessful"**
- ✓ Check password is correct
- ✓ Clear browser cache
- ✓ Try in incognito mode

**Issue: Cannot create owner/team/player**
- ✓ Check all required fields are filled
- ✓ Verify field formats (no special characters where not allowed)
- ✓ Ensure owner exists before assigning to team

**Issue: Auction lot won't activate**
- ✓ Verify lot status is PENDING
- ✓ Check event has active teams with coin budget
- ✓ Refresh page and try again

**Issue: Bids not showing in real-time**
- ✓ Check internet connection
- ✓ Refresh auction lots tab
- ✓ Verify owner is logged in to event

### Getting Help

If you encounter issues:
1. Screenshot the error message
2. Note what action you were performing
3. Check if other users can reproduce the issue
4. Contact the development team with details

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between form fields |
| `Enter` | Submit form/Create |
| `Esc` | Close modal/Cancel |

---

**Last Updated:** April 19, 2026

**Version:** 1.0

---

## Quick Reference Card

```
🚀 QUICK SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Login → Admin Dashboard
2. Create Event → Set password, auction window
3. Add Owners → Players who will bid
4. Add Teams → Assign to owners, set coins
5. Add Players → Set base prices
6. Start Auction → Activate first lot
7. Monitor Bids → Watch real-time updates
8. Settle Lots → Move to next player
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 EVENT TABS
├─ Overview       → Event summary
├─ Edit Event     → Modify event settings
├─ Owners         → Manage team leaders
├─ Teams          → Manage squads
├─ Players        → Manage roster
└─ Auction Lots   → Run the auction

🎯 LOT STATES
PENDING → ACTIVE → SOLD ✓
                → UNSOLD ✗

💰 IMPORTANT
• Each Owner = 1 Team
• Each Player = 1 Auction Lot
• Each Lot = 1 Owner as winner
• Coins auto-deduct on purchase
```

---

**Need more help?** Contact your development team or refer to the technical documentation.
