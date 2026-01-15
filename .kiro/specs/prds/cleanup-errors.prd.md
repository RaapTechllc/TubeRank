# TubeRank Cleanup Plan

**Created:** 2026-01-15
**Status:** ACTIVE
**Goal:** Zero TypeScript errors, zero lint errors

## Summary

| Category | Count | Priority |
|----------|-------|----------|
| Sentry module missing | 6 errors | P1 - Critical |
| Type errors | 6 errors | P1 - Critical |
| `no-explicit-any` | ~45 errors | P2 - High |
| `no-require-imports` | ~26 errors | P2 - High |
| Other lint | ~9 errors | P3 - Medium |

**Total Files Affected:** 73

---

## Phase 1: Fix Critical TypeScript Errors

### Task 1.1: Reinstall node_modules
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Task 1.2: Fix Supabase export
**File:** `lib/supabase/server.ts`
```typescript
// Add at end of file
export { createServerClient as createClient }
```

### Task 1.3: Fix health route
**File:** `app/api/health/detailed/route.ts`
- Line 2: Change import to `createServerClient`
- Line 43: Fix return type to include `heapUsedMB`

### Task 1.4: Fix profile-form resolver
**File:** `components/profiles/profile-form.tsx`
- Make `type` required in Zod schema with `.default('custom')`

### Task 1.5: Fix rate-limit undefined
**File:** `lib/middleware/rate-limit.ts:79`
- Add optional chaining or null check

### Task 1.6: Fix focus.ts types
**File:** `lib/utils/focus.ts:69,71`
- Change `undefined` to `null` in returns

### Task 1.7: Fix Sentry implicit any
**Files:**
- `sentry.client.config.ts:8` - Add `Event` type
- `lib/monitoring/sentry.ts:9` - Add `Event` type
- `lib/error-tracking.ts:12,30` - Add `Scope` type

---

## Phase 2: Fix Lint Errors by File

### 2.1 App Routes (17 files)

| File | Issues |
|------|--------|
| `app/(main)/analytics/channels/page.tsx` | require-imports |
| `app/(main)/analytics/page.tsx` | require-imports |
| `app/(main)/analytics/velocity/page.tsx` | require-imports |
| `app/(main)/analytics/workflow/page.tsx` | require-imports |
| `app/(main)/dashboard/page.tsx` | require-imports |
| `app/(main)/profile/[id]/page.tsx` | require-imports |
| `app/(main)/profile/new/page.tsx` | require-imports |
| `app/api/analytics/*.ts` (5 files) | no-explicit-any |
| `app/api/cards/[id]/route.ts` | no-explicit-any |
| `app/api/cards/batch/route.ts` | no-explicit-any |
| `app/api/cron/ingest-channels/route.ts` | no-explicit-any |
| `app/api/digest/route.ts` | no-explicit-any |
| `app/api/profiles/[id]/*.ts` | no-explicit-any |
| `app/api/rss/refresh/*.ts` | no-explicit-any |
| `app/api/settings/*.ts` | no-explicit-any, require-imports |

### 2.2 Components (14 files)

| File | Issues |
|------|--------|
| `components/analytics/FilterBar.tsx` | empty-object-type |
| `components/analytics/charts/*.tsx` (4 files) | no-explicit-any, impure-render |
| `components/board/video-card.tsx` | unescaped-entities |
| `components/error-boundary.tsx` | no-explicit-any |
| `components/layout/header.tsx` | setState-in-effect |
| `components/profiles/profile-form.tsx` | type errors |
| `components/ui/input.tsx` | empty-object-type |
| `components/ui/label.tsx` | empty-object-type |
| `components/ui/loading.tsx` | impure-render |
| `components/ui/select.tsx` | empty-object-type |
| `components/ui/textarea.tsx` | empty-object-type |
| `components/ui/toast.tsx` | variable-access |

### 2.3 Lib (8 files)

| File | Issues |
|------|--------|
| `lib/error-tracking.ts` | no-explicit-any |
| `lib/middleware/auth.ts` | no-explicit-any |
| `lib/middleware/rate-limit.ts` | undefined-check |
| `lib/rate-limit/middleware.ts` | no-explicit-any |
| `lib/rate-limit/types.ts` | empty-object-type |
| `lib/repositories/*.ts` (2 files) | no-explicit-any |
| `lib/rss/youtube-parser.ts` | no-explicit-any |
| `lib/services/*.ts` (2 files) | no-explicit-any |

### 2.4 Tests (12 files)

| File | Issues |
|------|--------|
| `tests/analytics/performance.test.ts` | no-explicit-any |
| `tests/api/*.test.ts` (9 files) | require-imports, no-explicit-any, unused-vars |
| `tests/components/kanban-board.test.tsx` | no-explicit-any, unused-vars |
| `tests/integration/rss-processing.test.ts` | unused-vars |
| `tests/rss/process-channel-job.test.ts` | no-explicit-any |

### 2.5 Scripts (1 file)

| File | Issues |
|------|--------|
| `scripts/test-sentry.js` | require-imports |

---

## Phase 3: Specific Fixes

### 3.1 Empty Interfaces → Type Aliases
```typescript
// Before
interface Props extends BaseProps {}

// After  
type Props = BaseProps
```

**Files:** 6 UI components

### 3.2 Require → ES Imports
```typescript
// Before
const { NextResponse } = require('next/server')

// After
import { NextResponse } from 'next/server'
```

**Files:** ~26 occurrences

### 3.3 Any → Proper Types
```typescript
// Before
const data: any = await response.json()

// After
const data: unknown = await response.json()
// or
const data = await response.json() as SpecificType
```

**Files:** ~45 occurrences

### 3.4 React Render Issues
- Move impure functions to `useEffect`
- Fix setState timing in effects

**Files:** 4 components

---

## Execution Commands

```bash
# Phase 1: Critical
pnpm install
pnpm typecheck  # Verify 0 errors

# Phase 2: Lint fixes
pnpm lint --fix  # Auto-fix what's possible
pnpm lint        # Check remaining

# Phase 3: Manual fixes
# Edit files as needed
pnpm lint && pnpm typecheck

# Final validation
pnpm test
pnpm build
```

---

## Success Criteria

- [ ] `pnpm typecheck` - 0 errors
- [ ] `pnpm lint` - 0 errors  
- [ ] `pnpm test` - All pass
- [ ] `pnpm build` - Success
