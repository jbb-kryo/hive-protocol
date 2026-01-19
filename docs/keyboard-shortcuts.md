# Keyboard Shortcuts

This document details all keyboard shortcuts available in the HIVE Protocol application for power users.

## Overview

Keyboard shortcuts enable faster navigation and actions throughout the application. All shortcuts are designed to be intuitive and follow common conventions across operating systems.

## Notation

- `⌘` - Command key (macOS)
- `Ctrl` - Control key (Windows/Linux)
- `⌘/Ctrl` - Either Command (macOS) or Control (Windows/Linux)
- `Shift` - Shift key
- `Alt` - Alt/Option key
- `Esc` - Escape key

## Global Shortcuts

These shortcuts work anywhere in the application:

### Command Palette
**Shortcut:** `⌘K` or `Ctrl+K`

Opens the command palette for quick access to:
- Navigation to any page
- Common actions
- Admin functions (if admin)
- Help and documentation

The command palette features:
- Fuzzy search across all commands
- Categorized commands
- Keyword matching
- Recent commands (future enhancement)

### Keyboard Shortcuts Help
**Shortcut:** `Shift+?`

Opens a dialog showing all available keyboard shortcuts. This provides a quick reference without leaving your current context.

### Close Dialogs/Modals
**Shortcut:** `Esc`

Closes any open dialog, modal, or drawer. This includes:
- Command palette
- Keyboard shortcuts dialog
- Create swarm dialog
- Settings dialogs
- Mobile sheets

## Navigation Shortcuts

Quick navigation to main sections:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `⌘D` or `Ctrl+D` | Dashboard | Go to the main dashboard |
| `⌘S` or `Ctrl+S` | Swarms | View all swarms |
| `⌘A` or `Ctrl+A` | Agents | View all agents |
| `⌘T` or `Ctrl+T` | Tools | View tools library |
| `⌘,` or `Ctrl+,` | Settings | Open settings |

### Navigation Notes
- Navigation shortcuts work from anywhere in the application
- They won't trigger if you're typing in an input field (unless you press a modifier key)
- They're shown in tooltips when hovering over sidebar items

## Page-Specific Shortcuts

### Swarms Page

| Shortcut | Action | Description |
|----------|--------|-------------|
| `N` | New Swarm | Opens the create swarm dialog |
| `/` | Focus Search | Focuses the search input field |

### Future Page Shortcuts (Planned)

**Agents Page:**
- `N` - Create new agent
- `/` - Focus search

**Tools Page:**
- `N` - Create new tool
- `/` - Focus search

**Dashboard:**
- `R` - Refresh stats
- `B` - Broadcast message

## Implementation Details

### Hook: `useKeyboardShortcuts`

Custom hook for managing keyboard shortcuts in any component:

```typescript
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

function MyComponent() {
  useKeyboardShortcuts([
    {
      key: 'n',
      description: 'Create new item',
      action: () => handleCreate(),
    },
    {
      key: 's',
      metaKey: true,
      ctrlKey: true,
      description: 'Save',
      action: () => handleSave(),
    },
  ])
}
```

### Features:
- **Smart Input Detection**: Shortcuts don't trigger while typing in inputs (except Escape and modifier combos)
- **Cross-Platform**: Automatically adapts for macOS (⌘) and Windows/Linux (Ctrl)
- **Conflict Prevention**: Only one shortcut fires per keypress
- **Easy to Extend**: Add shortcuts to any component

### Hook: `useNavigationShortcuts`

Provides standard navigation shortcuts:

```typescript
import { useNavigationShortcuts } from '@/hooks/use-keyboard-shortcuts'

function Layout() {
  const navigationShortcuts = useNavigationShortcuts()
  useKeyboardShortcuts(navigationShortcuts)
}
```

## Components

### CommandPalette

The command palette is the central hub for keyboard-driven actions.

**Location:** `components/dashboard/command-palette.tsx`

