# User Flows - Comprehensive Todo List

> **Execution Order:** 3 of 6
> **Status Overview**: Core authentication and profile flows are functional. Key gaps in email verification enforcement, team invitation acceptance, and advanced security features.

---

## Current State Summary

### Working Components
- Email/password authentication via Supabase Auth
- Login with 2FA verification support
- Password reset workflow (forgot + reset pages)
- Multi-step onboarding flow (5 steps)
- Profile settings with avatar upload
- Notification preferences
- Two-factor authentication setup/verification
- Team creation and member management
- Billing integration with Stripe

### Key Gaps
- Email verification disabled by default
- No team invitation acceptance page
- Limited session management
- No social authentication
- Missing backup codes display UI
- Incomplete audit logging visibility

---

## Phase 1: Authentication Hardening

### UF-1.1 Enable and Enforce Email Verification

**Status:** Not Started
**Priority:** CRITICAL
**Estimated Effort:** 4-6 hours
**Risk:** HIGH - Security requirement

**Prompt:**
Enable email verification by default and create proper flows for users to verify their email addresses before accessing protected features.

**Implementation Details:**
1. Enable email verification in Supabase Auth settings
2. Create verification email template
3. Add unverified email banner with resend option
4. Gate certain features until verified
5. Implement verification success page
6. Handle expired verification links

**Files to Modify:**
- `app/verify-email/page.tsx` - Enhance verification handling
- `components/dashboard/unverified-email-banner.tsx` - Already exists, connect
- `app/resend-verification/page.tsx` - Implement resend flow

**Acceptance Criteria:**
- [ ] New users receive verification email
- [ ] Verification link works and confirms email
- [ ] Unverified users see banner with resend option
- [ ] Resend rate limited (1 per minute)
- [ ] Expired links show helpful message
- [ ] Feature gates work for unverified users
- [ ] Email template is branded and clear

---

### UF-1.2 Social Authentication (OAuth)

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 6-8 hours
**Risk:** MEDIUM - Third-party dependency

**Prompt:**
Add social login options (Google, GitHub) to reduce friction in signup and login flows.

**Implementation Details:**
1. Configure OAuth providers in Supabase
2. Add social login buttons to login/signup pages
3. Handle OAuth callback and profile creation
4. Link social accounts to existing accounts
5. Handle provider-specific data mapping
6. Support account unlinking

**Acceptance Criteria:**
- [ ] Google sign-in button on login/signup
- [ ] GitHub sign-in button on login/signup
- [ ] OAuth flow completes successfully
- [ ] New users get profile created automatically
- [ ] Existing users can link social accounts
- [ ] Can unlink social accounts from settings
- [ ] Proper error handling for OAuth failures

---

### UF-1.3 Session Management

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 5-6 hours
**Risk:** MEDIUM - Security feature

**Prompt:**
Implement proper session management allowing users to view active sessions and revoke access from unknown devices.

**Implementation Details:**
1. Track active sessions with device info
2. Create sessions list in security settings
3. Show device type, location, last active
4. Allow revoking specific sessions
5. "Sign out all devices" option
6. Session expiration warnings

**Database Schema:**
```sql
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  session_token text NOT NULL,
  device_info jsonb,
  ip_address inet,
  location text,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);
```

**Acceptance Criteria:**
- [ ] Active sessions listed in settings
- [ ] Device info displayed (browser, OS)
- [ ] Location shown if available
- [ ] Can revoke individual sessions
- [ ] Can sign out all devices
- [ ] Session expiration handled gracefully
- [ ] Warning shown before session expires

---

### UF-1.4 Account Lockout Protection

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 4-5 hours
**Risk:** MEDIUM - Security requirement

**Prompt:**
Implement account lockout after multiple failed login attempts to prevent brute force attacks.

**Implementation Details:**
1. Track failed login attempts per account
2. Lock account after 5 failed attempts
3. Implement lockout duration (15 minutes initially)
4. Progressive lockout (longer with repeated lockouts)
5. Admin unlock capability
6. Email notification on lockout

