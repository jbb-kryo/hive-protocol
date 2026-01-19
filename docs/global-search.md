# Global Search

The global search feature provides fast, comprehensive search across all swarms, agents, and messages in your workspace. It's accessible via keyboard shortcuts and provides categorized, real-time results.

## Overview

Global search allows you to quickly find:
- **Swarms**: By name or task description
- **Agents**: By name or role
- **Messages**: By content

Results are displayed in categories with relevant metadata like timestamps and context, making it easy to navigate to exactly what you're looking for.

## Accessing Global Search

### Keyboard Shortcuts

The fastest way to access global search is via keyboard shortcuts:

- `⌘P` (Mac) or `Ctrl+P` (Windows/Linux) - Primary shortcut
- `⌘⇧F` (Mac) or `Ctrl+Shift+F` (Windows/Linux) - Alternative shortcut

These shortcuts work from anywhere in the application and will immediately open the search dialog with focus on the input field.

### Command Palette

Global search can also be accessed through the command palette (`⌘K`):
1. Press `⌘K` to open the command palette
2. Type "search" to filter commands
3. Select "Global Search"

## Using Global Search

### Search Interface

The search dialog features:
- **Search Input**: Type your query to search across all content
- **Live Results**: Results update as you type (with 300ms debounce)
- **Categorized Display**: Results grouped by type (Swarms, Agents, Messages)
- **Keyboard Navigation**: Use arrow keys to navigate results
- **Result Count**: See total matches and breakdown by category

### Search Behavior

**Debounced Search:**
- Results update 300ms after you stop typing
- Prevents excessive database queries
- Provides smooth user experience

**Case-Insensitive:**
- All searches are case-insensitive
- "SWARM" matches "swarm" and "Swarm"

**Partial Matching:**
- Searches for partial matches within text
- "prod" matches "production" and "products"

**Result Limits:**
- Swarms: Up to 10 results
- Agents: Up to 10 results
- Messages: Up to 15 results

### Keyboard Navigation

**Within Search Dialog:**
- `↑` - Move selection up
- `↓` - Move selection down
- `Enter` - Navigate to selected result
- `Esc` - Close search dialog

**Tips:**
- Results are pre-selected starting from the first item
- Visual highlighting shows the current selection
- Press Enter without scrolling to go to the first result

## Search Results

### Swarm Results

**Information Displayed:**
- Swarm name (title)
- Task description
- Time created

**Navigation:**
Clicking a swarm result takes you directly to the swarm detail page.

**Search Fields:**
- Name
- Task description

### Agent Results

**Information Displayed:**
- Agent name (title)
- Role description
- Parent swarm name

**Navigation:**
Clicking an agent result takes you to the swarm containing that agent.

**Search Fields:**
- Name
- Role

### Message Results

**Information Displayed:**
- Message content (truncated to 100 characters)
- Sender agent name
- Parent swarm name
- Time sent

**Navigation:**
Clicking a message result takes you to the swarm with the message highlighted (via URL parameter).

**Search Fields:**
- Message content

## Implementation Details

### Architecture

The global search system consists of:

1. **Hook**: `useGlobalSearch` - Manages search logic and database queries
2. **Component**: `GlobalSearchDialog` - UI for search interface
3. **Integration**: Dashboard layout - Keyboard shortcuts and dialog mounting

### Database Queries

**Swarms Query:**
```sql
SELECT id, name, task, status, created_at
FROM swarms
WHERE owner_id = current_user_id
AND (name ILIKE '%query%' OR task ILIKE '%query%')
ORDER BY created_at DESC
LIMIT 10
```

**Agents Query:**
```sql
SELECT id, name, role, capabilities, swarm_id, swarms(name)
FROM agents
WHERE swarms.owner_id = current_user_id
AND (name ILIKE '%query%' OR role ILIKE '%query%')
ORDER BY created_at DESC
LIMIT 10
```

**Messages Query:**
```sql
SELECT id, content, created_at, agent_id, swarm_id, agents(name), swarms(name)
FROM messages
WHERE swarms.owner_id = current_user_id
AND content ILIKE '%query%'
ORDER BY created_at DESC
LIMIT 15
```

### Security

**Row Level Security:**
- All queries filter by owner_id
- Users can only search their own content
- Agent and message queries join through swarms table to ensure ownership

**Input Sanitization:**
- Supabase parameterized queries prevent SQL injection
- No direct string interpolation in queries

### Performance

**Optimization Strategies:**

1. **Debouncing**: 300ms delay prevents excessive queries
2. **Result Limits**: Cap results per category
3. **Indexed Searches**: Database indexes on name/role fields
4. **Parallel Queries**: All three queries run simultaneously
5. **Conditional Execution**: Only searches when query is non-empty

**Query Performance:**
- Average search time: < 100ms
- Multiple concurrent searches: Handled gracefully
- Empty query: No database calls

### State Management

**Hook States:**
- `results`: Object containing categorized results
- `loading`: Boolean indicating search in progress
- `error`: Error message if search fails
- `hasResults`: Computed boolean for any results

**Component States:**
- `query`: Current search text
- `selectedIndex`: Currently highlighted result
- Dialog open/close state managed by parent

## User Experience

### Loading States

**Empty State:**
- Shows when no search query entered
- Displays helpful instructions
- Lists keyboard shortcuts

