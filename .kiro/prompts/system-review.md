# System Review

## Purpose
Compare:
- the plan
- the code that exists
- what was actually tested
- what the demo currently does

Goal:
Catch drift early and keep the repo submission-ready.

## Non-negotiables
- Do not browse the web unless user asks.
- Use repo facts (plans, git diff, tests).
- Keep scope brutal. Flag scope creep.

## Inputs
- Active plan file (most recent in `docs/plans/`)
- `DEVLOG.md`
- `README.md`
- Current code in affected areas
- Test specs

## Review Steps

### 1) Plan vs implementation
- List plan slices
- Mark each as: Done / Partial / Not started
- For Partial: what is missing to meet acceptance criteria

### 2) Demo path status
Confirm the golden path works end-to-end.
If any step is unclear or broken, mark as P0.

### 3) Testing reality
- List tests that exist
- List tests that were run (from DEVLOG)
- Identify missing coverage

### 4) Docs correctness
- README matches current scripts and env vars
- PRD matches current product decisions
- Any new constraints are written down

### 5) Recommendation list
Rank changes:
- P0: demo stability
- P1: correctness and tests
- P2: cleanup

## Output Format

### Status Snapshot
- What works today
- What's broken
- Biggest risk

### Plan Drift Report
- Drift items (bullets)
- Recommended plan updates (file path + exact edits)

### Test Gaps
- Missing unit tests
- Missing E2E specs

### Next steps (1–3)
### Recommended validation (do not execute):
- Build check: `npm run build`
- Type check: `npx tsc --noEmit`
- Lint check: `npm run lint`

## Prompt Improvements (optional)
If drift happened because the plan was unclear or execute skipped steps,
recommend a small prompt change to prevent it next time.
