# Responsive Design Check

Test responsive behavior across breakpoints and identify layout issues.

## Process

1. **Take screenshots at each breakpoint**
   - Mobile: 375px width (iPhone SE)
   - Tablet: 768px width (iPad)
   - Desktop: 1280px width (standard laptop)
   - Large: 1920px width (full HD monitor)

2. **Mobile (< 640px) checks**
   - Text is readable without zooming (minimum 16px)
   - Touch targets are minimum 44x44px
   - No horizontal scrolling
   - Images scale appropriately
   - Navigation is mobile-friendly (hamburger menu or simplified)

3. **Tablet (640px - 1024px) checks**
   - Layout transitions smoothly from mobile
   - Touch targets remain accessible
   - Content uses available space effectively
   - Typography scales appropriately

4. **Desktop (> 1024px) checks**
   - Layout uses grid/multi-column where appropriate
   - Maximum content width prevents overly long lines (60-80 characters)
   - Hover states work correctly
   - No wasted space

5. **Responsive patterns**
   - Check for Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
   - Verify fluid typography (using `clamp()` or responsive sizes)
   - Test container queries if used
   - Verify flexible images and media

## Common Issues and Fixes

**Issue: Text too small on mobile**
- Current: `text-sm` (14px)
- Fix: `text-base md:text-sm` (16px on mobile, 14px on desktop)

**Issue: Fixed width causes horizontal scroll**
- Current: `w-96` (384px fixed)
- Fix: `w-full max-w-sm` (fluid with max width)

**Issue: Same layout on all screen sizes**
- Current: `grid grid-cols-3`
- Fix: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

**Issue: Hidden overflow on mobile**
- Current: Content gets cut off
- Fix: Use `overflow-x-auto` or rethink layout

**Issue: Images don't scale**
- Current: `<img src="..." />`
- Fix: `<img src="..." className="w-full h-auto" />`
