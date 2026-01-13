# Implement Fix: Issue $ARGUMENTS

## Objective
Implement the fix described in the RCA doc:
`docs/rca/issue-$ARGUMENTS.md`

## Non-negotiables
- Keep changes minimal — smallest surface area possible
- Add or update tests so the bug cannot return
- Update DEVLOG.md (UTC) after fixes
- Update README.md only if setup/run/env/deploy changed

## Process

### 1) Load RCA
Read:
- `docs/rca/issue-$ARGUMENTS.md`
- Related code files mentioned in RCA
- Existing tests for affected code

### 2) Implement the Fix
- Patch the smallest surface area
- Avoid adding new settings unless absolutely required
- Follow existing code patterns
- Add inline comments explaining the fix if non-obvious

### 3) Add/Update Tests (Required)
- Unit tests for the specific bug scenario
- Edge cases that could cause similar issues
- E2E test if the bug affects user-facing flows

### 4) Run Validation
```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Run affected tests
npm test -- --grep "related-test-pattern"

# Build check
npm run build
```

### 5) Doc Sync
Append to DEVLOG.md:
```markdown
## [UTC timestamp] - Fix: Issue $ARGUMENTS

**What changed:**
- [File]: [Brief description of change]

**What was tested:**
- [Test file]: [What it verifies]

**What's next:**
- [Any follow-up items]
```

Update README.md if any instructions changed.

### 6) Prompt System Improvement (Optional)
If the bug happened because of workflow gaps:
- Missing validation step → add to relevant prompt
- Missing test type → add to testing guidance
- Log the prompt change in DEVLOG.md

## Output Format

```markdown
## Fix Applied: Issue $ARGUMENTS

**Files Changed:**
- `path/to/file.ts` - [Brief description]

**Tests Added/Updated:**
- `tests/file.test.ts` - [What it tests]

**Validation Results:**
- Type check: ✅
- Lint: ✅
- Tests: ✅
- Build: ✅

**Demo Path Status:** [Working / Needs verification]

**Recommended Next Steps:**
1. [Any follow-up items]
```
