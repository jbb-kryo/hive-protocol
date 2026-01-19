# Mobile Responsiveness

This document outlines the mobile responsiveness implementation throughout the HIVE Protocol application.

## Overview

The application is fully responsive and optimized for mobile devices, with touch-friendly interactions, appropriate font sizes, and adaptive layouts that work seamlessly across all screen sizes.

## Key Features

### 1. Responsive Navigation

**Desktop Navigation (≥ 1024px)**
- Collapsible sidebar with full labels
- Toggle button to expand/collapse sidebar
- Always visible on large screens
- Smooth transitions between states

**Mobile Navigation (< 1024px)**
- Hamburger menu button (fixed top-left)
- Sheet component slides in from left
- Full navigation menu with labels
- Automatic close on link click
- Shadow for better visibility

**Implementation:**
```tsx
// components/dashboard/sidebar.tsx
<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
  <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
    <Button variant="outline" size="icon" className="shadow-lg">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="p-0 w-64">
    <SidebarContent isMobile={true} />
  </SheetContent>
</Sheet>
```

### 2. Swarm Detail Mobile Sheet

**Desktop (≥ 1024px)**
- Agents sidebar visible on right (w-72)
- Shared context section below agents
- Fixed width sidebar

**Mobile (< 1024px)**
- Agents button in header with badge count
- Sheet slides in from right on click
- Shows agents, context, and tools
- Touch-friendly larger avatars (40x40)
- Visible action buttons (no hover required)

**Implementation:**
```tsx
// Agents drawer on mobile
<Sheet>
  <SheetTrigger asChild className="lg:hidden">
    <Button variant="outline" size="sm">
      <Users className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">Agents</span>
      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
        {swarmAgents.length}
      </Badge>
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-80 p-0">
    {/* Agents and context content */}
  </SheetContent>
</Sheet>
```

### 3. Responsive Typography

**Font Scaling:**
```tsx
// Headers
<h1 className="font-semibold text-sm sm:text-base truncate">

// Body text
<p className="text-xs sm:text-sm text-muted-foreground">

// Buttons
<span className="hidden sm:inline">Label</span>
```

**Breakpoints:**
- `sm:` - 640px and up (small tablets)
- `md:` - 768px and up (tablets)
- `lg:` - 1024px and up (laptops)
- `xl:` - 1280px and up (desktops)

### 4. Touch-Friendly Interactions

**Minimum Touch Target Sizes:**
- Added `.touch-target` utility class
- Minimum 44x44px for tap targets
- Larger buttons on mobile (h-8/w-8 vs h-6/w-6)
- Adequate spacing between interactive elements

**Implementation:**
```css
/* globals.css */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}
```

**Mobile-Optimized Controls:**
```tsx
// Larger touch targets on mobile
<Button size="sm" className="h-8 w-8">  // Mobile
<Button size="icon" className="h-6 w-6">  // Desktop hover
```

### 5. Responsive Layouts

**Header Optimization:**
```tsx
// Swarm header with responsive padding and spacing
<header className="border-b border-border p-3 sm:p-4 flex items-center justify-between shrink-0 gap-2">
  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
    <div className="min-w-0 flex-1">
      <h1 className="font-semibold text-sm sm:text-base truncate">
      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
    </div>
  </div>
</header>
```

**Grid Responsiveness:**
```tsx
// Dashboard grid
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

// Stats grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
```

**Content Spacing:**
```tsx
// Adaptive padding
<div className="p-4 lg:p-8">  // More padding on larger screens
<div className="p-3 sm:p-4">  // Smaller on mobile
```

### 6. Visibility Control

**Selective Hiding:**
```tsx
// Hide on mobile, show on desktop
<div className="hidden sm:block">
<Button className="hidden lg:flex">

// Hide on desktop, show on mobile
<Sheet className="lg:hidden">
```

**Example: Header Controls**
```tsx
// Connection status - hidden on mobile
<Button className="hidden sm:flex">Live</Button>

// Status badge - hidden on mobile
<Badge className="hidden sm:inline-flex">active</Badge>

// Share button - hidden on mobile
<Button className="hidden sm:flex">Share</Button>
```

## Layout Patterns

### Dashboard Layout

```tsx
// app/dashboard/layout.tsx
<div className="flex h-screen overflow-hidden">
  <Sidebar />
  <main className="flex-1 overflow-y-auto bg-background">
    {/* Mobile spacing for menu button */}
    <div className="lg:pt-0 pt-16">
      {children}
    </div>
  </main>
</div>
```

### Empty States

Empty states are responsive and maintain readability:
```tsx
<EmptyState
  icon={Hexagon}
  title="Create your first swarm"
  description="Swarms enable multiple AI agents to collaborate..."
  action={{
    label: 'Create Swarm',
    onClick: handler,
  }}
  variant="card"
/>
```

### Cards and Content

```tsx
// Responsive card grids
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  <SwarmCard />
</div>

// Flexible rows
<div className="flex flex-col sm:flex-row gap-4">
```

## Mobile Testing Checklist

