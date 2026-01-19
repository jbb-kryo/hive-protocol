# Template Tools - Comprehensive Todo List

> **Execution Order:** 2 of 6
> **Status Overview**: Comprehensive tool infrastructure exists with database schema, UI components, and hooks. Critical gaps in real tool execution, sandbox isolation, and marketplace integration.

---

## Current State Summary

### Working Components
- Database schema with `tools`, `user_tools`, `agent_tools`, `swarm_tools`, `tool_usage`, `tool_versions` tables
- 8 pre-configured built-in tools (Web Search, Browser, Code Executor, File Ops, Database, Email, Calendar, Image Gen)
- Tool management page (`/tools`) with tabs, search, and filtering
- Complete dialog components: Generate, Test, Config, Edit, Delete
- `useTools` hook with comprehensive operations
- Tool versioning and history
- `execute-tool` and `generate-tool` edge functions deployed

### Key Gaps
- Only Web Search tool actually executes (others are stubs)
- No sandbox/isolation for custom code execution
- Missing tool marketplace UI
- No real-time tool execution in agent conversations
- Limited execution analytics

---

## Phase 1: Core Tool Execution

### TT-1.1 Implement Built-in Tool Execution

**Status:** Not Started
**Priority:** CRITICAL
**Estimated Effort:** 12-16 hours
**Risk:** HIGH - Core functionality

**Prompt:**
Implement actual execution logic for all 8 built-in tools. Currently only Web Search works via DuckDuckGo API. Each tool needs real integration with appropriate services or sandbox execution.

**Implementation Details:**
1. **Web Browser** - Headless browser via Puppeteer/Playwright API
2. **Code Executor** - Secure code execution sandbox (Deno isolate or external service)
3. **File Operations** - Scoped file system access (user-specific storage)
4. **Database Query** - Secure database proxy with query validation
5. **Email Sender** - SMTP/SendGrid/Resend integration
6. **Calendar Manager** - Google Calendar/Outlook API integration
7. **Image Generator** - DALL-E/Stable Diffusion API integration

**Files to Modify:**
- `supabase/functions/execute-tool/index.ts` - Add execution handlers
- Create service-specific modules for each tool type

**Acceptance Criteria:**
- [ ] Web Browser can navigate and extract content
- [ ] Code Executor runs Python/JavaScript safely
- [ ] File Operations work within user storage limits
- [ ] Database Query validates and executes SQL safely
- [ ] Email Sender delivers emails successfully
- [ ] Calendar Manager creates/reads events
- [ ] Image Generator returns generated images
- [ ] All tools have proper error handling
- [ ] Execution time tracked for all tools
- [ ] Rate limiting applied per tool type

---

### TT-1.2 Custom Tool Sandbox Execution

**Status:** Not Started
**Priority:** CRITICAL
**Estimated Effort:** 10-12 hours
**Risk:** HIGH - Security critical

**Prompt:**
Create a secure sandbox environment for executing user-defined custom tools. Custom tools can contain arbitrary code that must be isolated from the main system.

**Implementation Details:**
1. Use Deno isolate for TypeScript/JavaScript execution
2. Implement resource limits (CPU, memory, time)
3. Network access restrictions (allowlist only)
4. File system isolation (no access to host)
5. Secure secret injection for API keys
6. Output sanitization before returning results

**Security Requirements:**
- 30-second maximum execution time
- 128MB memory limit
- No file system access outside /tmp
- Network requests only to whitelisted domains
- No access to environment variables directly
- Secrets injected at runtime, not stored in code

**Acceptance Criteria:**
- [ ] Custom tools execute in isolated environment
- [ ] Resource limits enforced (CPU, memory, time)
- [ ] Network access controlled via allowlist
- [ ] Malicious code patterns detected and blocked
- [ ] Execution logs captured for debugging
- [ ] Secrets securely injected at runtime
- [ ] Graceful timeout handling
- [ ] Error messages don't leak system info

---

### TT-1.3 Tool Execution in Agent Conversations

**Status:** Not Started
**Priority:** CRITICAL
**Estimated Effort:** 8-10 hours
**Risk:** HIGH - Core user experience

**Prompt:**
Integrate tool execution into the agent response flow so agents can actually use tools during conversations. Currently tool execution indicator exists but isn't connected to real execution.

**Implementation Details:**
1. Detect tool calls in agent responses (function calling format)
2. Execute tool via `execute-tool` edge function
3. Return results to agent for continued processing
4. Display execution status in real-time
5. Handle multi-tool sequences
6. Manage execution context and state

