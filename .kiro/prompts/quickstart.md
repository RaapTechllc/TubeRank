# Quick Start Wizard

## Welcome
This wizard bootstraps a development-ready repository.

Goal:
- Local mode works with minimal external dependencies.
- Deployable path exists.
- Docs and prompts exist from day one.
- Tests protect the demo path.

## What I will create or verify
- `.kiro/steering/*`
- `.kiro/prompts/*`
- `docs/prd/*`, `docs/plans/*`
- `DEVLOG.md`, `README.md`
- App scaffold
- Database setup
- Test framework setup

## Step 1 — Gather inputs (keep it simple)
Ask only:
1) Project name
2) Confirm stack (e.g., Next.js App Router + Tailwind + database + test framework)
3) Confirm DB mode (local vs cloud)

## Step 2 — Repository hygiene check
**CRITICAL**: Before scaffolding, verify:
1. `.gitignore` exists with these entries:
   - `/node_modules`
   - `/.next/`
   - `.env*.local`
   - `/coverage`
   - `*.tsbuildinfo`
2. If `.gitignore` is missing, CREATE IT FIRST before any other commands
3. If `node_modules/` is already committed, STOP and warn user

## Step 3 — Scaffold commands (output exact commands)
Provide the exact commands to run, in order.
Use safe defaults appropriate for the chosen stack.

## Step 4 — Write baseline docs (repo artifacts)
Ensure these exist with project-specific content:
- `.kiro/steering/product.md`
- `.kiro/steering/tech.md`
- `.kiro/steering/structure.md`
- `docs/prd/[project-name].md`
- `docs/plans/mvp-implementation.md`
- `DEVLOG.md` (first entry, UTC)
- `README.md` (setup + run + env + deploy)

## Step 5 — Minimal working demo (Slice 0)
Create a minimal UI route that:
- renders the main page
- shows a primary CTA (can be stub)
- runs without complex env vars

## Step 6 — Add test guardrail
Create a test that:
- opens home page
- verifies key content is visible
- clicks through the primary CTA path (even if stubbed)

## Output
- A checklist of what was created
- Any missing items
- The next command to run

## Required doc update
Append a DEVLOG.md entry (UTC) describing what was scaffolded and what was tested.
Update README.md if commands differ from typical defaults.
