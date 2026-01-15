# Project Context

## What This Is
TubeRank - YouTube content intelligence dashboard for triaging and curating video content through RSS feeds.

## Tech Stack
- Next.js 16+ (async route params)
- React 19, TypeScript, Zod 4+
- Supabase (PostgreSQL + Auth)
- Tailwind CSS, @dnd-kit for drag-drop
- Vitest for testing

## Key Commands
```bash
# Development
pnpm dev

# Validation
pnpm lint
pnpm typecheck
pnpm test

# Start orchestrator
kiro-cli --agent orchestrator

# PRD → Plan → Implement workflow
@create-prd "feature description"
@create-plan .kiro/specs/prds/X.prd.md
@implement-plan .kiro/specs/plans/X.plan.md
```

## Critical Files
- `.kiro/specs/` - Feature specifications
- `PROGRESS.md` - Real-time status (single source of truth)
- `PLAN.md` - Task assignments
- `.kiro/steering/` - Project context

## Completion Protocol
Agents MUST output when done:
```
<promise>DONE</promise>
```

**IMPORTANT:** The stop hook validates this claim. Saying DONE without passing validation will continue the loop.

## Validation Gates (Enforced by Stop Hook)
Before `<promise>DONE</promise>` is accepted:

```bash
# Level 1: Syntax (REQUIRED)
pnpm lint && pnpm typecheck

# Level 2: Unit Tests (REQUIRED)
pnpm test
```

## Framework Gotchas

### Next.js 16+
Route params are async:
```typescript
type Params = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Params) {
  const { id } = await params
}
```

### Zod 4+
Record requires explicit key type:
```typescript
z.record(z.string(), z.unknown())  // Not z.record(z.unknown())
```

## Constraints
- Execute ONE task at a time
- STOP and wait for approval between phases
- Validate before marking complete
- Commit before updating status

## Self-Improvement
When corrected, capture the learning:
```bash
./.kiro/workflows/self-improve.sh add correction "description"
```

At session end, use `@reflect` to analyze and capture learnings.
