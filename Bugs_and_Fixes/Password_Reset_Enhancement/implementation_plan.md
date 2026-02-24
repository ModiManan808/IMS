# Password Reset System Enhancement - Implementation Plan

## Problem Statement

1. **Current Issue**: Application number-based password reset for interns shows "An error occurred. Please try again"
2. **Missing Feature**: No recovery mechanism for admin accounts if they forget their password
3. **Requirement**: Implement secure, industry-standard password reset with super admin fallback

## Investigation Findings

### Current Implementation
- Backend `requestPasswordReset` controller accepts `userType`, `email` (admin), and `applicationNo` (intern)
- Logic looks correct in code review
- Frontend sends proper request format
- Error is generic 500 error suggesting backend exception

### Potential Issues to Debug
1. Intern model may not have `applicationNo` field properly defined
2. Database column naming mismatch
3. Frontend sending wrong field name
4. Validation error before database query

## Proposed Changes

### Phase 1: Debug and Fix Current Implementation

#### Backend Investigation
- [ ] Verify Intern model has `applicationNo` field
- [ ] Check if field name in database matches code
- [ ] Add detailed error logging to `requestPasswordReset`
- [ ] Test API endpoint directly with Postman/curl

#### Frontend.
- [ ] Check network request payload in browser DevTools
- [ ] Verify field name sent matches backend expectation
- [ ] Add better error handling and logging

### Phase 2: Add Admin Password Recovery System

Following industry security standards (OWASP, NIST guidelines):

#### Super Admin Fallback Email
- [NEW] Add `SUPER_ADMIN_EMAIL` to environment variables
- [NEW] Update PasswordReset workflow:
  - If admin requests reset, send to their registered email
  - **Additionally**, send notification to super admin email
  - Super admin email never exposed to users

#### Security Considerations
✅ **Rate Limiting**: Prevent brute force attacks on reset requests
✅ **Email Verification**: Ensure reset emails go only to verified addresses  
✅ **Token Expiry**: 30 minutes (already implemented)
✅ **One-time Use**: Reset tokens invalidated after use (already implemented)
✅ **Audit Trail**: Log all password reset attempts
✅ **No Email Enumeration**: Generic success messages (already implemented)

### Phase 3: Enhanced Security Features

#### Rate Limiting
```javascript
// Use express-rate-limit middleware
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs per user type
  message: 'Too many password reset attempts. Please try again later.'
});
```

#### Account Lockout Protection
- Track failed reset attempts
- Temporary lockout after multiple failed attempts
- Notify user via email of suspicious activity

#### Multi-Factor Recovery (Optional Enhancement)
- For high-security admin accounts
- Require security questions or backup codes
- SMS/OTP verification option

## Implementation Steps

### Step 1: Fix Intern Password Reset (IMMEDIATE)
1. Add console logging to backend controller
2. Test with actual application number
3. Verify database schema
4. Fix any field name mismatches

### Step 2: Add Super Admin Recovery (HIGH PRIORITY)
1. Add `SUPER_ADMIN_EMAIL` to `.env`
2. Update email service to send copies to super admin
3. Create admin notification template
4. Test email delivery

### Step 3: Security Hardening (MEDIUM PRIORITY)
1. Implement rate limiting on reset endpoint
2. Add detailed audit logging
3. Create admin dashboard for monitoring resets
4. Document recovery procedures

### Step 4: Testing
1. Test intern password reset with valid application number
2. Test admin password reset with email
3. Test super admin notification delivery
4. Test rate limiting
5. Verify email content and formatting

## Database Changes

No schema changes required if `applicationNo` field exists. If not:

```javascript
// Migration to add applicationNo if missing
applicationNo: {
  type: DataTypes.STRING,
  unique: true,
  allowNull: true // Some old interns may not have it
}
```

## Environment Variables

```env
# Super Admin Recovery
SUPER_ADMIN_EMAIL=superadmin@nfsu.ac.in

# Rate Limiting (optional - defaults provided)
RESET_RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RESET_RATE_LIMIT_MAX_REQUESTS=3    # Max requests per window
```

## API Endpoints

Current endpoints (no changes needed):
- `POST /api/request-password-reset` - Request reset link
- `POST /api/verify-reset-token` - Verify token validity  
- `POST /api/reset-password` - Complete password reset

## Security Compliance Checklist

- [x] Tokens are cryptographically random
- [x] Tokens expire after reasonable time (30 min)
- [x] Tokens are single-use only
- [ ] Rate limiting prevents brute force
- [x] No email enumeration via response messages
- [ ] All reset attempts logged for audit
- [ ] Super admin notified of admin resets
- [x] Passwords hashed with bcrypt
- [x] HTTPS required in production

## Risk Assessment

**Low Risk**:
- Adding super admin email notification
- Enhanced logging

**Medium Risk**:
- Fixing existing password reset (may affect current users)
- Rate limiting (may block legitimate users)

**Mitigation**:
- Test thoroughly before deployment
- Have recovery procedures documented
- Monitor logs after deployment
- Gradual rollout

## Next Steps

1. **IMMEDIATE**: Debug intern password reset error
2. **HIGH**: Implement super admin notification  
3. **MEDIUM**: Add rate limiting
4. **LOW**: Enhanced monitoring dashboard

## User Review Required

> [!IMPORTANT]
> **Super Admin Email**: What email address should receive admin password reset notifications?
> - Default suggestion: `superadmin@nfsu.ac.in` or IT department email
> - This email will receive copy of all admin password reset requests

> [!WARNING]
> **Breaking Changes**: None expected, but password reset functionality will be enhanced with additional security measures.
