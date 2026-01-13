# Accessibility Audit

Perform a comprehensive WCAG 2.1 AA accessibility audit.

## Audit Checklist

### 1. Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skipping)
- [ ] Landmarks used (header, nav, main, aside, footer)
- [ ] Buttons are `<button>`, not clickable divs
- [ ] Links have meaningful text (not "click here")
- [ ] Lists use `<ul>`, `<ol>`, `<dl>` appropriately
- [ ] Tables have proper headers and captions

### 2. Images & Media
- [ ] All `<img>` have descriptive alt text
- [ ] Decorative images have `alt=""` or `role="presentation"`
- [ ] SVG icons have `aria-label` or accessible text
- [ ] Videos have captions/transcripts
- [ ] Audio has transcripts

### 3. Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical (follows visual order)
- [ ] Focus indicators are visible
- [ ] No keyboard traps
- [ ] Skip links for main content
- [ ] Modal focus is trapped correctly

### 4. Color & Contrast
- [ ] Text contrast ≥ 4.5:1 (normal text)
- [ ] Text contrast ≥ 3:1 (large text, 18px+ or 14px+ bold)
- [ ] UI component contrast ≥ 3:1
- [ ] Color is not the only means of conveying info
- [ ] Focus states have sufficient contrast

### 5. Forms
- [ ] All inputs have associated `<label>`
- [ ] Required fields indicated (not just by color)
- [ ] Error messages are descriptive and associated
- [ ] Form validation is accessible
- [ ] Autocomplete attributes used where appropriate

### 6. ARIA
- [ ] ARIA used only when HTML semantics insufficient
- [ ] `aria-label` / `aria-labelledby` for unlabeled elements
- [ ] `aria-expanded` on collapsible elements
- [ ] `aria-hidden` not on focusable elements
- [ ] Live regions for dynamic content (`aria-live`)
- [ ] Roles are appropriate and not redundant

### 7. Motion & Animation
- [ ] Respects `prefers-reduced-motion`
- [ ] No auto-playing animations that can't be paused
- [ ] No content that flashes more than 3 times/second

## Testing Tools

```bash
# Browser extensions
- axe DevTools
- WAVE
- Lighthouse (Chrome DevTools)

# Automated testing
npm install -D @axe-core/playwright  # For Playwright
npm install -D jest-axe              # For Jest
```

## Report Format

### Critical (Blocks Usage)
```markdown
**Issue**: [Description]
**WCAG**: [Criterion number and name]
**Location**: `path/to/file.tsx:42`
**Impact**: [Who is affected and how]
**Fix**: [Specific code change]
```

### Important (Creates Barriers)
```markdown
**Issue**: [Description]
**WCAG**: [Criterion]
**Fix**: [Suggestion]
```

### Recommended (Best Practices)
```markdown
**Issue**: [Description]
**Suggestion**: [Improvement]
```

## Common Fixes

**Missing alt text**
```tsx
// Before
<img src="product.jpg" />

// After
<img src="product.jpg" alt="Blue cotton t-shirt, front view" />
```

**Low contrast**
```tsx
// Before: 2.8:1 contrast
<button className="bg-blue-300 text-blue-100">

// After: 7:1 contrast
<button className="bg-blue-600 text-white">
```

**Missing label**
```tsx
// Before
<input type="email" placeholder="Email" />

// After
<label htmlFor="email" className="sr-only">Email</label>
<input id="email" type="email" placeholder="Email" />
```

**Non-semantic button**
```tsx
// Before
<div onClick={handleClick} className="cursor-pointer">

// After
<button onClick={handleClick} type="button">
```

## Summary Template

```markdown
## Accessibility Audit Summary

**Date**: [UTC timestamp]
**Page/Component**: [Name]

### Results
- Critical: X issues
- Important: X issues  
- Recommended: X improvements

### Top Priority Fixes
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

### WCAG 2.1 AA Compliance
[Compliant / Partially Compliant / Non-Compliant]
```
