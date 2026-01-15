# Agent Self-Evolution Protocol

Core principle: **Correct once, never again.**

## Key Files

- `LEARNINGS.md` - Captured corrections (project-level)
- `CLAUDE.md` - Applied rules agents always follow
- `.kiro/steering/*.md` - Domain-specific guidance

## Capture Triggers

Capture a learning when:
1. User corrects you: "no, use X not Y"
2. You retry the same task multiple times
3. An approach fails and you try another
4. User expresses a preference

## Learning Types

| Type | Marker | Example |
|------|--------|---------|
| Correction | `CORRECTION:` | "Use pnpm not npm" |
| Preference | `PREFER:` | "Always use TypeScript strict mode" |
| Pattern | `PATTERN:` | "Run lint before commit" |
| Anti-pattern | `AVOID:` | "Don't use any types" |

## Self-Reflection (RBT)

At session end, analyze using Roses-Buds-Thorns:

### 🌹 Roses (Strengths)
- What worked well?

### 🌱 Buds (Opportunities)
- What could be improved?

### 🌵 Thorns (Failures)
- What errors occurred?

## Applying Learnings

1. **High-frequency corrections** → Add to CLAUDE.md
2. **Domain-specific patterns** → Add to steering file
3. **Agent-specific learnings** → Update agent's prompt

## Guardrails

- Never modify agent's fundamental purpose
- Maximum 3 prompt additions per session
- All changes must be reversible
- Flag for human review when confidence < 5