**Acceptance Criteria:**
- [ ] Failed attempts tracked per account
- [ ] Account locks after 5 failures
- [ ] 15-minute lockout initially
- [ ] Lockout duration increases with repeats
- [ ] Admin can manually unlock accounts
- [ ] User notified via email on lockout
- [ ] Clear countdown shown during lockout

---

### UF-1.5 Backup Codes Display and Download

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 3-4 hours
**Risk:** LOW - UX improvement

**Prompt:**
Provide proper UI for users to view, download, and manage their 2FA backup codes.

**Implementation Details:**
1. Show backup codes after 2FA setup
2. Require confirmation before showing
3. Download codes as text file
4. Copy all codes button
5. Mark codes as used
6. Regenerate codes with warning

**Files to Modify:**
- `components/settings/enable-two-factor-dialog.tsx` - Add codes display
- `components/settings/regenerate-backup-codes-dialog.tsx` - Enhance UI

**Acceptance Criteria:**
- [ ] Backup codes shown after 2FA enabled
- [ ] Confirmation required before display
- [ ] Download as .txt file option
- [ ] Copy all button works
- [ ] Used codes marked (if trackable)
- [ ] Regenerate warns about invalidation
- [ ] Clear instructions provided

---

## Phase 2: Onboarding Optimization

### UF-2.1 Guided Product Tour

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 6-8 hours
**Risk:** LOW - Enhancement

**Prompt:**
Create an interactive product tour that highlights key features after onboarding completion.

**Implementation Details:**
1. Tooltip-based tour using library (e.g., react-joyride)
2. Tour steps for dashboard, agents, swarms, tools
3. Skip option at any time
4. Resume tour from settings
5. Track tour completion
6. Context-sensitive tips

**Acceptance Criteria:**
- [ ] Tour starts after onboarding complete
- [ ] Tooltips highlight key UI elements
- [ ] Can skip tour at any time
- [ ] Can restart tour from settings
- [ ] Tour completion tracked
- [ ] Tips don't show again after tour

---

### UF-2.2 Onboarding Templates

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Enhancement

**Prompt:**
Offer pre-configured templates during onboarding based on user's selected use case.

**Implementation Details:**
1. Template suggestions on step 3 (agent creation)
2. Quick-start templates per use case
3. One-click template application
4. Preview template before applying
5. Customize after applying
6. Skip to blank agent option

**Acceptance Criteria:**
- [ ] Templates shown based on use case selection
- [ ] Quick-start applies template instantly
- [ ] Preview shows what template includes
- [ ] Can customize after applying
- [ ] Skip option always available
- [ ] Templates match use case categories

---

### UF-2.3 Onboarding Progress Persistence

**Status:** Partially Implemented
**Priority:** MEDIUM
**Estimated Effort:** 3-4 hours
**Risk:** LOW - Bug fix

**Prompt:**
Ensure onboarding progress is properly saved and restored if user leaves mid-flow.

**Implementation Details:**
1. Save progress after each step completion
2. Restore to last completed step on return
3. Handle session expiration during onboarding
4. Clear progress on completion
5. Allow manual restart from settings
6. Guest mode progress handling

**Files to Modify:**
- `app/onboarding/page.tsx` - Enhance persistence
- `hooks/use-auth.ts` - Improve progress tracking

**Acceptance Criteria:**
- [ ] Progress saved after each step
- [ ] Returning users resume at correct step
- [ ] Session expiration handled gracefully
- [ ] Completed onboarding marked properly
- [ ] Can restart from settings
- [ ] Guest progress stored locally

---

### UF-2.4 Skip Onboarding for Experienced Users

**Status:** Not Started
**Priority:** LOW
**Estimated Effort:** 2-3 hours
**Risk:** LOW - UX

**Prompt:**
Allow experienced users to skip onboarding entirely and go directly to dashboard.

**Implementation Details:**
1. "I know what I'm doing" skip option
2. Confirmation before skipping
3. Quick access to key actions on dashboard
4. Prompt to complete onboarding later
5. Track skip rate for analytics

**Acceptance Criteria:**
- [ ] Skip option visible on first step
- [ ] Confirmation dialog before skip
- [ ] Dashboard shows quick start actions
- [ ] Reminder to complete onboarding
- [ ] Skip tracked for analytics