**Files to Modify:**
- `supabase/functions/agent-respond/index.ts` - Add tool calling loop
- `components/swarm/tool-execution-indicator.tsx` - Connect to real data
- `hooks/use-swarm-realtime.ts` - Add tool execution events

**Acceptance Criteria:**
- [ ] Agents can request tool execution during responses
- [ ] Tool execution happens automatically when requested
- [ ] Results returned to agent for continuation
- [ ] Execution status visible in chat UI
- [ ] Multiple tool calls in single response supported
- [ ] Failed tool executions handled gracefully
- [ ] Tool execution logged to tool_usage table
- [ ] Rate limiting applied to tool calls

---

### TT-1.4 Tool Execution Retry and Recovery

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 4-6 hours
**Risk:** MEDIUM - Reliability

**Prompt:**
Implement retry logic and error recovery for tool execution to handle transient failures and improve reliability.

**Implementation Details:**
1. Configurable retry count per tool (default: 3)
2. Exponential backoff between retries
3. Different retry strategies per error type
4. Circuit breaker for repeatedly failing tools
5. Fallback responses for critical failures
6. User notification on persistent failures

**Acceptance Criteria:**
- [ ] Transient failures automatically retried
- [ ] Exponential backoff prevents hammering
- [ ] Circuit breaker disables failing tools temporarily
- [ ] Users notified when retries exhausted
- [ ] Retry attempts logged for debugging
- [ ] Different strategies for timeout vs error
- [ ] Manual retry option for users

---

## Phase 2: Tool Management Enhancements

### TT-2.1 Tool Marketplace UI

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 8-10 hours
**Risk:** MEDIUM - New feature area

**Prompt:**
Create a marketplace interface for discovering, sharing, and installing community-created tools. Leverage existing marketplace schema.

**Implementation Details:**
1. Add Tools tab to marketplace page
2. Tool cards with name, description, category, rating
3. Install/uninstall tools to user account
4. Tool detail modal with documentation
5. Creator profiles and attribution
6. Pricing support (free, paid)

**Files to Create:**
- Extend `app/marketplace/page.tsx` with tools section
- Create `components/marketplace/tool-card.tsx`
- Create `components/marketplace/tool-detail-modal.tsx`

**Acceptance Criteria:**
- [ ] Tools visible in marketplace
- [ ] Search and filter tools
- [ ] Install tools to user account
- [ ] View tool documentation and examples
- [ ] See tool ratings and install count
- [ ] Creator attribution displayed
- [ ] Plan-gated access for premium tools

---

### TT-2.2 Tool Publishing Workflow

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 6-8 hours
**Risk:** MEDIUM - Requires moderation

**Prompt:**
Allow users to publish their custom tools to the marketplace with proper review and approval process.

**Implementation Details:**
1. "Publish to Marketplace" button in tool editor
2. Submission form with description, category, pricing
3. Automated security scan before submission
4. Admin review queue for new tools
5. Approval/rejection with feedback
6. Update published tools with versioning

**Acceptance Criteria:**
- [ ] Custom tools can be submitted to marketplace
- [ ] Security scan runs automatically
- [ ] Admin can review pending tools
- [ ] Approve/reject with feedback to creator
- [ ] Published tools visible in marketplace
- [ ] Can update published tools
- [ ] Version history maintained

---

### TT-2.3 Tool Categories and Discovery

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Enhancement

**Prompt:**
Enhance tool discovery with better categorization, tags, and recommendation system.

**Implementation Details:**
1. Expand tool categories beyond current 8
2. Add tag-based filtering
3. "Similar tools" recommendations
4. "Popular in your industry" section
5. Recently used tools quick access
6. Tool collections/bundles

**Acceptance Criteria:**
- [ ] 15+ tool categories available
- [ ] Tags filterable on tools page
- [ ] Similar tools shown on tool detail
- [ ] Popular tools section on dashboard
- [ ] Recent tools accessible quickly
- [ ] Tool collections can be created

---

### TT-2.4 Tool Import/Export

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 3-4 hours
**Risk:** LOW - Utility feature

**Prompt:**
Enable importing and exporting tools as JSON files for backup, sharing, and migration purposes.

**Implementation Details:**
1. Export tool definition as JSON
2. Include configuration schema
3. Import tool from JSON file
4. Validate import format
5. Handle version conflicts
6. Bulk import/export