### Navigation
- [x] Menu button accessible on mobile
- [x] Sheet opens smoothly
- [x] Navigation links work
- [x] Sheet closes on navigation
- [x] Desktop sidebar toggle works

### Swarm Detail
- [x] Agents drawer accessible
- [x] Agents list scrollable
- [x] Add/remove agents works
- [x] Context sections visible
- [x] Message input usable
- [x] Mode selector accessible

### Pages
- [x] Dashboard - stats grid responsive
- [x] Swarms - cards stack properly
- [x] Agents - list and detail responsive
- [x] Tools - grid layout works
- [x] Settings - forms stack properly
- [x] Integrations - cards responsive

### Typography
- [x] Headers readable (14-16px min)
- [x] Body text readable (12-14px min)
- [x] Line-height appropriate
- [x] No horizontal overflow
- [x] Truncation works properly

### Touch Targets
- [x] All buttons ≥ 44x44px
- [x] Links easy to tap
- [x] Form inputs large enough
- [x] Adequate spacing
- [x] No accidental taps

### Visual Elements
- [x] Icons appropriately sized
- [x] Badges readable
- [x] Avatars clear
- [x] Status indicators visible
- [x] Loading states clear

## Responsive Design Principles

### 1. Mobile-First Approach
- Base styles target mobile
- Progressive enhancement for larger screens
- `sm:`, `md:`, `lg:` breakpoints add features

### 2. Content Priority
- Most important content always visible
- Secondary features in drawers/sheets
- Progressive disclosure on mobile

### 3. Touch Optimization
- 44x44px minimum touch targets
- Adequate spacing between tappable elements
- No hover-only interactions
- Clear active/pressed states

### 4. Performance
- Images optimized for mobile
- Conditional rendering for mobile
- Lazy loading where appropriate
- Smooth transitions and animations

### 5. Accessibility
- Semantic HTML maintained
- Keyboard navigation works
- Screen reader friendly
- Focus management in sheets/dialogs

## Common Responsive Patterns

### 1. Stacking Pattern
```tsx
// Horizontal on desktop, vertical on mobile
<div className="flex flex-col sm:flex-row gap-4">
```

### 2. Grid Pattern
```tsx
// 1 col mobile, 2 col tablet, 3 col desktop
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
```

### 3. Hide/Show Pattern
```tsx
// Show different content based on screen size
<div className="hidden lg:block">Desktop content</div>
<div className="lg:hidden">Mobile content</div>
```

### 4. Text Scaling Pattern
```tsx
// Scale text for readability
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
```

### 5. Spacing Pattern
```tsx
// Tighter spacing on mobile
<div className="p-4 lg:p-8">
<div className="gap-2 sm:gap-4 lg:gap-6">
```

## Breakpoint Reference

```css
/* Tailwind default breakpoints */
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large desktops */
```

## Best Practices

### Do's
- ✅ Test on real devices
- ✅ Use semantic HTML
- ✅ Maintain touch target sizes
- ✅ Provide clear feedback
- ✅ Keep forms simple on mobile
- ✅ Use sheets for secondary content
- ✅ Truncate text appropriately
- ✅ Add loading states
- ✅ Test landscape orientation

### Don'ts
- ❌ Rely on hover states
- ❌ Use tiny tap targets
- ❌ Create horizontal scroll
- ❌ Hide essential features on mobile
- ❌ Use fixed positioning carelessly
- ❌ Forget about keyboard navigation
- ❌ Ignore performance on mobile
- ❌ Use small fonts
- ❌ Overcrowd the interface

## Testing Tools

### Browser DevTools
- Chrome DevTools (Device Mode)
- Firefox Responsive Design Mode
- Safari Responsive Design Mode

### Physical Devices
- iPhone (various sizes)
- Android phones (various sizes)
- Tablets (iPad, Android tablets)

### Testing Scenarios
1. **Navigation**: Open/close mobile menu
2. **Swarm Detail**: Open agents drawer
3. **Forms**: Fill out and submit
4. **Scrolling**: Verify no horizontal scroll
5. **Touch**: Tap all interactive elements
6. **Rotation**: Test portrait/landscape
7. **Text**: Verify readability
8. **Images**: Check loading/display

## Known Limitations

1. **Tables**: Complex tables may require horizontal scroll on mobile
2. **Charts**: Some charts may be difficult to read on very small screens
3. **Modals**: Multiple stacked modals can be challenging on mobile

## Future Enhancements

Potential improvements for mobile experience:

1. **Bottom Navigation**: Optional bottom nav bar for primary actions
2. **Swipe Gestures**: Swipe to close sheets, swipe between views
3. **Pull to Refresh**: Refresh content with pull gesture
4. **Haptic Feedback**: Vibration feedback for actions (PWA)
5. **Offline Mode**: Better offline experience with service workers
6. **Install Prompt**: Progressive Web App installation
7. **Dark Mode Toggle**: Easier access to theme switcher on mobile
8. **Voice Input**: Voice-to-text for message composition
9. **Quick Actions**: Long-press context menus
10. **Pinch to Zoom**: Enhanced image viewing

## Resources

- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev Mobile Best Practices](https://web.dev/mobile/)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [WCAG Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
