# TubeRank Project Plan

## Current Focus: Error Cleanup

**PRD:** `.kiro/specs/prds/cleanup-errors.prd.md`
**Goal:** Zero TypeScript errors, zero lint errors

---

## Phase 1: Critical TypeScript Fixes

### Task 1.1: Reinstall node_modules
**Agent:** devops-automator
**Time:** 5 min
**Status:** TODO

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Acceptance Criteria:**
- [ ] `ls node_modules/@sentry` shows Sentry installed
- [ ] No module resolution errors

---

### Task 1.2: Fix Supabase export
**Agent:** code-surgeon
**File:** `lib/supabase/server.ts`
**Time:** 2 min
**Status:** TODO

**Acceptance Criteria:**
- [ ] Export `createClient` alias added
- [ ] `pnpm typecheck 2>&1 | grep "createClient"` returns nothing

---

### Task 1.3: Fix health route types
**Agent:** code-surgeon
**File:** `app/api/health/detailed/route.ts`
**Time:** 5 min
**Status:** TODO

**Acceptance Criteria:**
- [ ] Import fixed
- [ ] Return type includes `heapUsedMB`
- [ ] No TypeScript errors in file

---

### Task 1.4: Fix profile-form resolver
**Agent:** code-surgeon
**File:** `components/profiles/profile-form.tsx`
**Time:** 10 min
**Status:** TODO

**Acceptance Criteria:**
- [ ] Zod schema `type` field has default value
- [ ] Resolver type matches form type
- [ ] No TypeScript errors in file

---

### Task 1.5: Fix rate-limit undefined
**Agent:** code-surgeon
**File:** `lib/middleware/rate-limit.ts`
**Time:** 2 min
**Status:** TODO

**Acceptance Criteria:**
- [ ] Line 79 has null check
- [ ] No TypeScript errors in file

---

### Task 1.6: Fix focus.ts types
**Agent:** code-surgeon
**File:** `lib/utils/focus.ts`
**Time:** 2 min
**Status:** TODO

**Acceptance Criteria:**
- [ ] Lines 69, 71 return `null` not `undefined`
- [ ] No TypeScript errors in file

---

### Task 1.7: Fix Sentry implicit any
**Agent:** code-surgeon
**Files:** `sentry.client.config.ts`, `lib/monitoring/sentry.ts`, `lib/error-tracking.ts`
**Time:** 5 min
**Status:** TODO

**Acceptance Criteria:**
- [ ] All `event` and `scope` params have explicit types
- [ ] No TS7006 errors

---

## Phase 2: Lint Error Fixes

### Task 2.1: Fix empty interfaces (6 files)
**Agent:** code-surgeon
**Time:** 10 min
**Status:** TODO

**Files:**
- `components/analytics/FilterBar.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/select.tsx`
- `components/ui/textarea.tsx`
- `lib/rate-limit/types.ts`

**Acceptance Criteria:**
- [ ] All empty interfaces converted to type aliases
- [ ] `pnpm lint 2>&1 | grep "empty-object-type"` returns nothing

---

### Task 2.2: Fix require imports (26 occurrences)
**Agent:** code-surgeon
**Time:** 20 min
**Status:** TODO

**Acceptance Criteria:**
- [ ] All `require()` converted to ES imports
- [ ] `pnpm lint 2>&1 | grep "no-require-imports"` returns nothing

---

### Task 2.3: Fix explicit any (45 occurrences)
**Agent:** code-surgeon
**Time:** 30 min
**Status:** TODO

**Acceptance Criteria:**
- [ ] All `any` replaced with proper types or `unknown`
- [ ] `pnpm lint 2>&1 | grep "no-explicit-any"` returns nothing

---

### Task 2.4: Fix React render issues (4 files)
**Agent:** frontend-designer
**Time:** 15 min
**Status:** TODO

**Files:**
- `components/analytics/charts/ScoreHistogram.tsx`
- `components/analytics/charts/TrendSparkline.tsx`
- `components/layout/header.tsx`
- `components/ui/loading.tsx`

**Acceptance Criteria:**
- [ ] Impure functions moved to useEffect
- [ ] setState not called synchronously in effects
- [ ] No React lint errors

---

### Task 2.5: Fix remaining lint issues
**Agent:** code-surgeon
**Time:** 10 min
**Status:** TODO

**Issues:**
- Unescaped entities in `video-card.tsx`
- Unused variables in tests
- Variable access in `toast.tsx`

**Acceptance Criteria:**
- [ ] `pnpm lint` passes with 0 errors

---

## Phase 3: Validation

### Task 3.1: Full validation
**Agent:** test-architect
**Time:** 10 min
**Status:** TODO

**Acceptance Criteria:**
- [ ] `pnpm typecheck` - 0 errors
- [ ] `pnpm lint` - 0 errors
- [ ] `pnpm test` - All pass
- [ ] `pnpm build` - Success

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 1 | 7 tasks | 30 min |
| Phase 2 | 5 tasks | 85 min |
| Phase 3 | 1 task | 10 min |
| **Total** | **13 tasks** | **~2 hours** |