**Acceptance Criteria:**
- [ ] Export single tool as JSON
- [ ] Export all custom tools as ZIP
- [ ] Import tool from JSON file
- [ ] Validation prevents invalid imports
- [ ] Conflict resolution for duplicates
- [ ] Bulk import multiple tools

---

## Phase 3: Tool Configuration & Testing

### TT-3.1 Enhanced Tool Testing Interface

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 5-6 hours
**Risk:** LOW - Improves existing feature

**Prompt:**
Improve the tool testing dialog with real execution, better input handling, and comprehensive result display.

**Implementation Details:**
1. Connect test dialog to real `execute-tool` function
2. Dynamic input form based on input_schema
3. Execution progress indicator
4. Formatted result display (JSON, tables, images)
5. Execution time and resource usage display
6. Test history with comparison

**Files to Modify:**
- `components/tools/test-tool-dialog.tsx` - Connect to real execution

**Acceptance Criteria:**
- [ ] Test executes tool in real environment
- [ ] Input form matches tool's input schema
- [ ] Progress shown during execution
- [ ] Results formatted appropriately by type
- [ ] Execution metrics displayed
- [ ] Test history saved for reference
- [ ] Can compare test results across versions

---

### TT-3.2 Tool Configuration Templates

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Enhancement

**Prompt:**
Provide configuration templates for common tool setups to help users configure tools faster.

**Implementation Details:**
1. Pre-defined config templates per tool
2. "Quick Setup" option in config dialog
3. Template selection with preview
4. Apply template and customize
5. Save custom configs as templates
6. Share templates with team

**Acceptance Criteria:**
- [ ] Built-in tools have config templates
- [ ] Quick setup shows template options
- [ ] Preview shows what template configures
- [ ] Templates can be customized after apply
- [ ] Users can save own templates
- [ ] Templates shareable with team

---

### TT-3.3 Tool Dependency Management

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 5-6 hours
**Risk:** MEDIUM - Complex feature

**Prompt:**
Allow tools to declare and manage dependencies on other tools or external packages.

**Implementation Details:**
1. Dependency declaration in tool schema
2. Automatic dependency resolution
3. Version compatibility checking
4. Dependency installation on tool install
5. Update notifications for dependencies
6. Conflict detection and resolution

**Acceptance Criteria:**
- [ ] Tools can declare dependencies
- [ ] Dependencies auto-installed with tool
- [ ] Version compatibility validated
- [ ] Conflicts detected before install
- [ ] Update prompts for outdated deps
- [ ] Dependency graph visible in UI

---

## Phase 4: Tool Analytics & Monitoring

### TT-4.1 Tool Usage Analytics Dashboard

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 6-8 hours
**Risk:** LOW - Data exists

**Prompt:**
Create analytics dashboard showing tool usage patterns, performance metrics, and error rates.

**Implementation Details:**
1. Create `/dashboard/tools-analytics` page
2. Metrics to display:
   - Executions per tool (total, daily, weekly)
   - Success/failure rates
   - Average execution time
   - Most used tools by user
   - Error distribution by type
3. Time range filtering
4. Export capabilities

**Acceptance Criteria:**
- [ ] Analytics page accessible from dashboard
- [ ] Execution counts displayed per tool
- [ ] Success rate calculated and shown
- [ ] Execution time trends visible
- [ ] Error breakdown by type
- [ ] Date range filtering works
- [ ] Export to CSV available

---

### TT-4.2 Tool Performance Monitoring

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Operational

**Prompt:**
Implement real-time monitoring for tool performance to detect issues and optimize execution.

**Implementation Details:**
1. Track execution latency percentiles (p50, p95, p99)
2. Memory usage per execution
3. Timeout rate tracking
4. Alert thresholds configuration
5. Performance degradation detection
6. Automatic scaling recommendations

**Acceptance Criteria:**
- [ ] Latency percentiles calculated
- [ ] Memory usage tracked
- [ ] Timeout rate visible
- [ ] Alerts fire on threshold breach
- [ ] Degradation detected automatically
- [ ] Recommendations shown for slow tools

---

### TT-4.3 Tool Error Tracking

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Debugging support

**Prompt:**
Implement detailed error tracking for tool executions to help users and admins debug issues.

**Implementation Details:**
1. Capture full error stack traces
2. Error categorization (timeout, auth, validation, runtime)
3. Error search and filtering
4. Error aggregation by type/tool
5. Error resolution suggestions
6. Link errors to specific executions

