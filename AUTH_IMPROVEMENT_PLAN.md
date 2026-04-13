# Authentication System Improvement Plan

## Current Authentication Analysis

### Overview
Your application has **two separate authentication systems**:

1. **Admin Authentication** - For platform administrators
2. **Event Authentication** - For event participants (owners and viewers)

---

## Current Implementation Assessment

### 1. Admin Authentication

**Current Implementation:**
- Simple password-based authentication
- Single shared password stored in environment variable (`ADMIN_PASSWORD`)
- JWT tokens with 8-hour expiration
- Token stored in localStorage (`admin-token`)
- No token validation on frontend (only checks if token exists)
- No refresh token mechanism

**Security Issues:**
- ❌ No token validation on frontend before API calls
- ❌ Single shared password (no individual admin accounts)
- ❌ No password hashing (plain text comparison)
- ❌ No rate limiting on login attempts
- ❌ No session management or logout tracking
- ❌ No audit logging for admin actions
- ❌ Token stored in localStorage (vulnerable to XSS)
- ❌ No token refresh mechanism (hard expiration after 8h)
- ❌ No role-based access control (all admins have same permissions)

**Current Flow:**
```
User → /admin/login → Password check → JWT token → localStorage → /admin/dashboard
```

---

### 2. Event Authentication

**Current Implementation:**
- Event-specific password authentication
- Two roles: `owner` (can bid) and `viewer` (read-only)
- JWT tokens with 8-hour expiration
- Session stored in localStorage with key pattern `nm-event-auth:{eventId}`
- Token validation endpoint exists but not consistently used
- Owner role requires selecting an owner profile

**Security Issues:**
- ❌ Event passwords stored in plain text in database
- ❌ No rate limiting on login attempts
- ❌ Session validation only happens on mount, not on API calls
- ❌ Token stored in localStorage (vulnerable to XSS)
- ❌ No CSRF protection
- ❌ No refresh token mechanism
- ❌ Session mismatch check only on specific routes
- ❌ No concurrent session management
- ❌ Logout doesn't invalidate server-side session

**Current Flow:**
```
User → /events/login/:eventId → Password + Role selection → JWT token → localStorage → /events/:eventId/:tab
```

---

## Security Vulnerabilities Summary

### Critical Issues
1. **XSS Vulnerability** - Tokens in localStorage can be stolen via XSS attacks
2. **No Password Hashing** - Admin and event passwords stored/compared in plain text
3. **No Rate Limiting** - Brute force attacks possible on login endpoints
4. **No Token Refresh** - Hard session expiration causes poor UX
5. **No Server-Side Session Tracking** - Can't revoke tokens or track active sessions

### High Priority Issues
6. **No CSRF Protection** - State-changing operations vulnerable to CSRF
7. **Weak Admin Auth** - Single shared password, no individual accounts
8. **No Audit Logging** - Can't track who did what and when
9. **Inconsistent Token Validation** - Frontend doesn't validate tokens before use
10. **No Role-Based Access Control** - All admins have full access

### Medium Priority Issues
11. **No Multi-Factor Authentication** - Single factor (password) only
12. **No Password Complexity Requirements** - Weak passwords allowed
13. **No Account Lockout** - Unlimited login attempts
14. **No Session Timeout Warning** - Users not notified before expiration
15. **No Secure Cookie Options** - Not using httpOnly, secure, sameSite cookies

---

## Recommended Authentication Architecture

### Option 1: Enhanced JWT with Refresh Tokens (Recommended)

**Best for:** Your current architecture with minimal changes

**Implementation:**
- Access tokens (short-lived, 15 minutes)
- Refresh tokens (long-lived, 7 days, stored in httpOnly cookies)
- Token rotation on refresh
- Server-side token blacklist for logout
- Redis for session storage and blacklist

**Pros:**
- Stateless authentication (scales well)
- Better security than current implementation
- Moderate implementation effort
- Works well with your existing JWT setup

**Cons:**
- Still requires careful XSS protection
- Refresh token rotation adds complexity
- Need Redis for blacklist management

---

### Option 2: Session-Based Authentication

**Best for:** Maximum security, simpler mental model

**Implementation:**
- Server-side sessions stored in Redis
- Session ID in httpOnly, secure, sameSite cookies
- No JWT tokens
- Session data includes user info, permissions, expiration

**Pros:**
- Easy to revoke sessions server-side
- No token exposure to JavaScript
- Simpler to implement and reason about
- Better protection against XSS

**Cons:**
- Requires server-side state (Redis)
- Slightly more database/cache load
- Need sticky sessions or shared session store for horizontal scaling