---

## Phase 3: Team & Organization Flows

### UF-3.1 Team Invitation Acceptance Page

**Status:** Not Started
**Priority:** CRITICAL
**Estimated Effort:** 5-6 hours
**Risk:** HIGH - Core team feature

**Prompt:**
Create the invitation acceptance flow for users joining teams via email invitation.

**Implementation Details:**
1. Create `/accept-invite/[token]` page
2. Validate invitation token
3. Handle new user vs existing user
4. Join team on acceptance
5. Redirect to team dashboard
6. Handle expired invitations

**Files to Create:**
- `app/accept-invite/[token]/page.tsx`

**Acceptance Criteria:**
- [ ] Invitation link opens acceptance page
- [ ] Token validation works correctly
- [ ] New users prompted to sign up first
- [ ] Existing users join team immediately
- [ ] Redirect to team dashboard on success
- [ ] Expired invitations show clear message
- [ ] Invalid tokens handled gracefully

---

### UF-3.2 Team Member Role Management

**Status:** Partially Implemented
**Priority:** HIGH
**Estimated Effort:** 4-5 hours
**Risk:** MEDIUM - Permission system

**Prompt:**
Enhance team member role management with clear permissions and role assignment UI.

**Implementation Details:**
1. Role selection dropdown for each member
2. Clear permission descriptions per role
3. Confirmation for role changes
4. Prevent last owner removal
5. Role change notifications
6. Audit log for role changes

**Acceptance Criteria:**
- [ ] Roles changeable from member list
- [ ] Permission descriptions shown
- [ ] Confirmation required for changes
- [ ] Cannot remove last owner
- [ ] Members notified of role changes
- [ ] Changes logged for audit

---

### UF-3.3 Team Activity Dashboard

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 5-6 hours
**Risk:** LOW - New feature

**Prompt:**
Create a team activity dashboard showing member actions, resource usage, and collaboration metrics.

**Implementation Details:**
1. Team activity feed (recent actions)
2. Member contribution metrics
3. Resource usage per member
4. Collaboration patterns
5. Filter by member, action type, date
6. Export activity report

**Acceptance Criteria:**
- [ ] Activity feed shows recent team actions
- [ ] Member contributions visible
- [ ] Resource usage broken down by member
- [ ] Filters work correctly
- [ ] Can export activity report
- [ ] Only admins/owners can view full activity

---

### UF-3.4 Team Billing Management

**Status:** Partially Implemented
**Priority:** HIGH
**Estimated Effort:** 4-5 hours
**Risk:** MEDIUM - Financial feature

**Prompt:**
Enhance team billing to support seat-based pricing and per-member billing.

**Implementation Details:**
1. Seat count management
2. Add/remove seats with prorating
3. Per-seat pricing display
4. Billing preview before changes
5. Overage handling for seat limits
6. Invoice breakdown by seat

**Acceptance Criteria:**
- [ ] Seat count visible in billing
- [ ] Can add seats with preview
- [ ] Can remove seats with confirmation
- [ ] Proration calculated correctly
- [ ] Overage alerts before limit
- [ ] Invoices show seat breakdown

---

## Phase 4: Profile & Settings

### UF-4.1 Profile Completeness Indicator

**Status:** Not Started
**Priority:** LOW
**Estimated Effort:** 2-3 hours
**Risk:** LOW - UX enhancement

**Prompt:**
Show users how complete their profile is and encourage filling in missing information.

**Implementation Details:**
1. Calculate completeness percentage
2. Show progress bar in settings
3. List missing fields
4. Gamification badges for completion
5. Benefits of complete profile

**Acceptance Criteria:**
- [ ] Completeness percentage calculated
- [ ] Progress bar shown in settings
- [ ] Missing fields listed with links
- [ ] 100% completion badge awarded
- [ ] Benefits explained to user

---

### UF-4.2 Account Data Export

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Compliance

**Prompt:**
Allow users to export all their data for GDPR compliance and portability.

**Implementation Details:**
1. "Export My Data" button in settings
2. Generate comprehensive data package
3. Include all user-created content
4. Exclude sensitive system data
5. Secure download link (expires)
6. Email notification when ready