**Acceptance Criteria:**
- [ ] Stack traces captured on error
- [ ] Errors categorized by type
- [ ] Search errors by tool/user/time
- [ ] Aggregate view shows patterns
- [ ] Suggestions shown for common errors
- [ ] Can trace error to specific execution

---

## Phase 5: Advanced Tool Features

### TT-5.1 Tool Chaining and Workflows

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 8-10 hours
**Risk:** MEDIUM - Complex feature

**Prompt:**
Enable tools to be chained together where output of one tool feeds into input of another, creating simple workflows.

**Implementation Details:**
1. Chain builder UI in tool config
2. Output-to-input mapping
3. Conditional branching based on results
4. Chain execution orchestration
5. Progress tracking across chain
6. Error handling and chain abort

**Acceptance Criteria:**
- [ ] Can create tool chain in UI
- [ ] Map outputs to inputs visually
- [ ] Conditional logic supported
- [ ] Chain executes tools in sequence
- [ ] Progress shown for each step
- [ ] Errors stop chain with clear message
- [ ] Chain results aggregated

---

### TT-5.2 Async and Long-Running Tools

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 6-8 hours
**Risk:** MEDIUM - Architecture change

**Prompt:**
Support tools that run longer than the standard timeout, with background execution and result retrieval.

**Implementation Details:**
1. Mark tools as "async" capable
2. Return job ID immediately on execution
3. Background worker processes job
4. Webhook/polling for result retrieval
5. Job status tracking (queued, running, complete, failed)
6. Result storage and expiration