**Features:**
- Fuzzy search
- Categorized commands
- Keyboard navigation
- Admin-only commands
- Extensible command system

**Usage:**
```typescript
<CommandPalette
  open={open}
  onOpenChange={setOpen}
/>
```

### KeyboardShortcutsDialog

Displays all available shortcuts in a helpful dialog.

**Location:** `components/dashboard/keyboard-shortcuts-dialog.tsx`

**Features:**
- Grouped by category
- Visual keyboard keys
- Platform-aware shortcuts
- Always accessible via `?`

### Kbd Component

Visual component for displaying keyboard shortcuts.

**Location:** `components/ui/kbd.tsx`

**Usage:**
```typescript
<Kbd>⌘K</Kbd>
<Kbd>Ctrl+S</Kbd>
```

## Tooltip Integration

Keyboard shortcuts are shown in tooltips throughout the app:

```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <Button>Save</Button>
  </TooltipTrigger>
  <TooltipContent>
    <div className="flex items-center gap-2">
      <span>Save changes</span>
      <Kbd>⌘S</Kbd>
    </div>
  </TooltipContent>
</Tooltip>
```

### Locations:
- Sidebar navigation items (collapsed state)
- Action buttons (New Swarm, etc.)
- Search inputs
- Common actions

## Accessibility

### Keyboard Navigation
- All shortcuts work with keyboard only
- Screen readers announce shortcuts in ARIA labels
- Focus management for dialogs
- Clear visual feedback

### Best Practices
- Shortcuts don't override browser defaults
- Cmd/Ctrl combos for global actions
- Single keys for page-specific actions
- Escape always closes dialogs
- No conflicts with form inputs

## Adding New Shortcuts

### Step 1: Add to Component

```typescript
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

function MyPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  useKeyboardShortcuts([
    {
      key: 'n',
      description: 'Create new item',
      action: () => setDialogOpen(true),
    },
  ])

  // ... rest of component
}
```

### Step 2: Add Tooltip

