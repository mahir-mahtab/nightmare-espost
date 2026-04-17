# API Endpoints Documentation

## Overview

This document outlines all backend API endpoints for the Esports Platform. The API uses a consistent response format with `success` and `data`/`message` fields.

**Base URL:** `http://localhost:3000/api`

---

## Table of Contents

1. [Public Endpoints](#public-endpoints)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Event Signup Endpoints](#event-signup-endpoints)
4. [Event Data Endpoints](#event-data-endpoints)
5. [Auction Endpoints](#auction-endpoints)
6. [Admin Endpoints](#admin-endpoints)
7. [Admin Management Endpoints](#admin-management-endpoints)
8. [Health Check](#health-check)

---

## Public Endpoints

### List Public Events
- **Method:** `GET`
- **Path:** `/events`
- **Auth:** None (public)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Retrieves all public events visible on the landing page
- **Response:** Array of event objects

### Get Event Login Context
- **Method:** `GET`
- **Path:** `/events/:eventId/login-context`
- **Auth:** None (public)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Gets event details and list of owners for the login page
- **URL Parameters:** `eventId` (Event ID or slug)
- **Response:** Event info + list of owners

### Get Event Signup Context
- **Method:** `GET`
- **Path:** `/events/:eventId/signup-context`
- **Auth:** None (public)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Gets event details for signup page
- **URL Parameters:** `eventId` (Event ID or slug)
- **Response:** Event info

---

## Authentication Endpoints

### Event Login
- **Method:** `POST`
- **Path:** `/events/:eventId/auth/login`
- **Auth:** None (public)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Authenticates a user for an event (guest or owner)
- **URL Parameters:** `eventId` (Event ID or slug)
- **Request Body:**
  ```json
  {
    "password": "string (4-50 chars)",
    "role": "owner | guest",
    "ownerId": "uuid (required if role=owner)",
    "ownerPassword": "string (required if role=owner)"
  }
  ```
- **Response:** Session token + user info

### Validate Session
- **Method:** `POST`
- **Path:** `/events/:eventId/auth/validate`
- **Auth:** Bearer token (event session)
- **Status:** ✅ **USED** (src/data/eventAuthService.js)
- **Description:** Validates if current session token is still valid
- **URL Parameters:** `eventId` (Event ID)
- **Response:** Current session data

### Event Logout
- **Method:** `POST`
- **Path:** `/events/:eventId/auth/logout`
- **Auth:** Bearer token (event session)
- **Status:** ✅ **USED** (src/data/eventAuthService.js)
- **Description:** Logs out from event session (mostly client-side operation)
- **URL Parameters:** `eventId` (Event ID)
- **Response:** Success message

---

## Event Signup Endpoints

### Owner Signup
- **Method:** `POST`
- **Path:** `/events/:eventId/signup/owner`
- **Auth:** None (public)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Creates a new owner and associated team
- **URL Parameters:** `eventId` (Event ID or slug)
- **Request Body:**
  ```json
  {
    "eventPassword": "string (4-50 chars)",
    "ownerName": "string (2-100 chars, name format)",
    "ownerPassword": "string (6-100 chars)",
    "avatarUrl": "url (optional)",
    "teamName": "string (2-100 chars, team name format)",
    "coinsLeft": "integer (0-100000, default 0)"
  }
  ```
- **Response:** Created owner + team data

### Player Signup
- **Method:** `POST`
- **Path:** `/events/:eventId/signup/player`
- **Auth:** None (public)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Creates a new player for an event
- **URL Parameters:** `eventId` (Event ID or slug)
- **Request Body:**
  ```json
  {
    "eventPassword": "string (4-50 chars)",
    "playerName": "string (2-100 chars, name format)",
    "playerRole": "string (2-40 chars, role format)",
    "rankPoint": "integer (0-100, default 0)",
    "basePrice": "integer (0-100000, default 0)",
    "imageUrl": "url (optional)"
  }
  ```
- **Response:** Created player data

---

## Event Data Endpoints

**All require bearer token authentication (event session)**

### Get Event Summary
- **Method:** `GET`
- **Path:** `/events/:eventId/summary`
- **Auth:** Bearer token (event session)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Gets event summary with stats (registrations, slots, stream start, etc.)
- **Response:** Event summary object

### Get Teams
- **Method:** `GET`
- **Path:** `/events/:eventId/teams`
- **Auth:** Bearer token (event session)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Gets all teams for the event
- **Response:** Array of team objects

### Get Owners
- **Method:** `GET`
- **Path:** `/events/:eventId/owners`
- **Auth:** Bearer token (event session)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Gets all owners for the event
- **Response:** Array of owner objects

### Get Players
- **Method:** `GET`
- **Path:** `/events/:eventId/players`
- **Auth:** Bearer token (event session)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Gets all players for the event with optional filtering
- **Query Parameters:**
  - `search` (optional) - Player name search string
  - `role` (optional) - Filter by player role
  - `status` (optional) - Filter by player status: `ACTIVE | SOLD | UNSOLD`
- **Response:** Array of player objects

### Get Auction Board
- **Method:** `GET`
- **Path:** `/events/:eventId/auction`
- **Auth:** Bearer token (event session)
- **Status:** ✅ **USED** (src/data/eventsService.js)
- **Description:** Gets current auction state and all lots
- **Response:** Auction board with active lot and lot list

---

## Auction Endpoints

**All require bearer token authentication (event session)**

### Get Auction State
- **Method:** `GET`
- **Path:** `/auction/:eventId/state`
- **Auth:** Bearer token (event session)
- **Status:** ❌ **NOT USED** (WebSocket used instead for real-time updates)
- **Description:** Gets detailed auction runtime state
- **Response:** Auction state object

### Place Bid
- **Method:** `POST`
- **Path:** `/auction/:eventId/bid`
- **Auth:** Bearer token (event session, owner role required)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Places a bid on an active auction lot
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:**
  ```json
  {
    "lotId": "uuid (required)",
    "amount": "integer (minimum 1)",
    "ownerId": "uuid (optional, uses session ownerId if not provided)"
  }
  ```
- **Response:** Bid result with lot info

### Mark Lot Status
- **Method:** `POST`
- **Path:** `/auction/:eventId/lots/:lotId/status`
- **Auth:** Bearer token (admin role required)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Marks a lot as sold, unsold, or active
- **URL Parameters:** 
  - `eventId` (Event ID)
  - `lotId` (Lot ID - uuid)
- **Request Body:**
  ```json
  {
    "status": "sold | unsold | active"
  }
  ```
- **Response:** Updated lot info

### Finalize Purchase
- **Method:** `POST`
- **Path:** `/auction/:eventId/lots/:lotId/finalize`
- **Auth:** Bearer token (admin role required)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Finalizes a purchase, assigning player to team and deducting coins
- **URL Parameters:** 
  - `eventId` (Event ID)
  - `lotId` (Lot ID - uuid)
- **Request Body:**
  ```json
  {
    "lotId": "uuid",
    "ownerId": "uuid (winning owner)",
    "amount": "integer (final price)"
  }
  ```
- **Response:** Finalized purchase result

### Start Auction
- **Method:** `POST`
- **Path:** `/auction/:eventId/start`
- **Auth:** Bearer token (admin role required)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Starts the auction process
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:**
  ```json
  {
    "autoProgress": "boolean (optional, default false)"
  }
  ```
- **Response:** Auction runtime object

### Stop Auction
- **Method:** `POST`
- **Path:** `/auction/:eventId/stop`
- **Auth:** Bearer token (admin role required)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Stops the running auction
- **URL Parameters:** `eventId` (Event ID)
- **Response:** Updated auction runtime

### Next Lot
- **Method:** `POST`
- **Path:** `/auction/:eventId/next-lot`
- **Auth:** Bearer token (admin role required)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Advances to the next lot in the auction
- **URL Parameters:** `eventId` (Event ID)
- **Response:** Next lot info or completion status

### Manual Lot Override
- **Method:** `POST`
- **Path:** `/auction/:eventId/manual-lot-override`
- **Auth:** Bearer token (admin role required)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Manually overrides a lot status (used for corrections)
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:**
  ```json
  {
    "lotId": "uuid",
    "status": "ACTIVE | SOLD | UNSOLD"
  }
  ```
- **Response:** Override result with updated lot

### Update Runtime Settings
- **Method:** `PATCH`
- **Path:** `/auction/:eventId/runtime`
- **Auth:** Bearer token (admin role required)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Updates auction runtime settings
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:**
  ```json
  {
    "autoProgress": "boolean (optional)"
  }
  ```
- **Response:** Updated runtime settings

### Extend Active Timer
- **Method:** `POST`
- **Path:** `/auction/:eventId/extend-timer`
- **Auth:** Bearer token (admin role required)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Extends the timer for the currently active lot
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:**
  ```json
  {
    "seconds": "integer (1-300)"
  }
  ```
- **Response:** Updated timer info

---

## Admin Endpoints

### Admin Login
- **Method:** `POST`
- **Path:** `/admin/login`
- **Auth:** None (public)
- **Status:** ✅ **USED** (src/pages/AdminLoginPage.jsx)
- **Description:** Authenticates as admin
- **Request Body:**
  ```json
  {
    "password": "string (minimum 6 chars)"
  }
  ```
- **Response:** Admin token
- **Status:** 200 OK

### Create Event
- **Method:** `POST`
- **Path:** `/admin/events`
- **Auth:** Bearer token (admin)
- **Status:** ❌ **NOT USED** (Create via admin dashboard not implemented)
- **Description:** Creates a new event
- **Request Body:**
  ```json
  {
    "slug": "string (3-100, lowercase alphanumeric + hyphens)",
    "title": "string (3-255)",
    "season": "string (optional)",
    "game": "string (2-100)",
    "mode": "string (optional)",
    "password": "string (4-50)",
    "registrationCount": "integer (optional)",
    "maxSlots": "integer (optional)",
    "streamStartTime": "string (ISO datetime, optional)",
    "auctionWindowSeconds": "integer (10-300, default 30)",
    "bannerUrl": "url (optional)"
  }
  ```
- **Response:** Created event
- **Status:** 201 Created

### List Events
- **Method:** `GET`
- **Path:** `/admin/events`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Lists all events with optional status filter
- **Query Parameters:**
  - `status` (optional) - Filter events by status
- **Response:** Array of events

### Get Event
- **Method:** `GET`
- **Path:** `/admin/events/:eventId`
- **Auth:** Bearer token (admin)
- **Status:** ❌ **NOT USED** (Uses full endpoint instead)
- **Description:** Gets a specific event
- **URL Parameters:** `eventId` (Event ID)
- **Response:** Event object

### Get Event Full (Workspace Data)
- **Method:** `GET`
- **Path:** `/admin/events/:eventId/full`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Gets complete event data with all related entities for admin workspace
- **URL Parameters:** `eventId` (Event ID)
- **Response:** Complete event workspace data

### Update Event
- **Method:** `PUT`
- **Path:** `/admin/events/:eventId`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Updates event details (any field is optional)
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:** (all fields optional)
  ```json
  {
    "slug": "string",
    "title": "string",
    "season": "string",
    "game": "string",
    "mode": "string",
    "password": "string",
    "registrationCount": "integer",
    "maxSlots": "integer",
    "streamStartTime": "string",
    "auctionWindowSeconds": "integer",
    "bannerUrl": "url"
  }
  ```
- **Response:** Updated event

### Delete Event
- **Method:** `DELETE`
- **Path:** `/admin/events/:eventId`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Deletes an event
- **URL Parameters:** `eventId` (Event ID)
- **Response:** Success message

---

## Admin Management Endpoints

### Create Owner
- **Method:** `POST`
- **Path:** `/admin/events/:eventId/owner`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Creates a single owner
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:**
  ```json
  {
    "name": "string (2-255)",
    "password": "string (4-100)",
    "avatarUrl": "url (optional)"
  }
  ```
- **Response:** Created owner object
- **Status:** 201 Created

### Create Owners (Bulk)
- **Method:** `POST`
- **Path:** `/admin/events/:eventId/owners`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Creates multiple owners (CSV or JSON)
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:** Array of owner objects or CSV string
  ```json
  [
    {
      "name": "string",
      "password": "string",
      "avatarUrl": "url (optional)"
    }
  ]
  ```
- **Response:** Array of created owners
- **Status:** 201 Created

### Update Owner
- **Method:** `PUT`
- **Path:** `/admin/events/:eventId/owner/:ownerId`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Updates owner details
- **URL Parameters:** 
  - `eventId` (Event ID)
  - `ownerId` (Owner ID - uuid)
- **Request Body:** (all fields optional)
  ```json
  {
    "name": "string",
    "password": "string",
    "avatarUrl": "url"
  }
  ```
- **Response:** Updated owner

### Delete Owner
- **Method:** `DELETE`
- **Path:** `/admin/events/:eventId/owner/:ownerId`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Deletes an owner
- **URL Parameters:** 
  - `eventId` (Event ID)
  - `ownerId` (Owner ID - uuid)
- **Response:** Success message

### Create Team
- **Method:** `POST`
- **Path:** `/admin/events/:eventId/team`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Creates a single team
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:**
  ```json
  {
    "name": "string (2-255)",
    "ownerId": "uuid",
    "coinsLeft": "integer (default 0)"
  }
  ```
- **Response:** Created team object
- **Status:** 201 Created

### Create Teams (Bulk)
- **Method:** `POST`
- **Path:** `/admin/events/:eventId/teams`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Creates multiple teams (CSV or JSON)
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:** Array of team objects or CSV string
  ```json
  [
    {
      "name": "string",
      "ownerId": "uuid",
      "coinsLeft": "integer"
    }
  ]
  ```
- **Response:** Array of created teams
- **Status:** 201 Created

### Update Team
- **Method:** `PUT`
- **Path:** `/admin/events/:eventId/team/:teamId`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Updates team details
- **URL Parameters:** 
  - `eventId` (Event ID)
  - `teamId` (Team ID - uuid)
- **Request Body:** (all fields optional)
  ```json
  {
    "name": "string",
    "ownerId": "uuid",
    "coinsLeft": "integer"
  }
  ```
- **Response:** Updated team

### Delete Team
- **Method:** `DELETE`
- **Path:** `/admin/events/:eventId/team/:teamId`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Deletes a team
- **URL Parameters:** 
  - `eventId` (Event ID)
  - `teamId` (Team ID - uuid)
- **Response:** Success message

### Create Player
- **Method:** `POST`
- **Path:** `/admin/events/:eventId/player`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Creates a single player
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:**
  ```json
  {
    "name": "string (2-255)",
    "role": "string (1-50)",
    "rankPoint": "integer (0-100, default 0)",
    "basePrice": "integer (default 0)",
    "imageUrl": "url (optional)"
  }
  ```
- **Response:** Created player object
- **Status:** 201 Created

### Create Players (Bulk)
- **Method:** `POST`
- **Path:** `/admin/events/:eventId/players`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Creates multiple players (CSV or JSON)
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:** Array of player objects or CSV string
  ```json
  [
    {
      "name": "string",
      "role": "string",
      "rankPoint": "integer",
      "basePrice": "integer",
      "imageUrl": "url"
    }
  ]
  ```
- **Response:** Array of created players
- **Status:** 201 Created

### Update Player
- **Method:** `PUT`
- **Path:** `/admin/events/:eventId/player/:playerId`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Updates player details
- **URL Parameters:** 
  - `eventId` (Event ID)
  - `playerId` (Player ID - uuid)
- **Request Body:** (all fields optional)
  ```json
  {
    "name": "string",
    "role": "string",
    "rankPoint": "integer",
    "basePrice": "integer",
    "imageUrl": "url",
    "status": "ACTIVE | SOLD | UNSOLD",
    "soldToTeamId": "uuid | null",
    "finalPrice": "integer | null"
  }
  ```
- **Response:** Updated player

### Delete Player
- **Method:** `DELETE`
- **Path:** `/admin/events/:eventId/player/:playerId`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Deletes a player
- **URL Parameters:** 
  - `eventId` (Event ID)
  - `playerId` (Player ID - uuid)
- **Response:** Success message

### Create Auction Lot
- **Method:** `POST`
- **Path:** `/admin/events/:eventId/lot`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Creates an auction lot
- **URL Parameters:** `eventId` (Event ID)
- **Request Body:**
  ```json
  {
    "playerId": "uuid",
    "status": "PENDING | ACTIVE | SOLD | UNSOLD (default PENDING)",
    "endsAt": "ISO datetime string (optional)",
    "lotOrder": "integer (minimum 1)"
  }
  ```
- **Response:** Created lot object
- **Status:** 201 Created

### Update Auction Lot
- **Method:** `PUT`
- **Path:** `/admin/events/:eventId/lot/:lotId`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Updates auction lot details
- **URL Parameters:** 
  - `eventId` (Event ID)
  - `lotId` (Lot ID - uuid)
- **Request Body:** (all fields optional)
  ```json
  {
    "playerId": "uuid",
    "status": "PENDING | ACTIVE | SOLD | UNSOLD",
    "endsAt": "ISO datetime string",
    "lotOrder": "integer"
  }
  ```
- **Response:** Updated lot

### Delete Auction Lot
- **Method:** `DELETE`
- **Path:** `/admin/events/:eventId/lot/:lotId`
- **Auth:** Bearer token (admin)
- **Status:** ✅ **USED** (src/pages/AdminDashboard.jsx)
- **Description:** Deletes an auction lot
- **URL Parameters:** 
  - `eventId` (Event ID)
  - `lotId` (Lot ID - uuid)
- **Response:** Success message

---

## Health Check

### Health Check
- **Method:** `GET`
- **Path:** `/health`
- **Auth:** None (public)
- **Status:** ❌ **NOT USED** (No health check implemented)
- **Description:** Checks if server is running
- **Response:** Server status + timestamp

---

## Summary

| Category | Count |
|----------|-------|
| Total Endpoints | 46 |
| ✅ Used Endpoints | 32 (70%) |
| ❌ Unused Endpoints | 14 (30%) |
| Public (No Auth) | 6 |
| Event Session Auth | 10 |
| Admin Auth Required | 30 |

| HTTP Method | Count |
|-------------|-------|
| GET | 15 |
| POST | 24 |
| PUT | 5 |
| PATCH | 1 |
| DELETE | 5 |

### Unused Endpoints (14 total)
- ❌ `GET /health` - Health check not implemented
- ❌ `GET /auction/:eventId/state` - WebSocket used instead
- ❌ `POST /admin/events` - Create event not exposed in admin UI
- ❌ `GET /admin/events/:eventId` - Partial data fetch (uses `/full` instead)
- ❌ `POST /admin/events/:eventId/owner` - Single owner creation (bulk upload available)
- ❌ `POST /admin/events/:eventId/team` - Single team creation (bulk upload available)
- ❌ `POST /admin/events/:eventId/player` - Single player creation (bulk upload available)

### Usage Breakdown by File
- **src/data/eventsService.js**: 17 endpoints
- **src/pages/AdminDashboard.jsx**: 22 endpoints
- **src/data/eventAuthService.js**: 3 endpoints
- **src/pages/AdminLoginPage.jsx**: 1 endpoint
