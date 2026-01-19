# Empty States

This document describes the empty states implementation throughout the HIVE Protocol application.

## Overview

Empty states provide helpful guidance when users encounter sections with no data. They include clear messaging, visual icons, and actionable CTAs to help users understand what to do next.

## Components

### EmptyState

A flexible, reusable component for displaying empty states with icons, titles, descriptions, and action buttons.

```tsx
import { EmptyState } from '@/components/ui/empty-state'

<EmptyState
  icon={Hexagon}
  title="Create your first swarm"
  description="Swarms enable multiple AI agents to collaborate on complex tasks."
  action={{
    label: 'Create Swarm',
    onClick: () => setCreateDialogOpen(true),
  }}
  secondaryAction={{
    label: 'Learn More',
    onClick: () => router.push('/docs'),
    variant: 'outline',
  }}
  variant="card"
/>
```

**Props:**
- `icon` - Lucide icon component to display
- `title` - Main heading text
- `description` - Supporting description text
- `action` - Primary action button (optional)
  - `label` - Button text
  - `onClick` - Click handler
  - `variant` - Button variant (default, outline, etc.)
- `secondaryAction` - Secondary action button (optional)
- `children` - Additional custom content (optional)
- `className` - Additional CSS classes
- `variant` - Display variant: `'default'` or `'card'`

### EmptyStateList

A compact variant for displaying empty states in lists or smaller containers.

```tsx
import { EmptyStateList } from '@/components/ui/empty-state'

<EmptyStateList
  icon={Bot}
  title="No agents yet"
  description="Create your first AI agent to get started"
  action={{
    label: 'Create Agent',
    onClick: () => setCreateDialogOpen(true),
  }}
/>
```

**Props:**
- `icon` - Lucide icon component
- `title` - Title text
- `description` - Description text
- `action` - Action button (optional)

## Implementation Examples

### 1. Swarms Page

**No Swarms Created:**
```tsx
<EmptyState
  icon={Hexagon}
  title="Create your first swarm"
  description="Swarms enable multiple AI agents to collaborate on complex tasks. Start by creating a swarm and adding agents with different capabilities."
  action={{
    label: 'Create Swarm',
    onClick: () => setCreateDialogOpen(true),
  }}
  variant="card"
/>
```

**No Search Results:**
```tsx
<EmptyState
  icon={Search}
  title="No swarms found"
  description="Try adjusting your search or filters to find what you're looking for."
  action={{
    label: 'Clear Filters',
    onClick: () => {
      setSearch('')
      setStatusFilter('all')
    },
    variant: 'outline',
  }}
  variant="card"
/>
```

### 2. Agents Page

**Agent List Empty:**
```tsx
<EmptyStateList
  icon={Bot}
  title="No agents yet"
  description="Create your first AI agent to get started with intelligent automation"
  action={{
    label: 'Create Agent',
    onClick: () => setCreateDialogOpen(true),
  }}
/>
```

**No Agent Selected:**
```tsx
<EmptyStateList
  icon={Bot}
  title="Select an agent"
  description="Choose an agent from the list to view and edit its configuration"
/>
```

**No Tools Available:**
```tsx
<EmptyStateList
  icon={Wrench}
  title="No tools available"
  description="Create tools in the Tools page to assign them to agents"
/>
```

**No Activity:**
```tsx
<EmptyStateList
  icon={Clock}
  title="No activity yet"
  description="Activity will appear here when this agent participates in swarms"
/>
```

### 3. Swarm Messages

**No Messages:**
```tsx
<EmptyState
  icon={Sparkles}
  title="Start the conversation"
  description={
    swarm?.agents?.length > 0
      ? "Send a message to begin collaborating with your AI agents."
      : "Add agents to this swarm to start collaborating."
  }
  action={
    swarm?.agents?.length === 0
      ? {
          label: 'Add Agents',
          onClick: () => setAddAgentOpen(true),
        }
      : undefined
  }
/>
```

### 4. Tools Page

**No Custom Tools:**
```tsx
<EmptyState
  icon={Sparkles}
  title="Create your first custom tool"
  description="Describe what you need in plain English and let AI generate a custom tool for your agents."
  action={{
    label: 'Create Custom Tool',
    onClick: () => setCreateDialogOpen(true),
  }}
  variant="card"
/>
```

