# Template Agents - Comprehensive Todo List

> **Execution Order:** 1 of 6
> **Status Overview**: Core infrastructure exists with working database schema, UI pages, and hooks. Focus needed on publishing workflow, marketplace integration, versioning, and advanced features.

---

## Current State Summary

### Working Components
- Database schema with `default_agents` table (enhanced with categories, tags, icons)
- 10 pre-configured agent templates seeded
- User-facing templates page (`/agents/templates`) with search, filter, preview, clone
- Admin templates management (`/admin/templates`) with full CRUD
- `useDefaultAgents` hook with comprehensive template operations
- Marketplace database schema (separate system)

### Key Gaps
- No publishing workflow from user agents to marketplace
- No template versioning or update management
- Missing team collaboration features
- No template analytics dashboard
- Limited marketplace integration

---

## Phase 1: Publishing & Distribution

### TA-1.1 Agent Publishing to Marketplace

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 8-10 hours
**Risk:** MEDIUM - Core feature for creator economy

**Prompt:**
Add the ability for users to publish their agents to the marketplace directly from the agents management page. This creates a seamless flow from agent creation to distribution.

**Implementation Details:**
1. Add "Publish to Marketplace" button on agent cards and detail view
2. Create publish dialog with:
   - Title and slug customization
   - Description and short description fields
   - Category selection (from marketplace_categories)
   - Tags input
   - Pricing model selection (free, one-time, subscription)
   - Price input for paid options
   - Preview of how it will appear
3. Validate agent has required fields before publishing
4. Create marketplace_agents entry linked to source agent
5. Handle duplicate slug detection

**Files to Modify:**
- `app/agents/page.tsx` - Add publish button
- `hooks/use-marketplace.ts` - Add publishAgent function
- Create `components/agents/publish-agent-dialog.tsx`

**Acceptance Criteria:**
- [X] "Publish" button appears on user's agent cards
- [X] Publish dialog opens with all required fields
- [X] Can select pricing model (free, one-time $1-999, subscription $1-99/mo)
- [X] Validation prevents publishing incomplete agents
- [X] Successfully creates marketplace listing
- [X] Published agents show "Published" badge in agents list
- [X] Can update published listing from agents page
- [X] Can unpublish/remove from marketplace

---

### TA-1.2 Template Version Management

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 6-8 hours
**Risk:** MEDIUM - Important for template maintenance

**Prompt:**
Implement version tracking for templates so admins can update templates while users retain their original cloned versions, with optional upgrade paths.

**Implementation Details:**
1. Add version columns to default_agents table:
   - `version` (semver string)
   - `changelog` (text)
   - `previous_version_id` (uuid, nullable)
2. Track template_id and template_version on cloned agents
3. Create version history view in admin
4. Add "Check for Updates" in user's agent settings
5. Implement upgrade mechanism that merges changes

**Database Migration:**
```sql
ALTER TABLE default_agents ADD COLUMN IF NOT EXISTS version text DEFAULT '1.0.0';
ALTER TABLE default_agents ADD COLUMN IF NOT EXISTS changelog text DEFAULT '';
ALTER TABLE default_agents ADD COLUMN IF NOT EXISTS previous_version_id uuid REFERENCES default_agents(id);

ALTER TABLE agents ADD COLUMN IF NOT EXISTS source_template_id uuid REFERENCES default_agents(id);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS source_template_version text;
```

**Acceptance Criteria:**
- [X] Templates display version number
- [X] Version history accessible in admin panel
- [X] Changelog field for documenting changes
- [X] Cloned agents track source template and version
- [X] Users can see if newer version available
- [X] Upgrade preserves user customizations where possible
- [X] Rollback to previous version available for admins

---

### TA-1.3 Bulk Template Deployment

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-6 hours
**Risk:** LOW - Enhancement feature

**Prompt:**
Allow admins and team owners to deploy templates to multiple swarms or agents simultaneously, useful for standardizing agent configurations across an organization.