**Acceptance Criteria:**
- [ ] Export button in settings
- [ ] All user data included
- [ ] Agents, swarms, messages exported
- [ ] Download link expires after 24h
- [ ] Email sent when export ready
- [ ] Processing indicator shown

---

### UF-4.3 Notification Channel Preferences

**Status:** Partially Implemented
**Priority:** MEDIUM
**Estimated Effort:** 3-4 hours
**Risk:** LOW - Enhancement

**Prompt:**
Expand notification preferences to support multiple channels and granular control.

**Implementation Details:**
1. Per-event notification toggles
2. Channel selection (email, in-app, push)
3. Frequency settings (instant, daily digest, weekly)
4. Quiet hours configuration
5. Test notification button
6. Unsubscribe from all option

**Acceptance Criteria:**
- [ ] Each event type toggleable
- [ ] Multiple channels available
- [ ] Frequency options work
- [ ] Quiet hours respected
- [ ] Test notification works
- [ ] Easy unsubscribe all

---

### UF-4.4 API Key Management

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 5-6 hours
**Risk:** MEDIUM - Security feature

**Prompt:**
Allow users to create and manage API keys for programmatic access to the platform.

**Implementation Details:**
1. Create "API Keys" section in settings
2. Generate new API key with name/description
3. Set key permissions/scopes
4. Expiration date optional
5. Revoke keys
6. Usage tracking per key

