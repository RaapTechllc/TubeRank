# Kiro Prompt Pack

Reusable prompts for spec-driven development workflows.

## Core Development Loop
Repeat per feature:
1. `@prime` — load context, verify repo health (no code changes)
2. `@plan-feature <feature>` — create requirements → design → tasks
3. `@next-task` — execute one task at a time
4. `@code-review` — quality review after implementation
5. `@system-review` — compare plan vs reality, catch drift

## Utility Prompts
- `@quickstart` — bootstrap a fresh repo with docs and tests
- `@create-prd` — generate or refresh product requirements doc
- `@execution-report` — summarize an implementation session
- `@rca <issue>` + `@implement-fix <issue>` — analyze and fix bugs
- `@memory` — save session progress for handoff

## Quality & Review
- `@code-review-hackathon` — demo/submission readiness scoring
- `@a11y-audit` — WCAG 2.1 AA accessibility audit
- `@security-audit` — OWASP-based security review
- `@responsive-check` — test responsive behavior across breakpoints
- `@deploy-checklist` — pre-deployment verification

## Styling & Optimization
- `@component-style` — improve component styling with Tailwind/shadcn
- `@ui-review` — visual design review with actionable feedback
- `@db-optimize` — database schema and query optimization
- `@test-coverage` — analyze and improve test coverage

## House Rules
1. Every code change adds or updates tests for the affected path
2. Every prompt that changes the repo must update:
   - `DEVLOG.md` (append, UTC timestamp)
   - `README.md` (only if setup/run/env/deploy changed)
3. Keep scope minimal — MVP first, polish later

## Self-Improving System
If you notice repeated friction:
1. Update the relevant prompt in `.kiro/prompts/`
2. Log the change in `DEVLOG.md`
3. Consider adding a new prompt if the pattern is common
