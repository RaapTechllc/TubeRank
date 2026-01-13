# UI Review

Review the current page for design issues and provide actionable feedback.

## Process

### 1. Navigate to the Page
- Ensure the development server is running
- Navigate to the specified URL or component
- Note the current state before analysis

### 2. Visual Analysis

**Layout & Spacing**
- [ ] Consistent spacing (padding, margins, gaps)
- [ ] Proper alignment (flex/grid layouts)
- [ ] Visual hierarchy is clear
- [ ] Content is well-organized
- [ ] No awkward empty spaces

**Typography**
- [ ] Font sizes create clear hierarchy
- [ ] Line heights are readable (1.4-1.6 for body)
- [ ] Line lengths are comfortable (60-80 characters)
- [ ] Font weights used purposefully
- [ ] Text is legible at all sizes

**Color & Contrast**
- [ ] Color palette is consistent
- [ ] Contrast ratios meet WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Colors convey meaning consistently
- [ ] Dark mode works (if applicable)

**Interactive Elements**
- [ ] Buttons look clickable
- [ ] Links are distinguishable
- [ ] Hover states provide feedback
- [ ] Focus states are visible
- [ ] Disabled states are clear

### 3. Responsive Behavior

Test at each breakpoint:
- **Mobile**: 375px (iPhone SE)
- **Tablet**: 768px (iPad)
- **Desktop**: 1280px (laptop)
- **Large**: 1920px (full HD)

Check for:
- [ ] No horizontal scrolling
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] Text readable without zooming (≥16px)
- [ ] Images scale appropriately
- [ ] Navigation adapts to screen size

### 4. Component Consistency

- [ ] Similar elements styled consistently
- [ ] Design system patterns followed
- [ ] shadcn/ui components used where available
- [ ] Custom components match design language

### 5. User Experience

- [ ] Primary action is obvious
- [ ] Error states are helpful
- [ ] Loading states prevent confusion
- [ ] Empty states guide users
- [ ] Success feedback is clear

## Output Format

### Critical Issues (Must Fix)
```markdown
**Issue**: [Description]
**Location**: [Component/element]
**Current**: `[current classes or code]`
**Fix**: `[suggested classes or code]`
**Why**: [Explanation]
```

### Important Issues (Should Fix)
```markdown
**Issue**: [Description]
**Suggestion**: [Improvement]
```

### Nice-to-Have (Polish)
```markdown
**Opportunity**: [Description]
**Enhancement**: [Suggestion]
```

## Common Fixes

**Inconsistent spacing**
```tsx
// Before: Mixed spacing
<div className="p-2 mb-4">
<div className="p-4 mb-2">

// After: Consistent spacing
<div className="p-4 mb-4">
<div className="p-4 mb-4">
```

**Missing hover states**
```tsx
// Before
<div className="bg-card rounded-lg p-4">

// After
<div className="bg-card rounded-lg p-4 hover:shadow-md transition-shadow">
```

**Poor mobile layout**
```tsx
// Before: Fixed columns
<div className="grid grid-cols-3 gap-4">

// After: Responsive columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

**Low contrast text**
```tsx
// Before: Hard to read
<p className="text-gray-400">

// After: Accessible
<p className="text-gray-600 dark:text-gray-300">
```

## Summary Template

```markdown
## UI Review: [Page/Component Name]

**Date**: [UTC timestamp]
**Viewport Tested**: [Sizes]

### Overall Assessment
[Brief summary of the UI quality]

### Priority Fixes
1. [Most important issue]
2. [Second priority]
3. [Third priority]

### Strengths
- [What's working well]

### Screenshots
[If applicable, reference screenshot locations]
```
