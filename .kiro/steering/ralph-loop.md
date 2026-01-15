# Ralph Loop Methodology

The Ralph Loop is an autonomous iteration pattern where agents work in cycles until task completion.

## Core Loop

```
┌─────────────────────────────────────────────────────────┐
│                     RALPH LOOP                          │
├─────────────────────────────────────────────────────────┤
│  1. Load task from PLAN.md                              │
│  2. Execute task with available tools                   │
│  3. Validate work (lint, typecheck, test)               │
│  4. Update PROGRESS.md with status                      │
│  5. If not done: Loop back to step 1                    │
│  6. If done: Output <promise>DONE</promise>             │
└─────────────────────────────────────────────────────────┘
```

## Completion Signals

```
<promise>DONE</promise>      # Task/agent complete
<promise>CHECKPOINT</promise> # Pause for review (C-threads)
<promise>COMPLETE</promise>   # Full workflow complete
```

## State Files

| File | Purpose |
|------|---------|
| `PLAN.md` | Task checklist with acceptance criteria |
| `PROGRESS.md` | Real-time status (single source of truth) |
| `LEARNINGS.md` | Captured corrections and patterns |

## Stop Hooks

Stop hooks validate before completion is accepted:

```json
{
  "hooks": {
    "stop": [
      {
        "command": "bash .kiro/scripts/validate-changes.sh",
        "on_fail": "continue"
      }
    ]
  }
}
```

## Best Practices

1. **Clear Completion Criteria** - Define exactly what "done" means
2. **Incremental Progress** - Update PROGRESS.md after each action
3. **Commit Before Status** - Git commit, then update status
4. **Validate Continuously** - Run lint/typecheck after changes

## Stall Detection

If no progress for 15+ minutes:
- Check for blocking errors
- Try alternative approach
- Mark as BLOCKED if stuck 3+ times