**Implementation Details:**
1. Add "Deploy to Multiple" option in template preview
2. Create swarm/agent selection interface
3. Show preview of changes before deployment
4. Execute batch creation with progress indicator
5. Generate deployment report

**Acceptance Criteria:**
- [X] Can select multiple target swarms from template view
- [X] Preview shows what will be created
- [X] Progress indicator during bulk deployment
- [X] Success/failure report after completion
- [X] Deployed agents linked to source template
- [X] Can deploy to all swarms in a team

---

## Phase 2: Marketplace Integration

### TA-2.1 Connect Templates to Marketplace

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 6-8 hours
**Risk:** MEDIUM - Unifies two separate systems

**Prompt:**
Bridge the gap between the internal template system (default_agents) and the public marketplace (marketplace_agents) to create a unified template distribution experience.

**Implementation Details:**
1. Add "Promote to Marketplace" for admin templates
2. Sync template updates to marketplace listings
3. Show marketplace stats on template cards
4. Link marketplace purchases back to templates
5. Handle free templates vs paid marketplace agents

**Acceptance Criteria:**
- [X] Admin templates can be promoted to marketplace
- [X] Marketplace listings sync with template updates
- [X] Template cards show install count from marketplace
- [X] Users can install from either templates page or marketplace
- [X] Clear distinction between free templates and paid agents
- [X] Revenue tracking for paid template-based agents

---

### TA-2.2 Template Ratings & Reviews UI

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Database exists, need UI

**Prompt:**
Add user rating and review functionality to template pages, leveraging the existing marketplace_reviews table structure.

**Implementation Details:**
1. Add rating display to template cards (stars + count)
2. Create review submission dialog
3. Show reviews list on template detail/preview
4. Calculate and cache average ratings
5. Add "Most Popular" and "Highest Rated" sort options

**Acceptance Criteria:**
- [X] Star rating (1-5) visible on template cards
- [X] Review count displayed
- [X] Users can submit rating + text review after using template
- [X] Reviews visible in template preview dialog
- [X] Sort templates by rating or popularity
- [X] One review per user per template (can update)
- [X] Admin can moderate/remove reviews

---

### TA-2.3 Featured Templates Management

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 3-4 hours
**Risk:** LOW - Enhancement feature

**Prompt:**
Allow admins to feature specific templates for prominent display on the templates page and dashboard.

**Implementation Details:**
1. Add `is_featured` and `featured_until` columns to default_agents
2. Create featured section at top of templates page
3. Admin UI to manage featured templates
4. Automatic expiration of featured status
5. Featured badge on template cards

**Acceptance Criteria:**
- [X] Featured templates section on templates page
- [X] Admin can mark templates as featured
- [X] Optional expiration date for featured status
- [X] Maximum featured templates limit (e.g., 6)
- [X] Featured badge visible on cards
- [X] Auto-expire featured status when date passes

---

## Phase 3: Team Collaboration

### TA-3.1 Team Template Sharing

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 6-8 hours
**Risk:** MEDIUM - Requires team permission integration

**Prompt:**
Enable teams to create and share private templates among team members, separate from the public template library.

**Implementation Details:**
1. Create `team_templates` table linked to organizations
2. Add "Share with Team" option when creating agents
3. Team templates appear in templates page for members
4. Permission levels: view, use (clone), edit
5. Team-specific categories and tags