**Database Schema:**
```sql
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  scopes text[] DEFAULT '{}',
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Acceptance Criteria:**
- [ ] API Keys section in settings
- [ ] Can create new keys with names
- [ ] Key shown only once on creation
- [ ] Scopes selectable on creation
- [ ] Can revoke any key
- [ ] Last used timestamp shown

---

## Phase 5: Billing & Subscription

### UF-5.1 Plan Comparison Page

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 3-4 hours
**Risk:** LOW - Marketing

**Prompt:**
Create a detailed plan comparison page showing all features and limits across plans.

**Implementation Details:**
1. Side-by-side plan comparison table
2. Feature checkmarks per plan
3. Limit values displayed
4. Current plan highlighted
5. Upgrade CTAs per plan
6. FAQ section

**Acceptance Criteria:**
- [ ] All plans shown side-by-side
- [ ] Features clearly compared
- [ ] Limits shown numerically
- [ ] Current plan indicated
- [ ] Upgrade buttons work
- [ ] FAQ answers common questions

---

### UF-5.2 Usage Alerts and Warnings

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 4-5 hours
**Risk:** MEDIUM - UX critical

**Prompt:**
Implement proactive alerts when users approach or exceed their plan limits.

**Implementation Details:**
1. Warning at 80% of limit
2. Critical alert at 95%
3. Block/notify at 100%
4. Email notifications for alerts
5. Dashboard banner for warnings
6. Upgrade prompt in alerts

**Acceptance Criteria:**
- [ ] 80% warning triggers banner
- [ ] 95% critical alert shown
- [ ] Actions blocked at 100% (configurable)
- [ ] Email sent for each threshold
- [ ] Clear upgrade path shown
- [ ] Can dismiss banner (returns at next threshold)

---

### UF-5.3 Invoice Management

**Status:** Partially Implemented
**Priority:** MEDIUM
**Estimated Effort:** 3-4 hours
**Risk:** LOW - Enhancement

**Prompt:**
Enhance invoice management with search, filtering, and detailed line items.

**Implementation Details:**
1. Invoice search by date/amount
2. Status filter (paid, pending, failed)
3. Detailed invoice view modal
4. Line item breakdown
5. Receipt download
6. Invoice dispute option

**Acceptance Criteria:**
- [ ] Can search invoices
- [ ] Filter by status works
- [ ] Detailed view shows all info
- [ ] Line items visible
- [ ] Receipt downloadable
- [ ] Can initiate dispute

---

### UF-5.4 Subscription Pause/Resume

**Status:** Not Started
**Priority:** LOW
**Estimated Effort:** 3-4 hours
**Risk:** MEDIUM - Billing complexity

**Prompt:**
Allow users to temporarily pause their subscription instead of canceling.

**Implementation Details:**
1. Pause option in billing settings
2. Maximum pause duration (3 months)
3. Clear resume process
4. Data retention during pause
5. Auto-resume reminder
6. Pause history tracking

**Acceptance Criteria:**
- [ ] Pause button available
- [ ] Duration selection required
- [ ] Data retained during pause
- [ ] Resume is one-click
- [ ] Reminder sent before auto-resume
- [ ] Pause history visible

---

## Phase 6: Security & Compliance

### UF-6.1 Security Audit Log

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 5-6 hours
**Risk:** MEDIUM - Compliance

**Prompt:**
Create a user-facing security log showing all security-related events on their account.

**Implementation Details:**
1. Security events list (login, password change, 2FA)
2. Device and location info
3. Timestamp for each event
4. Suspicious activity flagging
5. Filter and search
6. Export for review

**Acceptance Criteria:**
- [ ] Security events listed chronologically
- [ ] Device info shown per event
- [ ] Location shown if available
- [ ] Suspicious events highlighted
- [ ] Can filter by event type
- [ ] Export as CSV available

---

### UF-6.2 Privacy Controls

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Compliance

**Prompt:**
Implement privacy controls allowing users to manage data collection and sharing preferences.

**Implementation Details:**
1. Analytics opt-out toggle
2. Data sharing preferences
3. Profile visibility settings
4. Cookie preferences integration
5. Third-party data controls
6. Privacy policy acknowledgment

**Acceptance Criteria:**
- [ ] Analytics can be disabled
- [ ] Data sharing toggles work
- [ ] Profile visibility configurable
- [ ] Cookie preferences accessible
- [ ] Third-party toggles available
- [ ] Privacy policy linked

---

### UF-6.3 Account Recovery Options

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 4-5 hours
**Risk:** MEDIUM - Security

**Prompt:**
Implement backup account recovery options beyond email for users who lose access.

**Implementation Details:**
1. Recovery email (secondary email)
2. Recovery phone number
3. Trusted contacts
4. Security questions (optional, not recommended alone)
5. Recovery code generation
6. Identity verification process

**Acceptance Criteria:**
- [ ] Can add recovery email
- [ ] Can add recovery phone
- [ ] Trusted contacts configurable
- [ ] Recovery codes downloadable
- [ ] Identity verification works
- [ ] Multiple recovery options available

---

## Implementation Priority Order

### Critical Path (Launch Blockers)
1. UF-1.1 - Enable and Enforce Email Verification
2. UF-3.1 - Team Invitation Acceptance Page
3. UF-1.5 - Backup Codes Display and Download
4. UF-5.2 - Usage Alerts and Warnings

### High Priority (Week 1-2)
5. UF-1.3 - Session Management
6. UF-1.4 - Account Lockout Protection
7. UF-3.2 - Team Member Role Management
8. UF-3.4 - Team Billing Management
9. UF-4.4 - API Key Management
10. UF-6.1 - Security Audit Log
11. UF-6.3 - Account Recovery Options

### Medium Priority (Week 3-4)
12. UF-1.2 - Social Authentication
13. UF-2.1 - Guided Product Tour
14. UF-2.2 - Onboarding Templates
15. UF-2.3 - Onboarding Progress Persistence
16. UF-3.3 - Team Activity Dashboard
17. UF-4.2 - Account Data Export
18. UF-4.3 - Notification Channel Preferences
19. UF-5.1 - Plan Comparison Page
20. UF-5.3 - Invoice Management
21. UF-6.2 - Privacy Controls

### Lower Priority (Post-Launch)
22. UF-2.4 - Skip Onboarding for Experienced Users
23. UF-4.1 - Profile Completeness Indicator
24. UF-5.4 - Subscription Pause/Resume

---

## Success Metrics

1. **Signup Completion**: >80% of signups complete email verification
2. **Onboarding Completion**: >70% complete full onboarding flow
3. **Team Adoption**: >40% of paid users join or create teams
4. **Security Adoption**: >30% of users enable 2FA
5. **Retention**: >85% monthly retention for verified users
6. **Support Tickets**: <5% of users need auth-related support
