# Root Cause Analysis: Issue $ARGUMENTS

## Objective
Find the true root cause of a bug, not just the symptom.
Then propose the smallest safe fix that keeps the demo path stable.

## Non-negotiables
- Reproduce first, then analyze
- Do not browse the web unless user asks
- Prefer fixing guardrails and tests over adding complexity
- Document everything for future reference

## Inputs
- Issue description (from user or issue tracker)
- Relevant plan file (if any)
- `DEVLOG.md` entries around the break
- Failing tests (E2E or unit)
- Error logs or stack traces

## Process

### 1) Reproduce
Write exact reproduction steps:
```markdown
1. Navigate to [URL]
2. Click [element]
3. Enter [input]
4. Observe [error/unexpected behavior]
```

If possible, encode as an automated test spec.

### 2) Observe
Collect evidence:
- Stack traces (full, not truncated)
- Console logs (browser and server)
- Network requests/responses
- Database state before/after
- Inputs that cause failure
- Inputs that work correctly

### 3) Isolate
Narrow down the cause:
- Which commit introduced the bug? (`git bisect`)
- Which file/function is responsible?
- Is it a data issue, logic issue, or timing issue?
- Does it happen consistently or intermittently?

### 4) Root Cause
Answer these questions:
- **What** actually caused the failure?
- **Why** did it escape earlier checks?
- **What invariant** was violated? (data integrity, state, timing)
- **What assumption** was wrong?

### 5) Fix Options
Provide 2–3 options ranked by:

| Option | Risk | Speed | Long-term Stability |
|--------|------|-------|---------------------|
| A: [Description] | Low/Med/High | Fast/Med/Slow | Good/Fair/Poor |
| B: [Description] | ... | ... | ... |

**Recommended**: Option [X] because [reason]

### 6) Prevention
- Tests to add (specific scenarios)
- Docs to update
- Prompt improvements (if workflow allowed it to slip)
- Code patterns to avoid

## Output File
Create: `docs/rca/issue-$ARGUMENTS.md`

## Output Format

```markdown
# RCA: Issue $ARGUMENTS

## Summary
[One sentence describing the bug and its impact]

## Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Observe: expected vs actual]

## Evidence
- Error: `[error message]`
- File: `path/to/file.ts:42`
- Commit: `[hash]` (if known)

## Root Cause
[Detailed explanation of what went wrong and why]

## Fix Plan
**Recommended**: [Option description]

Files to modify:
- `path/to/file.ts` - [What to change]

## Test Plan
- [ ] Unit test: [Scenario]
- [ ] E2E test: [User flow]

## Rollback Plan
[How to revert if the fix causes issues]

## Prevention
- [ ] Add test for [scenario]
- [ ] Update [doc/prompt] to prevent recurrence
```