**Database Schema:**
```sql
CREATE TABLE tool_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'queued',
  input_params jsonb NOT NULL,
  result jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Acceptance Criteria:**
- [ ] Tools can be marked as async
- [ ] Job ID returned immediately
- [ ] Background processing works
- [ ] Status updates available
- [ ] Results retrievable when complete
- [ ] Expired results cleaned up
- [ ] Webhook notification on completion

---

### TT-5.3 Tool Versioning and Rollback

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Enhancement

**Prompt:**
Enhance existing tool versioning with better UI for version management and rollback capabilities.

**Implementation Details:**
1. Version list with diff view
2. One-click rollback to previous version
3. Version comparison side-by-side
4. Changelog entry per version
5. Version pinning for stability
6. Auto-archive old versions

**Acceptance Criteria:**
- [ ] All versions listed with dates
- [ ] Diff view shows changes
- [ ] Rollback restores previous version
- [ ] Side-by-side comparison available
- [ ] Changelog editable per version
- [ ] Can pin specific version
- [ ] Old versions auto-archived

---

## Phase 6: Security & Compliance

### TT-6.1 Tool Security Scanning

**Status:** Not Started
**Priority:** CRITICAL
**Estimated Effort:** 6-8 hours
**Risk:** HIGH - Security critical

**Prompt:**
Implement comprehensive security scanning for custom tool code before saving and execution.

**Implementation Details:**
1. Static analysis for dangerous patterns
2. Dependency vulnerability scanning
3. Network request analysis
4. Data exfiltration detection
5. Resource abuse detection
6. Security score calculation

**Security Patterns to Detect:**
- eval(), Function(), new Function()
- child_process, execSync, spawn
- fs operations outside sandbox
- Hardcoded credentials
- Infinite loops
- Crypto mining patterns
- Data exfiltration attempts

**Acceptance Criteria:**
- [ ] Static analysis runs on save
- [ ] Dangerous patterns blocked
- [ ] Dependencies scanned for CVEs
- [ ] Network requests validated
- [ ] Data exfil patterns detected
- [ ] Security score shown to user
- [ ] Detailed report on issues

---

### TT-6.2 Tool Access Control

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 5-6 hours
**Risk:** MEDIUM - Security

**Prompt:**
Implement granular access control for tools based on user roles, teams, and plans.

**Implementation Details:**
1. Tool visibility levels (public, team, private)
2. Role-based tool access (admin, developer, user)
3. Plan-gated tool features
4. Team-specific tool libraries
5. Tool usage quotas per role
6. Audit logging for tool access

**Acceptance Criteria:**
- [ ] Tools can be public/team/private
- [ ] Roles restrict tool access
- [ ] Plan gates premium tools
- [ ] Teams have shared tool libraries
- [ ] Quotas enforced per role
- [ ] All access logged for audit

---

### TT-6.3 Tool Execution Audit Log

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 3-4 hours
**Risk:** LOW - Compliance

**Prompt:**
Create comprehensive audit logging for all tool executions for compliance and debugging.

**Implementation Details:**
1. Log all execution attempts
2. Record input parameters (sanitized)
3. Record output results (truncated)
4. Track execution context (user, agent, swarm)
5. Retention policy configuration
6. Export audit logs

**Acceptance Criteria:**
- [ ] All executions logged
- [ ] Inputs sanitized before logging
- [ ] Outputs truncated to size limit
- [ ] Context fully recorded
- [ ] Retention policy applied
- [ ] Logs exportable for compliance

---

## Phase 7: Documentation & Onboarding

### TT-7.1 Tool Development Guide

**Status:** Not Started
**Priority:** HIGH
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Documentation

**Prompt:**
Create comprehensive documentation for developing custom tools, including best practices and examples.

**Documentation Sections:**
1. Tool anatomy (structure, schema, code)
2. Input/output schema design
3. Error handling best practices
4. Security guidelines
5. Performance optimization
6. Testing strategies
7. Publishing checklist

**Acceptance Criteria:**
- [ ] Documentation in docs section
- [ ] Covers all tool components
- [ ] Schema examples provided
- [ ] Security section comprehensive
- [ ] Performance tips included
- [ ] Step-by-step tutorials

---

### TT-7.2 Tool Templates and Starters

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Effort:** 4-5 hours
**Risk:** LOW - Content

**Prompt:**
Provide starter templates for common tool types to accelerate custom tool development.

**Templates to Create:**
1. API Integration Template
2. Data Processing Template
3. Web Scraping Template
4. File Processing Template
5. Notification Template
6. Database Query Template

**Acceptance Criteria:**
- [ ] 6+ starter templates available
- [ ] Each template fully documented
- [ ] One-click start from template
- [ ] Templates cover common use cases
- [ ] Best practices embedded in templates

---

### TT-7.3 Interactive Tool Builder

**Status:** Not Started
**Priority:** LOW
**Estimated Effort:** 10-12 hours
**Risk:** MEDIUM - Complex UI

**Prompt:**
Create a visual tool builder for users who prefer GUI-based tool creation over code.

**Implementation Details:**
1. Drag-and-drop interface
2. Visual input/output schema builder
3. Logic blocks for conditionals
4. Pre-built action blocks
5. Code preview and export
6. Test within builder

**Acceptance Criteria:**
- [ ] Visual builder accessible from tools page
- [ ] Schema builder works intuitively
- [ ] Logic blocks can be connected
- [ ] Generated code is clean
- [ ] Can test tool in builder
- [ ] Export to code for advanced editing

---

## Implementation Priority Order

### Critical Path (Launch Blockers)
1. TT-1.1 - Implement Built-in Tool Execution
2. TT-1.2 - Custom Tool Sandbox Execution
3. TT-1.3 - Tool Execution in Agent Conversations
4. TT-6.1 - Tool Security Scanning

### High Priority (Week 1-2)
5. TT-1.4 - Tool Execution Retry and Recovery
6. TT-2.1 - Tool Marketplace UI
7. TT-2.2 - Tool Publishing Workflow
8. TT-3.1 - Enhanced Tool Testing Interface
9. TT-4.1 - Tool Usage Analytics Dashboard
10. TT-4.3 - Tool Error Tracking
11. TT-6.2 - Tool Access Control
12. TT-7.1 - Tool Development Guide

### Medium Priority (Week 3-4)
13. TT-2.3 - Tool Categories and Discovery
14. TT-2.4 - Tool Import/Export
15. TT-3.2 - Tool Configuration Templates
16. TT-3.3 - Tool Dependency Management
17. TT-4.2 - Tool Performance Monitoring
18. TT-5.3 - Tool Versioning and Rollback
19. TT-6.3 - Tool Execution Audit Log
20. TT-7.2 - Tool Templates and Starters

### Lower Priority (Post-Launch)
21. TT-5.1 - Tool Chaining and Workflows
22. TT-5.2 - Async and Long-Running Tools
23. TT-7.3 - Interactive Tool Builder

---

## Success Metrics

1. **Execution Success Rate**: >95% of tool executions complete successfully
2. **Execution Latency**: p95 execution time <5 seconds for built-in tools
3. **Custom Tool Adoption**: 30%+ of users create custom tools
4. **Marketplace Activity**: 50+ tools published in first 3 months
5. **Security**: Zero security incidents from tool execution
6. **Developer Experience**: Tool creation time <15 minutes average
