# Event Refactor Summary

Date: 2026-04-02

## What Was Implemented

The Events section was refactored into a simple 3-step flow:

1. Public event list page (no event sub-navigation shown by default).
2. Per-event login page.
3. Protected event tabs page (sub-navigation visible only after entering the event flow).

## Main Behavior Changes

1. Event navigation is hidden on the initial Events list screen.
2. Clicking Open Auction View sends users to event login if not authenticated.
3. After login, users are routed into the event tabs (auction by default).
4. Bidding and auction mutation actions are owner-only.
5. Viewer login remains read-only for auction controls.
6. Event session is persisted per event with TTL in localStorage.

## New Files Added

1. src/pages/EventsHubPage.jsx
2. src/pages/EventLoginPage.jsx
3. src/components/routing/ProtectedEventRoute.jsx
4. src/data/eventAuthService.js
5. src/hooks/useEventAuth.js

## Existing Files Updated

1. src/App.jsx
2. src/pages/EventsPage.jsx
3. src/components/layout/EventSubNav.jsx

## Route Structure After Refactor

1. /events -> public events hub
2. /events/login/:eventId -> event-scoped login
3. /events/:eventId/:tab -> protected event tabs

## Auth and Permission Notes

1. Auth is event-scoped and stored as nm-event-auth:<eventId>.
2. Roles currently supported: owner, viewer.
3. Owner role can place bids and execute auction actions.
4. Viewer role can view auction data but cannot mutate state.

## Validation Performed

1. npm run build passed.
2. npm run lint passed.

## Goal Achieved

The implementation keeps architecture simple while preparing a clean base for future backend authentication integration.
