# Execution Report

## Context
Summarize what was implemented in the last execution session.
This is for fast judging and fast context reload.

## Inputs
Read:
- the plan that was executed (from `docs/plans/`)
- `DEVLOG.md` (latest entry)
- `git diff --stat`
- test output if available

## Output file
Create:
- `docs/reports/execution-<UTC-date>.md`

## Report format
- Date (UTC)
- What changed (3–10 bullets)
- Slices completed
- Tests run (exact commands + results)
- Demo path status
- Known gaps / risks
- Next steps (1–5)

## Required doc update
Append a DEVLOG.md entry only if one was not added during execute.

## Output
- File path
- Ready-to-paste markdown
- Recommended next steps (do not execute commands)
