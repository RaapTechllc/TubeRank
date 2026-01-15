# Create Implementation Plan from PRD

Generate a detailed implementation plan for the next pending phase.

## Arguments: $ARGUMENTS

Path to a PRD file, e.g.: `.kiro/specs/prds/user-auth.prd.md`

## Process

1. **Read the PRD** at the specified path
2. **Find the next PENDING phase**
3. **Research the codebase** for context
4. **Create detailed plan** with tasks, validation, and gotchas

## Output: Save to `.kiro/specs/plans/{feature}-phase-{n}.plan.md`

## Plan Template

```markdown
# Implementation Plan: {Feature} - Phase {N}

**Source PRD:** {path}
**Phase:** {N} of {total}
**Status:** IN_PROGRESS

## Phase Goal
{What this phase accomplishes}

## Files to Modify
- `path/to/file.ts` - {what changes}

## Files to Create
- `path/to/new.ts` - {purpose}

## Tasks

### Task 1: {Name}
- [ ] Subtask 1.1
- [ ] Subtask 1.2
- **Validation:** `pnpm typecheck`

### Task 2: {Name}
- [ ] Subtask 2.1
- **Validation:** `pnpm test`

## Known Gotchas
> CRITICAL: {Must handle this}

## Validation Loop

After Each Task:
```bash
pnpm lint && pnpm typecheck
```

## Completion Criteria
- [ ] All tasks checked off
- [ ] All validation commands pass
```