**No Search Results:**
```tsx
<EmptyState
  icon={Search}
  title="No tools found"
  description="Try adjusting your search or filters to find what you're looking for."
  action={{
    label: 'Clear Search',
    onClick: () => setSearch(''),
    variant: 'outline',
  }}
  variant="card"
/>
```

## Design Patterns

### 1. First-Time Experience

When users haven't created any content yet, empty states should:
- Explain what the feature does
- Highlight the value proposition
- Provide a clear CTA to create the first item
- Use encouraging, friendly language

**Example:**
```tsx
<EmptyState
  icon={Hexagon}
  title="Create your first swarm"
  description="Swarms enable multiple AI agents to collaborate on complex tasks."
  action={{ label: 'Create Swarm', onClick: createHandler }}
/>
```

### 2. No Search Results

When filters or search return no results:
- Acknowledge the empty results
- Suggest adjusting filters
- Provide a CTA to clear filters
- Keep the tone helpful, not frustrating

**Example:**
```tsx
<EmptyState
  icon={Search}
  title="No results found"
  description="Try adjusting your search or filters."
  action={{ label: 'Clear Filters', onClick: clearFilters }}
/>
```

### 3. Missing Dependencies

When a feature requires something else first:
- Explain what's needed
- Provide a CTA to fulfill the dependency
- Use clear, actionable language

**Example:**
```tsx
<EmptyState
  icon={Sparkles}
  title="Start the conversation"
  description="Add agents to this swarm to start collaborating."
  action={{ label: 'Add Agents', onClick: addAgentsHandler }}
/>
```

### 4. Awaiting Activity

When data will appear after certain actions:
- Explain when data will appear
- Set clear expectations
- No CTA needed (optional)

**Example:**
```tsx
<EmptyStateList
  icon={Clock}
  title="No activity yet"
  description="Activity will appear here when this agent participates in swarms"
/>
```

## Visual Guidelines

### Icons
- Use relevant Lucide icons
- Icons should clearly represent the content type
- Common icons:
  - `Hexagon` - Swarms
  - `Bot` - Agents
  - `Sparkles` - AI/Creation
  - `Search` - Search results
  - `Clock` - Activity/History
  - `Wrench` - Tools

### Text Content
- **Title**: Short, clear (3-6 words)
- **Description**: One sentence, actionable guidance
- **CTA**: Action verb + noun (e.g., "Create Swarm")

### Layout
- Center-aligned for maximum impact
- Adequate whitespace around content
- Card variant for page-level empty states
- Default variant for section-level empty states

## Best Practices

1. **Be Helpful**: Explain what the user can do, not what they can't
2. **Be Brief**: Keep text concise and scannable
3. **Be Clear**: Use simple, direct language
4. **Provide Actions**: Include CTAs whenever possible
5. **Match Context**: Tailor messaging to the specific situation
6. **Stay Positive**: Use encouraging language
7. **Be Consistent**: Use the EmptyState components throughout

## Accessibility

Empty states follow accessibility best practices:
- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast
- Clear focus indicators

## Testing Empty States

To test empty states:

1. **Create new account**: See first-time empty states
2. **Clear all data**: Use filters to show empty results
3. **Navigate sections**: Check different empty state scenarios
4. **Test CTAs**: Ensure all action buttons work correctly
5. **Check responsiveness**: Verify layout on different screen sizes

## Locations

Empty states are implemented in:

- `/swarms` - No swarms, no search results
- `/swarms/[id]` - No messages
- `/agents` - No agents, no selection, no tools, no activity
- `/tools` - No tools (all/built-in/custom), no search results
- `/dashboard` - Various empty data states
- Admin pages - Various empty data scenarios

## Future Enhancements

Potential improvements for empty states:

1. **Illustrations**: Add custom illustrations for key empty states
2. **Animations**: Subtle animations when empty states appear
3. **Contextual Help**: Link to relevant documentation
4. **Onboarding**: Integrate with user onboarding flow
5. **Video Tutorials**: Embed tutorial videos for complex features
