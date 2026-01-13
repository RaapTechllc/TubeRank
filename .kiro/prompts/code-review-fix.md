---
description: "Implement fixes from a code review, with tests and doc sync"
---

# Code Review Fix

## Input: $ARGUMENTS
Provide one of:
- A markdown file path containing findings
- A short list of issues pasted into the prompt

## Mission
Fix issues fast without breaking existing functionality.

## Non-negotiables
- Fix one finding at a time
- Add or update a test for each fix
- Verify build still works
- Update DEVLOG.md after the fix set
- Update README.md only if setup/run/env/deploy changed

## Process

### 1. Parse and Prioritize
Rank findings by severity:
- **P0**: Breaks functionality / data corruption / security risk
- **P1**: Correctness bugs / flaky tests / accessibility issues
- **P2**: Code quality / cleanup / performance

### 2. For Each Fix
```markdown
1. Identify root cause in code
2. Implement minimal patch
3. Add/update tests
4. Run validation:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm test`
```

### 3. Doc Sync
Append to DEVLOG.md:
```markdown
## [UTC timestamp] - Code Review Fixes

**Fixes Applied:**
- [File]: [Brief description]

**Tests Added/Updated:**
- [Test file]: [What it verifies]

**Validation:**
- Type check: ✅/❌
- Lint: ✅/❌
- Tests: ✅/❌
```

## Output Format

```markdown
## Code Review Fixes Applied

### P0 Fixes (Critical)
- [x] [Issue]: [Fix description]

### P1 Fixes (Important)
- [x] [Issue]: [Fix description]

### P2 Fixes (Cleanup)
- [x] [Issue]: [Fix description]

### Validation Results
- Type check: ✅
- Lint: ✅
- Tests: ✅
- Build: ✅

### Remaining Items
- [ ] [Any deferred items with reason]

### Recommended Next Steps
1. [Follow-up action if needed]
```

## Prompt Improvements
If the review revealed a predictable gap:
- Missing test type → Update testing guidance
- Missing validation step → Update relevant prompt
- Log the prompt change in DEVLOG.md