---

### Option 3: Hybrid Approach (Best Security)

**Best for:** Enterprise-grade security requirements

**Implementation:**
- Session-based auth for admin panel
- JWT with refresh tokens for event authentication
- Different security models for different use cases

**Pros:**
- Optimal security for each use case
- Admin actions fully auditable
- Event auth remains stateless and scalable

**Cons:**
- Most complex to implement
- Two authentication systems to maintain
- Higher development and testing effort

---

## Recommended Improvements by Priority

### Phase 1: Critical Security Fixes (Week 1-2)

#### 1.1 Password Security
- [ ] Hash admin password using bcrypt/argon2
- [ ] Hash event passwords in database
- [ ] Add password complexity requirements
- [ ] Implement password change functionality

#### 1.2 Token Storage
- [ ] Move tokens from localStorage to httpOnly cookies
- [ ] Set secure, sameSite=strict cookie flags
- [ ] Implement CSRF token mechanism
- [ ] Add cookie encryption

#### 1.3 Rate Limiting
- [ ] Add rate limiting to login endpoints (5 attempts per 15 min)
- [ ] Implement account lockout after failed attempts
- [ ] Add IP-based rate limiting
- [ ] Log suspicious login attempts

#### 1.4 Token Validation
- [ ] Validate tokens on every API request
- [ ] Add token expiration checks on frontend
- [ ] Implement automatic token refresh
- [ ] Add token signature verification

---

### Phase 2: Authentication Enhancement (Week 3-4)

#### 2.1 Refresh Token System
- [ ] Implement refresh token generation
- [ ] Store refresh tokens in Redis with user mapping
- [ ] Add refresh token rotation
- [ ] Create token refresh endpoint
- [ ] Handle refresh token expiration gracefully

#### 2.2 Session Management
- [ ] Store active sessions in Redis
- [ ] Add session listing endpoint for users
- [ ] Implement "logout all devices" functionality
- [ ] Add concurrent session limits
- [ ] Track session metadata (IP, user agent, last activity)

#### 2.3 Admin Authentication Upgrade
- [ ] Create admin user accounts table
- [ ] Add admin user CRUD operations
- [ ] Implement role-based permissions (super_admin, admin, moderator)
- [ ] Add admin invitation system
- [ ] Implement admin password reset flow

---

### Phase 3: Advanced Security (Week 5-6)

#### 3.1 Multi-Factor Authentication
- [ ] Add TOTP-based 2FA for admin accounts
- [ ] Implement backup codes
- [ ] Add 2FA setup flow
- [ ] Create 2FA recovery process
- [ ] Make 2FA mandatory for admin accounts

#### 3.2 Audit Logging
- [ ] Log all authentication events (login, logout, failed attempts)
- [ ] Log all admin actions with user, timestamp, IP
- [ ] Create audit log viewer in admin dashboard
- [ ] Add audit log export functionality
- [ ] Implement log retention policy

#### 3.3 Security Monitoring
- [ ] Add anomaly detection (unusual login times, locations)
- [ ] Implement brute force detection
- [ ] Add email notifications for security events
- [ ] Create security dashboard with metrics
- [ ] Add webhook for security alerts

---

### Phase 4: User Experience (Week 7-8)

#### 4.1 Session Management UX
- [ ] Add session timeout warning (5 min before expiration)
- [ ] Implement "remember me" functionality
- [ ] Add "stay logged in" option with extended refresh token
- [ ] Show active sessions in user profile
- [ ] Add session activity timeline

#### 4.2 Password Management
- [ ] Add password strength indicator
- [ ] Implement password reset via email
- [ ] Add password change history
- [ ] Enforce password rotation policy (optional)
- [ ] Add "forgot password" flow

#### 4.3 Login Experience
- [ ] Add social login options (Google, Discord, etc.)
- [ ] Implement magic link authentication
- [ ] Add biometric authentication support (WebAuthn)
- [ ] Create unified login page
- [ ] Add login history viewer

---

## Implementation Recommendations

### Recommended Stack

**Backend:**
- `bcrypt` or `argon2` - Password hashing
- `jsonwebtoken` - JWT generation/verification (keep existing)
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `csurf` or `csrf-csrf` - CSRF protection
- `ioredis` - Redis client (already have)
- `winston` - Audit logging (already have)

**Frontend:**
- `js-cookie` - Cookie management
- `axios` - HTTP client with interceptors
- `react-query` - Auth state management
- `zxcvbn` - Password strength estimation

---

### Database Schema Changes

#### New Tables Needed:

**1. Admin Users Table**
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- super_admin, admin, moderator
  is_active BOOLEAN DEFAULT true,
  two_factor_secret VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**2. Refresh Tokens Table**
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL, -- admin, event_session
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

**3. Audit Logs Table**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  user_type VARCHAR(50), -- admin, event_session
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**4. Login Attempts Table**
```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL, -- email or event_id
  ip_address VARCHAR(45) NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_identifier ON login_attempts(identifier, created_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, created_at);
```

---

### Redis Schema

**Session Storage:**
```
session:{sessionId} → { userId, userType, role, expiresAt, metadata }
TTL: 8 hours
```

**Token Blacklist:**
```
blacklist:{tokenId} → { revokedAt, reason }
TTL: token expiration time
```

**Rate Limiting:**
```
ratelimit:login:{identifier} → attempt count
TTL: 15 minutes
```

**Active Sessions:**
```
user_sessions:{userId} → Set of sessionIds
TTL: 7 days
```

---

## Migration Strategy

### Step 1: Backward Compatible Changes
1. Add new tables without breaking existing auth
2. Implement new auth endpoints alongside old ones
3. Add feature flags for gradual rollout

### Step 2: Dual Authentication Period
1. Support both old and new auth methods
2. Migrate admin users to new system
3. Test thoroughly in production

### Step 3: Deprecation
1. Add deprecation warnings to old endpoints
2. Force migration for remaining users
3. Remove old authentication code

### Step 4: Cleanup
1. Remove old auth tables/fields
2. Update documentation
3. Remove feature flags

---

## Testing Requirements

### Unit Tests
- [ ] Password hashing and verification
- [ ] JWT token generation and validation
- [ ] Refresh token rotation logic
- [ ] Rate limiting logic
- [ ] Session management functions

### Integration Tests
- [ ] Login flow (admin and event)
- [ ] Token refresh flow
- [ ] Logout and session revocation
- [ ] Rate limiting enforcement
- [ ] CSRF protection

### Security Tests
- [ ] XSS attack prevention
- [ ] CSRF attack prevention
- [ ] SQL injection prevention
- [ ] Brute force attack prevention
- [ ] Token tampering detection

### Load Tests
- [ ] Concurrent login requests
- [ ] Token refresh under load
- [ ] Session lookup performance
- [ ] Redis performance under load

---

## Monitoring and Metrics

### Key Metrics to Track
- Login success/failure rate
- Average session duration
- Token refresh frequency
- Failed login attempts by IP
- Active sessions count
- Authentication latency (p50, p95, p99)

### Alerts to Configure
- Unusual spike in failed logins
- High rate of token refresh failures
- Redis connection issues
- Session store capacity warnings
- Suspicious login patterns detected

---

## Estimated Effort

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Critical Security Fixes | 2 weeks | Critical |
| Phase 2: Authentication Enhancement | 2 weeks | High |
| Phase 3: Advanced Security | 2 weeks | Medium |
| Phase 4: User Experience | 2 weeks | Low |

**Total Estimated Effort:** 8 weeks (1 developer)

---

## Quick Wins (Can Implement Today)

1. **Add Rate Limiting** (2 hours)
   - Install `express-rate-limit`
   - Add to login endpoints
   - Configure 5 attempts per 15 minutes

2. **Hash Admin Password** (1 hour)
   - Install `bcrypt`
   - Hash password on startup
   - Update verification logic

3. **Add Security Headers** (30 minutes)
   - Install `helmet`
   - Add to Express middleware
   - Configure CSP, HSTS, etc.

4. **Token Validation on Frontend** (2 hours)
   - Add token expiration check
   - Redirect to login if expired
   - Show warning before expiration

5. **Add Audit Logging** (3 hours)
   - Log all admin actions
   - Log authentication events
   - Store in existing logger

---

## Conclusion

Your current authentication system has **significant security vulnerabilities** that should be addressed urgently. The recommended approach is:

1. **Immediate:** Implement Phase 1 (Critical Security Fixes)
2. **Short-term:** Implement Phase 2 (Authentication Enhancement)
3. **Medium-term:** Implement Phase 3 (Advanced Security)
4. **Long-term:** Implement Phase 4 (User Experience)

**Recommended Architecture:** Option 1 (Enhanced JWT with Refresh Tokens) provides the best balance of security, scalability, and implementation effort for your use case.

The most critical issues to fix immediately are:
- Password hashing
- Token storage (move to httpOnly cookies)
- Rate limiting
- Token validation

These can be implemented in 1-2 weeks and will significantly improve your security posture.
