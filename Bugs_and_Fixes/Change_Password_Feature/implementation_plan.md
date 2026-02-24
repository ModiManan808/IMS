# Change Password Feature - Implementation Plan

## Overview

Implement a secure, industry-standard password change feature for both Interns and Admins, accessible through their respective profile/settings pages.

## Security Requirements (Industry Standards)

✅ **Current Password Verification**: Require users to enter current password
✅ **Password Strength Validation**: Enforce minimum 8 characters
✅ **Confirmation Match**: Require password confirmation
✅ **Email Notification**: Send security alert after password change
✅ **Audit Logging**: Log all password change attempts
✅ **Rate Limiting**: Prevent brute force attacks (5 attempts per 15 minutes)
✅ **Session Management**: Optional - invalidate other sessions after change

## Proposed Changes

### Backend Implementation

#### New API Endpoint
```javascript
POST /api/change-password
Headers: Authorization: Bearer <JWT>
Body: {
  currentPassword: string,
  newPassword: string
}
```

#### [NEW] `authController.changePassword`
- Verify user is authenticated (JWT middleware)
- Validate current password matches
- Validate new password strength
- Hash new password with bcrypt
- Update password in database
- Send email notification
- Log the change event
- Return success response

#### Rate Limiting
```javascript
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many password change attempts. Please try again later.'
});
```

---

### Frontend Implementation

#### Admin Profile Page Enhancement
**Location**: Likely `/src/pages/admin/Profile.tsx` or create new if doesn't exist

**UI Components**:
- Current Password input field
- New Password input field (with strength indicator)
- Confirm New Password input field
- Show/hide password toggle
- Submit button
- Success/error messages

#### Intern Profile Page Enhancement
**Location**: Likely `/src/pages/intern/Profile.tsx` or similar

Same UI components as admin profile

---

### Database Considerations

No schema changes required - password already exists in both models:
- `Admin.password` ✅
- `Intern.password` ✅

---

### Email Notification Template

**Subject**: Password Changed - IMS Portal

**Body**:
```
Dear [User Name],

Your password was successfully changed on [Date & Time].

If you did not make this change, please contact the administrator immediately.

Account Details:
- User Type: [Admin/Intern]
- Email: [user@email.com]
- Changed At: [timestamp]

Best regards,
IMS Security Team
```

---

## Implementation Steps

### Phase 1: Backend API (High Priority)

1. **Create Change Password Controller**
   - [ ] Add `changePassword` function to `authController.js`
   - [ ] Validate current password
   - [ ] Hash and save new password
   - [ ] Return appropriate responses

2. **Add Route with Rate Limiting**
   - [ ] Add POST `/api/change-password` to `apiRoutes.js`
   - [ ] Apply JWT authentication middleware
   - [ ] Apply rate limiting middleware
   - [ ] Test with Postman/curl

3. **Email Notification**
   - [ ] Create email template function
   - [ ] Send notification after successful password change
   - [ ] Include timestamp and user info

4. **Audit Logging**
   - [ ] Log successful password changes
   - [ ] Log failed attempts
   - [ ] Include user ID, timestamp, IP address

---

### Phase 2: Frontend UI (High Priority)

1. **Check for Existing Profile Pages**
   - [ ] Search for admin profile page
   - [ ] Search for intern profile page/dashboard
   - [ ] Determine best location for change password UI

2. **Create Change Password Component** (if needed)
   - [ ] Create reusable `ChangePassword.tsx` component
   - [ ] Add current password field
   - [ ] Add new password field with strength indicator
   - [ ] Add confirm password field
   - [ ] Add form validation
   - [ ] Add submit handler

3. **Integrate into Profile Pages**
   - [ ] Add change password section to admin profile
   - [ ] Add change password section to intern dashboard/profile
   - [ ] Style consistently with existing UI

4. **Add Password Strength Indicator**
   - [ ] Weak: < 8 characters
   - [ ] Medium: 8-11 characters
   - [ ] Strong: 12+ characters
   - [ ] Visual color coding (red/yellow/green)

---

### Phase 3: Testing & Validation

1. **Backend Testing**
   - [ ] Test with correct current password
   - [ ] Test with incorrect current password
   - [ ] Test with weak new password
   - [ ] Test password confirmation mismatch
   - [ ] Test rate limiting behavior
   - [ ] Verify email notification sent
   - [ ] Check audit logs

2. **Frontend Testing**
   - [ ] Test form validation
   - [ ] Test password strength indicator
   - [ ] Test show/hide password toggle
   - [ ] Test error messages display
   - [ ] Test success message display
   - [ ] Verify UI on both admin and intern sides

3. **Integration Testing**
   - [ ] Change password as admin
   - [ ] Login with new password
   - [ ] Change password as intern
   - [ ] Login with new password
   - [ ] Verify email received

---

## API Design

### Request
```typescript
POST /api/change-password
Headers: {
  Authorization: 'Bearer <token>'
}
Body: {
  currentPassword: string,
  newPassword: string
}
```

### Success Response (200)
```json
{
  "message": "Password changed successfully"
}
```

### Error Responses

**401 Unauthorized** - Invalid/missing token
```json
{
  "error": "Authentication required"
}
```

**400 Bad Request** - Current password incorrect
```json
{
  "error": "Current password is incorrect"
}
```

**400 Bad Request** - Weak password
```json
{
  "error": "Password must be at least 8 characters long"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "error": "Too many password change attempts. Please try again later."
}
```

---

## Security Best Practices Checklist

- [x] Require current password verification
- [x] Enforce password strength requirements
- [x] Hash passwords with bcrypt
- [x] Rate limit password change requests
- [x] Send email notification on successful change
- [x] Log all password change events
- [x] Use HTTPS in production
- [x] Validate input on both client and server
- [x] Prevent password in error messages
- [ ] Optional: Invalidate other sessions on password change

---

## Files to Create/Modify

### Backend
- [MODIFY] `controllers/authController.js` - Add changePassword function
- [MODIFY] `routes/apiRoutes.js` - Add change-password route

### Frontend
- [MODIFY] Admin profile page (location TBD)
- [MODIFY] Intern profile/dashboard page (location TBD)
- [CREATE] `components/ChangePassword.tsx` (optional reusable component)

---

## User Flow

### Admin/Intern Change Password Flow

1. User navigates to Profile/Settings page
2. User sees "Change Password" section
3. User enters current password
4. User enters new password (sees strength indicator)
5. User confirms new password
6. User clicks "Change Password" button
7. System validates current password
8. System validates new password strength
9. System validates passwords match
10. System updates password in database
11. System sends email notification
12. System logs the change
13. System shows success message
14. User can immediately login with new password

### Error Scenarios

- **Incorrect current password**: Show error, don't reveal if account exists
- **Weak new password**: Show requirement (min 8 chars)
- **Passwords don't match**: Show mismatch error
- **Rate limit exceeded**: Show try again later message

---

## Next Steps

1. **IMMEDIATE**: Search for existing profile pages
2. **HIGH**: Implement backend API endpoint
3. **HIGH**: Create frontend UI component
4. **MEDIUM**: Test thoroughly
5. **LOW**: Optional session invalidation feature
