# Execute Implementation Plan

Execute a plan file and implement all tasks with validation.

## Arguments: $ARGUMENTS

Path to a plan file, e.g.: `.kiro/specs/plans/user-auth-phase-1.plan.md`

## Execution Rules

### 1. Read and Understand
- Read the entire plan file
- Review all context files listed
- Note the CRITICAL gotchas

### 2. Execute Tasks Sequentially

```
┌─────────────────────────────────────────────────────────────┐
│  TASK EXECUTION LOOP                                        │
├─────────────────────────────────────────────────────────────┤
│  1. Read task requirements                                  │
│  2. Implement the task                                      │
│  3. Run task-specific validation                            │
│  4. If validation fails → fix and retry                     │
│  5. Check off the task in the plan file                     │
│  6. Update PROGRESS.md                                      │
│  7. Move to next task                                       │
└─────────────────────────────────────────────────────────────┘
```

### 3. Validate Continuously

After EVERY file change:
```bash
pnpm lint && pnpm typecheck
```

Do NOT proceed if these fail.

### 4. Completion

When all tasks done:

1. Run final validation:
```bash
pnpm lint && pnpm typecheck && pnpm test
```

2. Update the source PRD phase status to COMPLETE

3. Output:
```
<promise>DONE</promise>
```

## IMPORTANT

- Do NOT skip validation steps
- Do NOT mark tasks complete before validation passes
- Do NOT output `<promise>DONE</promise>` until ALL criteria met