```typescript
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        New Item
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <div className="flex items-center gap-2">
        <span>Create new item</span>
        <Kbd>N</Kbd>
      </div>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Step 3: Document in Help Dialog

Update `components/dashboard/keyboard-shortcuts-dialog.tsx`:

```typescript
{
  category: 'My Page',
  items: [
    { keys: ['N'], description: 'Create new item' },
  ],
}
```

## Platform Differences

### macOS
- Uses `⌘` (Command) key
- `⌘K` for command palette
- `⌘,` for settings (standard)
- Shows Mac symbols in UI

### Windows/Linux
- Uses `Ctrl` key
- `Ctrl+K` for command palette
- `Ctrl+,` for settings
- Shows "Ctrl" text in UI

### Detection
```typescript
const isMac = typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0
```

## Future Enhancements

### Planned Features
1. **Customizable Shortcuts**: Let users remap shortcuts
2. **Shortcut Profiles**: Different sets for different workflows
3. **Recent Commands**: Show recently used commands first
4. **Command History**: Navigate through command history
5. **Shortcut Conflicts**: Warn about conflicting shortcuts
6. **Vim Mode**: Optional vim-style navigation
7. **Shortcut Recording**: Record custom shortcut sequences
8. **Search Shortcut**: Global search with `⌘P`
9. **Window Management**: Split views, focus switching
10. **Quick Actions**: Context-aware shortcuts

### Additional Shortcuts to Add

**Global:**
- `⌘P` - Quick file/swarm search
- `⌘B` - Toggle sidebar
- `⌘\` - Toggle theme
- `⌘↑/↓` - Scroll to top/bottom

**Swarm Detail:**
- `Enter` - Send message
- `↑/↓` - Navigate messages
- `E` - Edit message
- `D` - Delete message
- `R` - Reply to message
- `C` - Copy message
- `M` - Add agent

**Agents:**
- `↑/↓` - Navigate agent list
- `Enter` - View agent details
- `E` - Edit agent
- `D` - Delete agent

**Tools:**
- Similar to agents

## Testing

### Manual Testing Checklist
- [ ] Command palette opens with `⌘K`
- [ ] Help dialog opens with `?`
- [ ] All navigation shortcuts work
- [ ] Shortcuts don't trigger in inputs
- [ ] Escape closes dialogs
- [ ] Tooltips show shortcuts
- [ ] Cross-platform keys display correctly
- [ ] No conflicts with browser shortcuts

### Test on Multiple Platforms
- [ ] macOS (Chrome, Safari, Firefox)
- [ ] Windows (Chrome, Edge, Firefox)
- [ ] Linux (Chrome, Firefox)

### Test with Screen Readers
- [ ] VoiceOver (macOS)
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)

## Performance

### Optimization Strategies
1. **Event Delegation**: Single listener at root level
2. **Debouncing**: Prevent rapid-fire triggers
3. **Cleanup**: Remove listeners on unmount
4. **Lazy Loading**: Load command palette on first use
5. **Memoization**: Cache shortcut displays

### Bundle Size
- `use-keyboard-shortcuts.ts`: ~2KB
- `command-palette.tsx`: ~5KB
- `keyboard-shortcuts-dialog.tsx`: ~3KB
- Total: ~10KB (minified + gzipped: ~3KB)

## Troubleshooting

### Shortcut Not Working
1. Check if you're in an input field
2. Verify no browser extension conflicts
3. Check browser shortcuts settings
4. Look for JavaScript errors
5. Confirm component is mounted

### Wrong Key Displayed
1. Check platform detection
2. Verify navigator.platform
3. Test on actual device
4. Check CSS rendering

### Conflicts with Browser
1. Use modifier keys (Cmd/Ctrl)
2. Avoid common browser shortcuts
3. Check preventDefault() is called
4. Test in different browsers

## Resources

### Related Files
- `/hooks/use-keyboard-shortcuts.ts` - Main hook
- `/components/dashboard/command-palette.tsx` - Command palette
- `/components/dashboard/keyboard-shortcuts-dialog.tsx` - Help dialog
- `/components/ui/kbd.tsx` - Keyboard key component
- `/app/dashboard/layout.tsx` - Global shortcuts setup

### External References
- [MDN: Keyboard Events](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [WAI-ARIA: Keyboard Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [Apple HIG: Keyboard](https://developer.apple.com/design/human-interface-guidelines/keyboards)
- [Material Design: Keyboard](https://material.io/design/platform-guidance/cross-platform-adaptation.html#keyboard)

### Inspiration
- VS Code Command Palette
- Spotlight (macOS)
- Alfred (macOS)
- Raycast (macOS)
- Linear command palette
- GitHub keyboard shortcuts

## Examples from Other Apps

### VS Code
- `⌘P` - Quick open
- `⌘⇧P` - Command palette
- `⌘B` - Toggle sidebar
- `⌘,` - Settings

### GitHub
- `?` - Show shortcuts
- `S` or `/` - Focus search
- `G D` - Go to Dashboard
- `G N` - Notifications

### Linear
- `⌘K` - Command palette
- `C` - Create issue
- `Q` - Assign to me
- `I` - Set priority

### Gmail
- `C` - Compose
- `/` - Search
- `J/K` - Navigate
- `E` - Archive

## Conclusion

Keyboard shortcuts significantly improve the user experience for power users. They enable faster workflows, reduce mouse usage, and provide a more efficient way to interact with the application.

The implementation is designed to be:
- **Extensible**: Easy to add new shortcuts
- **Discoverable**: Tooltips and help dialog
- **Accessible**: Works with screen readers
- **Cross-platform**: Adapts to OS conventions
- **Performant**: Minimal overhead

Future enhancements will add even more power user features, making HIVE Protocol one of the most keyboard-friendly AI collaboration platforms.
