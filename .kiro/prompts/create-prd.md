# Create PRD

## Objective
Create or refresh the PRD so it matches the real project and stays demo-focused.

## Non-negotiables
- Keep scope brutal. MVP first.
- No paid services required in default local mode.
- Settings must stay simple to avoid bug farms.

## Inputs
Read:
- `.kiro/steering/product.md` (if exists)
- `.kiro/steering/tech.md` (if exists)
- `.kiro/steering/structure.md` (if exists)
- `README.md`
- `DEVLOG.md`
- any existing PRD in `docs/prd/`

## Output file
Write / update:
- `docs/prd/[project-name].md`

## PRD must include
- One-liner
- Problem
- Target user
- Main outcome for the user
- Key differentiators
- MVP features (3–5)
- Core user flow (demo path)
- Acceptance criteria (testable)
- Out of scope

## Required repo updates
- If PRD changes product decisions, also update `.kiro/steering/product.md`.
- Append to `DEVLOG.md` (UTC):
  - What changed (docs)
  - What was tested (usually N/A)
  - What's next

## Output
- File path
- Ready-to-paste markdown
- Recommended next steps (do not execute commands)
