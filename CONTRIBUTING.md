# Contributing to HIVE Protocol

Thank you for your interest in contributing to HIVE Protocol! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Security Guidelines](#security-guidelines)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

---

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for mistakes and learn from them
- Prioritize the community's best interests

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18.x or higher
- npm 9.x or higher
- Git 2.x or higher
- A Supabase account (for database features)
- A code editor (VS Code recommended)

### Finding Issues to Work On

1. Check the [Issues](../../issues) page for open issues
2. Look for issues labeled `good first issue` if you're new
3. Issues labeled `help wanted` are great for contributors
4. Comment on an issue before starting work to avoid duplicates

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/hive-protocol.git
cd hive-protocol

# Add the upstream remote
git remote add upstream https://github.com/hive-protocol/hive-protocol.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

The project uses Supabase for the database. Migrations are located in `supabase/migrations/`.

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 6. Verify Setup

Run the following commands to verify your setup:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build
```

---

## Code Style Guidelines

### General Principles

1. **Readability over cleverness** - Write code that others can understand
2. **Consistency** - Follow existing patterns in the codebase
3. **Single Responsibility** - Each function/component should do one thing well
4. **DRY** - Don't Repeat Yourself, but don't over-abstract

### TypeScript

```typescript
// Use explicit types for function parameters and return values
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Use interfaces for object shapes
interface User {
  id: string
  email: string
  createdAt: Date
}

// Use type for unions and intersections
type Status = 'pending' | 'active' | 'completed'

// Avoid `any` - use `unknown` if type is truly unknown
function parseData(input: unknown): ParsedData {
  // Validate and narrow the type
}
```

### React Components

```typescript
// Use functional components with TypeScript
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  disabled = false,
  onClick,
  children
}: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg',
        variant === 'primary' && 'bg-primary text-white',
        variant === 'secondary' && 'bg-secondary'
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### File Organization

```
/app                    # Next.js App Router pages
  /dashboard
    page.tsx           # Page component
    layout.tsx         # Layout component
/components
  /ui                  # Reusable UI components
  /dashboard           # Feature-specific components
/hooks                 # Custom React hooks
/lib                   # Utility functions and configurations
/store                 # State management
/supabase
  /functions           # Edge functions
  /migrations          # Database migrations
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `UserProfile` |
| CSS classes | kebab-case | `user-profile` |
| Database tables | snake_case | `user_profiles` |
| Edge functions | kebab-case | `check-rate-limit` |

### Imports

Order imports as follows:

```typescript
// 1. React and Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { format } from 'date-fns'
import { z } from 'zod'

// 3. Internal components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 4. Hooks and utilities
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

// 5. Types
import type { User } from '@/lib/supabase'
```

### Comments

- Avoid unnecessary comments - code should be self-documenting
- Use comments to explain **why**, not **what**
- Use JSDoc for public APIs

```typescript
/**
 * Calculates the user's subscription tier based on usage metrics.
 * Uses a weighted algorithm that prioritizes message volume over storage.
 */
function calculateTier(usage: UsageMetrics): SubscriptionTier {
  // Apply 70/30 weighting as per product requirements
  const weightedScore = usage.messages * 0.7 + usage.storage * 0.3
  // ...
}
```

---

## Branch Naming Conventions

Use the following format for branch names:

```
<type>/<issue-number>-<short-description>
```

### Types

| Type | Description |
|------|-------------|
| `feature` | New feature or enhancement |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `security` | Security improvements |

### Examples

```bash
feature/123-add-user-dashboard
fix/456-resolve-login-timeout
docs/789-update-api-documentation
refactor/101-simplify-auth-flow
security/202-fix-xss-vulnerability
```

---

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding tests |
| `chore` | Maintenance |
| `perf` | Performance improvement |
| `security` | Security fix |

### Examples

```bash
feat(auth): add two-factor authentication support

fix(dashboard): resolve chart rendering issue on mobile

docs(api): update webhook documentation

refactor(hooks): simplify useAuth hook logic

security(api): sanitize user input in search endpoint

Fixes #123
```

### Guidelines

- Use imperative mood: "add feature" not "added feature"
- Keep subject line under 72 characters
- Reference issues in the footer
- Separate subject from body with blank line

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

3. **Self-review your code**
   - Remove console.logs and debugging code
   - Ensure no secrets or credentials are committed
   - Check for proper error handling

### Submitting a PR

1. Push your branch to your fork
2. Open a Pull Request against `main`
3. Fill out the PR template completely
4. Link related issues using keywords (`Fixes #123`)
5. Request review from maintainers

### Review Process

1. **Automated checks** - CI must pass
2. **Code review** - At least one maintainer approval required
3. **Changes requested** - Address feedback in new commits
4. **Approval** - Maintainer approves and merges

### After Merge

- Delete your feature branch
- Pull the latest changes from upstream
- Close any related issues if not auto-closed

---

## Testing Requirements

### What to Test

- New features must include tests
- Bug fixes should include regression tests
- Edge cases and error conditions

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should behave in expected way', () => {
      // Arrange
      const props = { /* ... */ }

      // Act
      render(<Component {...props} />)

      // Assert
      expect(screen.getByText('Expected')).toBeInTheDocument()
    })
  })
})
```

### Coverage Requirements

- Minimum 70% coverage for new code
- Critical paths require 90%+ coverage
- All public APIs must be tested

---

## Security Guidelines

Security is paramount. Follow these guidelines:

### Do

- Validate all user input
- Use parameterized queries for database operations
- Sanitize output to prevent XSS
- Use HTTPS for all external requests
- Follow the principle of least privilege
- Report security issues privately

### Don't

- Commit secrets, API keys, or credentials
- Use `eval()` or `Function()` constructor
- Trust user input without validation
- Expose detailed error messages to users
- Disable security features for convenience

### Reporting Security Issues

Do NOT open public issues for security vulnerabilities.

Email security concerns to: security@hiveprotocol.dev

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

## Documentation

### When to Document

- New features
- API changes
- Configuration options
- Complex algorithms

### Documentation Style

- Use clear, concise language
- Include code examples
- Keep documentation close to code
- Update docs with code changes

### Where to Document

| Content | Location |
|---------|----------|
| API docs | Inline JSDoc comments |
| Features | `/docs` folder |
| Setup | `README.md` |
| Architecture | `/docs/architecture.md` |

---

## Getting Help

### Resources

- [Documentation](./docs)
- [Issue Tracker](../../issues)
- [Discussions](../../discussions)

### Contact

- Discord: [HIVE Community](https://discord.gg/hive)
- Email: contributors@hiveprotocol.dev

### Response Times

- **Issues**: Within 48 hours
- **PRs**: Within 72 hours
- **Security**: Within 24 hours

---

## Recognition

Contributors are recognized in:

- `CONTRIBUTORS.md` file
- Release notes
- Project documentation

Thank you for contributing to HIVE Protocol!