**Searching State:**
- Shows loading spinner
- Displays "Searching..." message
- Prevents interaction with results

**No Results State:**
- Shows when query returns no matches
- Displays the query that was searched
- Suggests trying different terms

**Results State:**
- Shows categorized results
- Highlights selected result
- Displays result counts

### Visual Design

**Icons:**
- Swarms: Hexagon (blue)
- Agents: Bot (green)
- Messages: Message Square (purple)

**Layout:**
- Clean, scannable list
- Clear visual hierarchy
- Prominent timestamps
- Context information

**Accessibility:**
- Keyboard navigable
- Focus management
- Screen reader labels
- High contrast text

## Best Practices

### For Users

**Effective Searching:**
1. Start with specific terms
2. Use partial words for broader results
3. Try different synonyms if no results
4. Check spelling if unexpected results
5. Use keyboard navigation for speed

**Quick Tips:**
- Press `⌘P` anytime to search
- Type a few characters and wait for results
- Use arrow keys to navigate
- Press Enter to open result
- Press Esc to close and continue working

### For Developers

**Adding New Search Categories:**

1. Add database query to `useGlobalSearch` hook
2. Update result type interfaces
3. Add icon and color to maps in dialog
4. Update category labels
5. Test security (RLS policies)

**Extending Search Fields:**

To add new searchable fields:
1. Update database query OR clause
2. Consider indexing for performance
3. Test with various query patterns
4. Update documentation

**Custom Result Actions:**

To add special actions for results:
1. Add metadata to result object
2. Update navigation logic in dialog
3. Handle URL parameters if needed
4. Test navigation flow

## Troubleshooting

### No Results Found

**Possible Causes:**
1. No matching content exists
2. Content belongs to different user
3. Database connection issue
4. Query too specific

**Solutions:**
1. Try broader search terms
2. Check content ownership
3. Verify database connection
4. Use partial words instead of exact phrases

### Slow Search Performance

**Possible Causes:**
1. Large dataset
2. Missing database indexes
3. Network latency
4. Multiple concurrent queries

**Solutions:**
1. Implement pagination for large datasets
2. Add indexes on searchable columns
3. Consider caching frequent queries
4. Optimize database queries

### Search Not Opening

**Possible Causes:**
1. Keyboard shortcut conflict
2. Modal already open
3. JavaScript error
4. Focus trapped in input

**Solutions:**
1. Check browser console for errors
2. Close other modals first
3. Try clicking instead of keyboard
4. Refresh page

## Future Enhancements

### Planned Features

1. **Advanced Filters:**
   - Filter by date range
   - Filter by status
   - Filter by agent type
   - Combine multiple filters

2. **Search History:**
   - Recent searches list
   - Quick access to previous queries
   - Clear history option

3. **Saved Searches:**
   - Save frequent queries
   - Name and organize searches
   - Quick shortcuts for saved searches

4. **Search Suggestions:**
   - Auto-complete based on content
   - Suggest similar searches
   - Popular searches

5. **Full-Text Search:**
   - Better relevance ranking
   - Fuzzy matching
   - Weighted results

6. **Export Results:**
   - Export to CSV
   - Copy results to clipboard
   - Share search results

7. **Search Analytics:**
   - Track common queries
   - Identify missing content
   - Optimize based on usage

### Technical Improvements

1. **Elasticsearch Integration:**
   - Faster, more powerful search
   - Better relevance ranking
   - Advanced text analysis

2. **Search Result Caching:**
   - Cache popular queries
   - Reduce database load
   - Faster repeated searches

3. **Infinite Scroll:**
   - Load more results on scroll
   - Remove arbitrary limits
   - Better for large datasets

4. **Search Highlighting:**
   - Highlight matched terms in results
   - Show context around matches
   - Make matches more visible

## API Reference

### `useGlobalSearch` Hook

```typescript
function useGlobalSearch(
  query: string,
  enabled?: boolean
): {
  results: SearchResults
  loading: boolean
  error: string | null
  hasResults: boolean
}
```

**Parameters:**
- `query` (string): Search query text
- `enabled` (boolean): Whether to perform search (default: true)

**Returns:**
- `results`: Categorized search results
- `loading`: Loading state
- `error`: Error message if any
- `hasResults`: Whether any results exist

### `SearchResults` Interface

```typescript
interface SearchResults {
  swarms: SearchResult[]
  agents: SearchResult[]
  messages: SearchResult[]
  total: number
}
```

### `SearchResult` Interface

```typescript
interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  description?: string
  url: string
  metadata?: {
    swarmId?: string
    swarmName?: string
    agentName?: string
    timestamp?: string
  }
}
```

### `GlobalSearchDialog` Component

```typescript
function GlobalSearchDialog({
  open: boolean
  onOpenChange: (open: boolean) => void
}): JSX.Element
```

**Props:**
- `open`: Control dialog visibility
- `onOpenChange`: Callback when visibility changes

## Related Documentation

- [Keyboard Shortcuts](./keyboard-shortcuts.md) - All keyboard shortcuts
- [Command Palette](./command-palette.md) - Quick actions
- [Database Schema](./database.md) - Database structure
- [Security](./security.md) - RLS policies

## Feedback

We're constantly improving global search. If you have suggestions or encounter issues:

1. Use the feedback form in settings
2. Contact support
3. Join our community discussions
4. Report bugs through the issue tracker

Your feedback helps us make search better for everyone!
