# Next Task

Continue to the next task in the current spec workflow.

## Prerequisites
- Active spec in `.kiro/specs/[feature-name]/`
- `tasks.md` exists with task list
- Previous task completed or this is first task

## Workflow

### 1. Load Context (Minimal)
- Read `tasks.md` to find next uncompleted task
- Read `requirements.md` for acceptance criteria
- Read `design.md` for technical approach
- Read ONLY files relevant to that specific task
- Do NOT load entire codebase

### 2. Execute Task
- Focus on ONE task only
- Follow acceptance criteria exactly
- Match the design document's approach
- Write tests as specified in the task

### 3. Verify
- Check against acceptance criteria
- Run relevant tests
- Ensure no regressions
- Update task status in `tasks.md`

### 4. Report
Brief summary (3-5 lines):
- What was done
- Files changed
- Tests added/updated
- Any issues encountered

Then STOP and wait for confirmation.

## Task Status Format

```markdown
- [x] 1. Task title ✅
- [ ] 2. Current task ← Working on this
- [ ] 3. Next task
```

## Important Rules

1. **ONE task at a time** - Never auto-continue
2. **Wait for confirmation** - Always pause after completing
3. **Keep summaries brief** - No lengthy explanations
4. **Follow the spec** - Don't deviate from design
5. **Test what you build** - Every task should have tests

## Quick Reference

```bash
# Check task status
cat .kiro/specs/[feature]/tasks.md

# Run tests for verification
npm test

# Type check
npx tsc --noEmit
```

## If Blocked

If you encounter an issue:
1. Describe the blocker clearly
2. Suggest 2-3 possible solutions
3. Ask for guidance
4. Do NOT proceed with assumptions
