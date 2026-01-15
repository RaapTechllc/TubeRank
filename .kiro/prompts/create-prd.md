# Create Product Requirement Document

Create a structured PRD with implementation phases for: $ARGUMENTS

## Process

1. **Analyze the request** - Understand what's being asked
2. **Research the codebase** - Find relevant files, patterns, dependencies
3. **Create the PRD** with all sections below

## Output: Save to `.kiro/specs/prds/{feature-slug}.prd.md`

## PRD Template

```markdown
# PRD: {Feature Name}

**Created:** {date}
**Status:** ACTIVE

## Goal
{What are we building? One paragraph max.}

## Why
{Business value, user impact. Why now?}

## What
{Detailed feature description}

### Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Out of Scope
- Item 1

## Implementation Phases

| Phase | Description | Status | Dependencies |
|-------|-------------|--------|--------------|
| 1 | {description} | PENDING | None |
| 2 | {description} | PENDING | Phase 1 |

### Phase Details

#### Phase 1: {Name}
- Task 1.1: ...
- Validation: {how to verify}

## Technical Context

### Relevant Files
- `path/to/file.ts` - {why relevant}

### Known Gotchas
> CRITICAL: {gotcha}

## Progress Log
| Date | Phase | Update |
|------|-------|--------|
| {date} | - | PRD created |
```
