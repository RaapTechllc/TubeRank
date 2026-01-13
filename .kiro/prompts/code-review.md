# Code Review

Review recent code changes for quality, security, and maintainability.

## Review Focus

### 1. Code Quality
- Readable and well-named variables/functions
- No duplicated logic (DRY principle)
- Appropriate abstraction level
- Single responsibility per function/component
- Clear control flow

### 2. Error Handling
- Proper try/catch blocks with specific error types
- Meaningful error messages for debugging
- Graceful degradation for users
- Error boundaries in React components
- API error responses follow consistent format

### 3. Type Safety
- No `any` types without justification
- Proper null/undefined handling (optional chaining, nullish coalescing)
- Correct type assertions with runtime checks where needed
- Zod or similar for runtime validation at boundaries

### 4. Performance
- No unnecessary re-renders (check deps arrays)
- Efficient data fetching (no waterfalls, proper caching)
- Proper memoization (useMemo, useCallback where beneficial)
- Lazy loading for heavy components
- Database queries are indexed and paginated

### 5. Security
- Input validation on all user inputs
- No exposed secrets or API keys
- Safe data handling (sanitization, escaping)
- Auth checks on protected routes/APIs
- Rate limiting on sensitive endpoints

### 6. Accessibility
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation works
- Color contrast meets WCAG AA

## Workflow

1. Run `git diff` or `git diff HEAD~1` to see recent changes
2. Focus on modified files only
3. Check for patterns across multiple files
4. Prioritize findings: Critical → Warnings → Suggestions

## Output Format

### Critical (Must Fix)
- **File**: `path/to/file.ts:42`
- **Issue**: [Description]
- **Fix**: [Specific code suggestion]

### Warnings (Should Fix)
- **File**: `path/to/file.ts:15`
- **Issue**: [Description]
- **Suggestion**: [Improvement]

### Suggestions (Nice to Have)
- [Pattern or improvement opportunity]

## Quick Commands
```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Test
npm test
```