**Database Schema:**
```sql
CREATE TABLE team_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  role text,
  framework text,
  model_id uuid REFERENCES ai_models(id),
  system_prompt text,
  description text,
  tags text[] DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Acceptance Criteria:**
- [X] Teams can create private templates
- [X] Team templates visible only to team members
- [X] Can clone team templates to personal agents
- [X] Team admin can manage team templates
- [X] Clear visual distinction from public templates
- [X] Search/filter includes team templates for members

---

### TA-3.2 Template Approval Workflow

**Status:** Not Started
**Priority:** LOW
**Estimated Effort:** 5-6 hours
**Risk:** LOW - Enterprise feature

**Prompt:**
Implement an approval workflow for templates, allowing team admins to review and approve templates before they become available to team members or the public.

**Implementation Details:**
1. Add status field: draft, pending_review, approved, rejected
2. Create review queue in admin panel
3. Reviewer can approve, reject with feedback, or request changes
4. Email notifications for status changes
5. Audit log of approval actions

**Acceptance Criteria:**
- [X] Templates start in "draft" status
- [X] "Submit for Review" action available
- [X] Admin review queue shows pending templates
- [X] Approve/reject with optional feedback
- [X] Creator notified of status changes
- [X] Only approved templates visible to users
- [X] Approval history maintained

---

## Phase 4: Advanced Features

### TA-4.1 Template Parameterization

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 8-10 hours
**Risk:** MEDIUM - Complex feature

**Prompt:**
Allow templates to define customizable parameters that users fill in when cloning, enabling more flexible and reusable templates.

**Implementation Details:**
1. Define parameter schema in template settings
2. Parameter types: text, number, select, boolean, textarea
3. Create parameter form in clone dialog
4. Variable substitution in system prompt (e.g., {{company_name}})
5. Default values and validation rules

**Parameter Schema Example:**
```json
{
  "parameters": [
    {
      "key": "company_name",
      "label": "Company Name",
      "type": "text",
      "required": true,
      "placeholder": "Enter your company name"
    },
    {
      "key": "tone",
      "label": "Communication Tone",
      "type": "select",
      "options": ["formal", "casual", "friendly"],
      "default": "professional"
    }
  ]
}
```

**Acceptance Criteria:**
- [ ] Templates can define parameters in settings
- [ ] Parameter form appears when cloning
- [ ] Required parameters must be filled
- [ ] Variables substituted in system prompt
- [ ] Preview shows result of substitution
- [ ] Parameter values saved with cloned agent
- [ ] Can re-customize parameters after cloning

---

### TA-4.2 Template Composition

**Status:** Not Started
**Priority:** LOW
**Estimated Effort:** 6-8 hours
**Risk:** HIGH - Complex architecture change

**Prompt:**
Enable templates to inherit from or compose other templates, allowing creation of specialized templates that build on base templates.

**Implementation Details:**
1. Add `parent_template_id` to default_agents
2. Inheritance: child inherits parent's system prompt, settings
3. Composition: combine multiple templates' capabilities
4. Override mechanism for customization
5. Dependency resolution and circular reference prevention

**Acceptance Criteria:**
- [ ] Templates can specify a parent template
- [ ] Child inherits parent's base configuration
- [ ] Can override specific fields in child
- [ ] Composition combines prompts intelligently
- [ ] UI shows template hierarchy
- [ ] Circular dependencies prevented
- [ ] Parent updates optionally propagate to children

---

### TA-4.3 Template Testing Sandbox

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 5-6 hours
**Risk:** LOW - Isolated feature

**Prompt:**
Provide a sandbox environment where admins and creators can test templates before publishing, ensuring quality and correct behavior.

**Implementation Details:**
1. Add "Test" button in template admin and publish dialog
2. Open chat interface with template-configured agent
3. Test messages don't count against usage
4. Log test conversations for review
5. Side-by-side comparison with previous version

**Acceptance Criteria:**
- [ ] "Test Template" button in admin panel
- [ ] Opens chat interface with template agent
- [ ] Test usage separated from production metrics
- [ ] Can test with different parameter values
- [ ] Compare responses between versions
- [ ] Test logs accessible for debugging

---

## Phase 5: Analytics & Insights

### TA-5.1 Template Analytics Dashboard

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 6-8 hours
**Risk:** LOW - Data exists, need visualization

**Prompt:**
Create a dedicated analytics dashboard for templates showing usage metrics, adoption rates, and user feedback to help admins optimize the template library.

**Implementation Details:**
1. Create `/admin/templates/analytics` page
2. Metrics to track:
   - Clone count per template
   - Active agents using each template
   - User retention (agents still active after 30 days)
   - Rating trends over time
   - Category performance comparison
3. Time range filters (7d, 30d, 90d, all)
4. Export analytics data

**Acceptance Criteria:**
- [ ] Analytics page accessible from admin templates
- [ ] Total clones per template with trend
- [ ] Active usage count (agents in use)
- [ ] Retention rate calculation
- [ ] Rating average and distribution
- [ ] Category-level aggregations
- [ ] Date range filtering
- [ ] Export to CSV

---

### TA-5.2 Template Modification Tracking

**Status:** Not Started
**Priority:** LOW
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Enhancement feature

**Prompt:**
Track how users customize templates after cloning to understand which parts are modified most frequently, informing template improvements.

**Implementation Details:**
1. Store original template values in cloned agent metadata
2. Detect and log modifications to cloned agents
3. Aggregate modification patterns
4. Surface insights in template analytics
5. Suggest template improvements based on patterns

**Acceptance Criteria:**
- [ ] Track field-level changes from template baseline
- [ ] Aggregate most-modified fields per template
- [ ] Show modification rate in analytics
- [ ] Identify common customization patterns
- [ ] Suggest template parameter candidates

---

## Phase 6: Documentation & Quality

### TA-6.1 Template Creation Guide

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 3-4 hours
**Risk:** LOW - Documentation only

**Prompt:**
Create comprehensive documentation for template creation, covering best practices, system prompt guidelines, and examples.

**Documentation Sections:**
1. Template anatomy (fields, purpose, examples)
2. System prompt best practices
3. Category and tag guidelines
4. Icon selection guide
5. Parameter design patterns
6. Testing recommendations
7. Publishing checklist

**Acceptance Criteria:**
- [ ] Documentation page in `/docs` section
- [ ] Covers all template fields
- [ ] System prompt examples and anti-patterns
- [ ] Category selection guidance
- [ ] Screenshots and visual aids
- [ ] Linked from admin templates page

---

### TA-6.2 Sample Template Packs

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Content creation

**Prompt:**
Create curated template packs for specific industries and use cases to accelerate user adoption and demonstrate platform capabilities.

**Template Packs to Create:**
1. **Startup Pack**: Product manager, developer, marketer, support
2. **E-commerce Pack**: Customer service, product recommender, order tracker
3. **Healthcare Pack**: Patient intake, appointment scheduler, FAQ bot
4. **Education Pack**: Tutor, course creator, student assistant
5. **Legal Pack**: Contract reviewer, legal researcher, compliance checker

**Acceptance Criteria:**
- [ ] 5+ template packs with 3-5 templates each
- [ ] Each template has complete system prompt
- [ ] Appropriate category and tags assigned
- [ ] Templates tested for quality
- [ ] Pack descriptions explain use cases
- [ ] Visible as collections in templates UI

---

### TA-6.3 Template Quality Validation

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Automated validation

**Prompt:**
Implement automated validation for templates to ensure quality standards before publishing, checking for required fields, prompt quality indicators, and best practices.

**Validation Rules:**
1. Required fields present (name, role, system_prompt)
2. System prompt minimum length (100 chars)
3. System prompt doesn't contain placeholders
4. Description provided
5. At least one tag assigned
6. Category selected
7. No profanity or prohibited content
8. Icon selected

**Acceptance Criteria:**
- [ ] Validation runs before template save
- [ ] Clear error messages for failures
- [ ] Warning for recommended improvements
- [ ] Quality score displayed (0-100)
- [ ] Cannot publish templates below threshold
- [ ] Validation rules configurable by admin

---

## Phase 7: Security & Governance

### TA-7.1 Template Content Moderation

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 5-6 hours
**Risk:** MEDIUM - Required for public marketplace

**Prompt:**
Implement content moderation for user-submitted templates and marketplace agents to prevent inappropriate or harmful content.

**Implementation Details:**
1. Automated screening for prohibited terms
2. Manual review queue for flagged content
3. User reporting mechanism
4. Strike system for repeat violations
5. Appeal process for rejected templates

**Acceptance Criteria:**
- [ ] Automated scan on template submission
- [ ] Flagged templates enter review queue
- [ ] Users can report inappropriate templates
- [ ] Admin moderation interface
- [ ] Strike tracking per user
- [ ] Ban capability for violations
- [ ] Appeal submission and review

---

### TA-7.2 Template Audit Logging

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 3-4 hours
**Risk:** LOW - Compliance feature

**Prompt:**
Log all template-related actions for audit and compliance purposes, tracking who created, modified, published, or deleted templates.

**Actions to Log:**
- Template created
- Template updated (with diff)
- Template published to marketplace
- Template unpublished
- Template deleted
- Template cloned by user
- Template featured/unfeatured
- Review submitted/moderated

**Acceptance Criteria:**
- [ ] All template actions logged
- [ ] Actor (user/admin) recorded
- [ ] Timestamp and IP recorded
- [ ] Change diff stored for updates
- [ ] Audit log searchable by admin
- [ ] Export audit log
- [ ] Retention policy applied

---

### TA-7.3 Template Licensing

**Status:** Not Started
**Priority:** LOW
**Estimated Effort:** 3-4 hours
**Risk:** LOW - Legal compliance

**Prompt:**
Add licensing options for templates to clarify usage rights, especially for marketplace templates that may have commercial restrictions.

**License Options:**
1. Open/Free - No restrictions
2. Attribution - Credit required
3. Non-commercial - Personal use only
4. Commercial - Business use allowed
5. Custom - Creator-defined terms

**Acceptance Criteria:**
- [ ] License field on templates
- [ ] License displayed on template cards
- [ ] License terms shown before cloning
- [ ] User acknowledges license on clone
- [ ] License preserved in cloned agents
- [ ] Filter templates by license type

---

## Implementation Priority Order

### Critical Path (Launch Blockers)
1. TA-1.1 - Agent Publishing to Marketplace
2. TA-6.1 - Template Creation Guide
3. TA-7.1 - Template Content Moderation

### High Priority (Week 1-2)
4. TA-1.2 - Template Version Management
5. TA-2.1 - Connect Templates to Marketplace
6. TA-5.1 - Template Analytics Dashboard

### Medium Priority (Week 3-4)
7. TA-2.2 - Template Ratings & Reviews UI
8. TA-1.3 - Bulk Template Deployment
9. TA-3.1 - Team Template Sharing
10. TA-4.1 - Template Parameterization

### Lower Priority (Post-Launch)
11. TA-2.3 - Featured Templates Management
12. TA-4.3 - Template Testing Sandbox
13. TA-6.2 - Sample Template Packs
14. TA-6.3 - Template Quality Validation
15. TA-3.2 - Template Approval Workflow
16. TA-4.2 - Template Composition
17. TA-5.2 - Template Modification Tracking
18. TA-7.2 - Template Audit Logging
19. TA-7.3 - Template Licensing

---

## Database Tables Reference

### Existing Tables
- `default_agents` - System templates
- `agents` - User agents (clone targets)
- `marketplace_agents` - Published marketplace agents
- `marketplace_categories` - Agent categories
- `marketplace_reviews` - User reviews
- `marketplace_purchases` - Purchase records

### Tables to Create
- `team_templates` - Team-specific templates
- `template_audit_log` - Action audit trail
- `template_reports` - User reports for moderation

---

## Success Metrics

1. **Adoption**: 50%+ of new agents created from templates
2. **Quality**: Average template rating > 4.0 stars
3. **Retention**: 70%+ of cloned agents still active after 30 days
4. **Marketplace**: 100+ published templates within 3 months
5. **Revenue**: Template-based marketplace revenue growth 20% MoM
