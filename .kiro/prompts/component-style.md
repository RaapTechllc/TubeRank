# Component Styling Improvement

Improve the styling of a specific component using shadcn/ui patterns and Tailwind best practices.

## Process

1. **Read current component**
   - Examine the component code
   - Identify the component type (button, card, form, etc.)
   - Note current styling approach

2. **Analyze existing patterns**
   - Search for similar components in the codebase
   - Identify the design system patterns being used
   - Check if shadcn/ui components are available
   - Review Tailwind configuration for custom colors/spacing

3. **Identify improvements**
   - Inconsistencies with design system
   - Missing interactive states (hover, focus, active, disabled)
   - Accessibility issues
   - Responsive behavior
   - Dark mode compatibility

4. **Apply shadcn/ui patterns**
   - Use shadcn/ui component structure if available
   - Apply the project's variant patterns
   - Use the `cn()` utility for conditional classes
   - Follow the established prop API

5. **Tailwind best practices**
   - Use semantic spacing scale (4, 8, 12, 16, 24, 32px)
   - Prefer utility classes over custom CSS
   - Use Tailwind's color palette consistently
   - Group related utilities (layout, spacing, colors, typography)
   - Use responsive prefixes consistently

6. **Dark mode**
   - Add `dark:` variants where needed
   - Test contrast in both light and dark modes
   - Use CSS variables from the theme if available

7. **Interactive states**
   - Add `hover:` for pointer devices
   - Add `focus:` and `focus-visible:` for keyboard
   - Add `active:` for click feedback
   - Add `disabled:` for disabled states
   - Use `transition-*` for smooth state changes

## Example Improvements

**Before:**
```tsx
<button
  className="bg-blue-500 text-white px-4 py-2 rounded"
  onClick={handleClick}
>
  Click me
</button>
```

**After:**
```tsx
<button
  className={cn(
    "inline-flex items-center justify-center rounded-md",
    "px-4 py-2 text-sm font-medium",
    "bg-blue-600 text-white",
    "hover:bg-blue-700 focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
    "active:bg-blue-800 disabled:pointer-events-none disabled:opacity-50",
    "transition-colors duration-200",
    "dark:bg-blue-500 dark:hover:bg-blue-600"
  )}
  onClick={handleClick}
>
  Click me
</button>
```

**Improvements made:**
- Added focus-visible ring for keyboard users
- Added hover and active states
- Added disabled state styling
- Added dark mode support
- Added smooth transitions
- Used semantic sizing and spacing
- Improved color contrast
