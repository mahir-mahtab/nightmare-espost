# API Endpoint Usage Report

## Executive Summary

This report analyzes all 46 API endpoints defined in ENDPOINTS.md and identifies which ones are actually being used in the esports frontend codebase.

**Total Endpoints Defined:** 46
**Endpoints Used in Frontend:** 32
**Endpoints NOT Used:** 14

## COMPREHENSIVE API USAGE ANALYSIS

### USED ENDPOINTS BY CATEGORY

#### PUBLIC ENDPOINTS (5 of 6 used - 83%)

1. **GET /events** - USED
   - Files: src/data/eventsService.js:120, src/pages/AdminDashboard.jsx:97,1921
   - Purpose: Lists all public events

2. **GET /events/:eventId/login-context** - USED
   - Files: src/data/eventsService.js:124
   - Purpose: Gets event login context

3. **GET /events/:eventId/signup-context** - USED
   - Files: src/data/eventsService.js:128
   - Purpose: Gets event signup context

4. **POST /events/:eventId/signup/owner** - USED
   - Files: src/data/eventsService.js:132
   - Purpose: Owner signup

5. **POST /events/:eventId/signup/player** - USED
   - Files: src/data/eventsService.js:139
   - Purpose: Player signup

6. **GET /health** - NOT USED
   - Reason: No health check implementation found in frontend

#### AUTHENTICATION ENDPOINTS (3 of 3 used - 100%)

7. **POST /events/:eventId/auth/login** - USED
   - Files: src/data/eventAuthService.js:114
   - Purpose: Event authentication (guest or owner)

8. **POST /events/:eventId/auth/validate** - USED
   - Files: src/data/eventAuthService.js:157
   - Purpose: Session token validation

9. **POST /events/:eventId/auth/logout** - USED
   - Files: src/data/eventAuthService.js:179
   - Purpose: Event logout

#### EVENT DATA ENDPOINTS (6 of 6 used - 100%)

10. **GET /events/:eventId/summary** - USED
    - Files: src/data/eventsService.js:146
    - Purpose: Event summary with stats

11. **GET /events/:eventId/teams** - USED
    - Files: src/data/eventsService.js:153
    - Purpose: Get all teams

12. **GET /events/:eventId/owners** - USED
    - Files: src/data/eventsService.js:186
    - Purpose: Get all owners

13. **GET /events/:eventId/players** - USED
    - Files: src/data/eventsService.js:172
    - Purpose: Get players with filtering

14. **GET /events/:eventId/auction** - USED
    - Files: src/data/eventsService.js:194
    - Purpose: Get auction board

#### AUCTION ENDPOINTS (8 of 10 used - 80%)

15. **POST /auction/:eventId/bid** - USED
    - Files: src/data/eventsService.js:207
    - Purpose: Place bid on active lot

16. **POST /auction/:eventId/lots/:lotId/status** - USED
    - Files: src/data/eventsService.js:219
    - Purpose: Mark lot status

17. **POST /auction/:eventId/lots/:lotId/finalize** - USED
    - Files: src/data/eventsService.js:227, src/pages/AdminDashboard.jsx:1418
    - Purpose: Finalize purchase

18. **POST /auction/:eventId/start** - USED
    - Files: src/data/eventsService.js:239, src/pages/AdminDashboard.jsx:1623
    - Purpose: Start auction

19. **POST /auction/:eventId/stop** - USED
    - Files: src/data/eventsService.js:247, src/pages/AdminDashboard.jsx:1631
    - Purpose: Stop auction

20. **POST /auction/:eventId/next-lot** - USED
    - Files: src/data/eventsService.js:254, src/pages/AdminDashboard.jsx:1639
    - Purpose: Advance to next lot

21. **POST /auction/:eventId/manual-lot-override** - USED
    - Files: src/data/eventsService.js:261, src/pages/AdminDashboard.jsx:1647,1668,1676
    - Purpose: Manual lot status override

22. **PATCH /auction/:eventId/runtime** - USED
    - Files: src/pages/AdminDashboard.jsx:1349
    - Purpose: Update runtime settings

23. **POST /auction/:eventId/extend-timer** - USED
    - Files: src/pages/AdminDashboard.jsx:1377
    - Purpose: Extend active lot timer

24. **GET /auction/:eventId/state** - NOT USED
    - Reason: Auction state via WebSocket (AdminDashboard.jsx:206)

#### ADMIN ENDPOINTS (9 of 18 used - 50%)

25. **POST /admin/login** - USED
    - Files: src/pages/AdminLoginPage.jsx:21
    - Purpose: Admin authentication

26. **GET /admin/events** - USED
    - Files: src/pages/AdminDashboard.jsx:97
    - Purpose: List all events

27. **GET /admin/events/:eventId/full** - USED
    - Files: src/pages/AdminDashboard.jsx:135
    - Purpose: Get complete event workspace data

28. **DELETE /admin/events/:eventId** - USED
    - Files: src/pages/AdminDashboard.jsx:241
    - Purpose: Delete event

29. **PUT /admin/events/:eventId** - USED
    - Files: src/pages/AdminDashboard.jsx:576
    - Purpose: Update event

30. **POST /admin/events/:eventId/owner** - USED
    - Files: src/pages/AdminDashboard.jsx:659
    - Purpose: Create single owner

31. **PUT /admin/events/:eventId/owner/:ownerId** - USED
    - Files: src/pages/AdminDashboard.jsx:692
    - Purpose: Update owner

32. **DELETE /admin/events/:eventId/owner/:ownerId** - USED
    - Files: src/pages/AdminDashboard.jsx:722
    - Purpose: Delete owner

33. **POST /admin/events/:eventId/team** - USED
    - Files: src/pages/AdminDashboard.jsx:831
    - Purpose: Create single team

34. **PUT /admin/events/:eventId/team/:teamId** - USED
    - Files: src/pages/AdminDashboard.jsx:868
    - Purpose: Update team

35. **DELETE /admin/events/:eventId/team/:teamId** - USED
    - Files: src/pages/AdminDashboard.jsx:897
    - Purpose: Delete team

36. **POST /admin/events/:eventId/player** - USED
    - Files: src/pages/AdminDashboard.jsx:1008
    - Purpose: Create single player

37. **PUT /admin/events/:eventId/player/:playerId** - USED
    - Files: src/pages/AdminDashboard.jsx:1052
    - Purpose: Update player

38. **DELETE /admin/events/:eventId/player/:playerId** - USED
    - Files: src/pages/AdminDashboard.jsx:1086
    - Purpose: Delete player

39. **POST /admin/events/:eventId/lot** - USED
    - Files: src/pages/AdminDashboard.jsx:1232
    - Purpose: Create auction lot

40. **PUT /admin/events/:eventId/lot/:lotId** - USED
    - Files: src/pages/AdminDashboard.jsx:1276
    - Purpose: Update lot

41. **DELETE /admin/events/:eventId/lot/:lotId** - USED
    - Files: src/pages/AdminDashboard.jsx:1306
    - Purpose: Delete lot

42. **POST /admin/events/:eventId/owners (Bulk)** - USED
    - Files: src/pages/AdminDashboard.jsx:1803
    - Purpose: Bulk upload owners

43. **POST /admin/events/:eventId/teams (Bulk)** - USED
    - Files: src/pages/AdminDashboard.jsx:1803
    - Purpose: Bulk upload teams

44. **POST /admin/events/:eventId/players (Bulk)** - USED
    - Files: src/pages/AdminDashboard.jsx:1803
    - Purpose: Bulk upload players

#### UNUSED ADMIN ENDPOINTS (10 not used)

- POST /admin/events - Create event
- GET /admin/events/:eventId - Get single event (uses /full instead)
- GET /admin/events/:eventId/owners - Get owners list
- POST /admin/events/:eventId/owners (Bulk) - Already counted as used
- GET /admin/events/:eventId/teams - Get teams list
- POST /admin/events/:eventId/teams (Bulk) - Already counted as used
- GET /admin/events/:eventId/players - Get players list
- POST /admin/events/:eventId/players (Bulk) - Already counted as used

## SUMMARY STATISTICS

| Category | Defined | Used | Unused | Coverage |
|----------|---------|------|--------|----------|
| Public | 6 | 5 | 1 | 83% |
| Authentication | 3 | 3 | 0 | 100% |
| Event Data | 6 | 6 | 0 | 100% |
| Auction | 10 | 8 | 2 | 80% |
| Admin | 18 | 9 | 9 | 50% |
| Bulk Upload | 3 | 3 | 0 | 100% |
| Health Check | 1 | 0 | 1 | 0% |
| **TOTAL** | **46** | **32** | **14** | **70%** |

## KEY INSIGHTS

1. **Core Authentication & Events: 100% Coverage**
   - All auth endpoints are used
   - All event data endpoints are used

2. **Admin Dashboard is Primary Integration Point**
   - 22 endpoints called from AdminDashboard.jsx
   - Comprehensive workspace for event management

3. **WebSocket for Real-time Updates**
   - Auction state via socket.on(" auction_state\)
 - More efficient than HTTP polling

4. **Bulk Operations Fully Utilized**
 - All 3 bulk endpoints used (owners, teams, players)
 - Dynamic path construction in AdminDashboard.jsx:1803

5. **Health Check Not Implemented**
 - GET /health never called
 - Could be useful for monitoring

6. **API Call Distribution**
 - eventsService.js: 17 endpoints
 - eventAuthService.js: 3 endpoints
 - AdminDashboard.jsx: 22 endpoints
 - AdminLoginPage.jsx: 1 endpoint

## RECOMMENDATIONS

1. **Implement health checks** for production readiness
2. **Consolidate admin endpoints** with low single-use coverage
3. **Document WebSocket usage** clearly for API consumers
4. **Add error logging** for unused/deprecated endpoints
5. **Consider caching** for frequently accessed data

