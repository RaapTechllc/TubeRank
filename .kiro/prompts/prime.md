# Prime - Project Context Loader

Load all project context and provide a comprehensive overview.

## Non-negotiables
- Do not start long-running processes (no `pnpm dev`, no `npm run dev`).
- If runtime verification is needed, ask the user to run the dev server in a separate terminal.

## Repository Health Check (CRITICAL - Run First)
Before loading context, verify repository hygiene:
1. **Check `.gitignore` exists** and contains:
   - `/node_modules`
   - `/.next/`
   - `.env*.local`
   - `/coverage`
   - `*.tsbuildinfo`
2. **If `.gitignore` is missing**: STOP and create it immediately
3. **Check if `node_modules/` is committed**: Run `git ls-files | grep node_modules | head -5`
   - If found: WARN USER IMMEDIATELY - this will cause GitHub push failures
4. **Check for other common mistakes**:
   - `.env` or `.env.local` committed (security risk)
   - Build artifacts (`.next/`, `dist/`, `build/`) committed

## Context Loading
Review these key documents (if they exist):
- `.kiro/steering/product.md` - Product overview and goals
- `.kiro/steering/tech.md` - Technical architecture
- `.kiro/steering/structure.md` - Project organization
- `docs/prd/*.md` - Detailed requirements
- `docs/plans/*.md` - Implementation roadmap
- `DEVLOG.md` - Development timeline
- `README.md` - Project overview

## Project Summary
Provide a concise overview covering:
1. **Purpose**: What the project does
2. **Tech Stack**: Key technologies used
3. **Current Status**: What's been completed
4. **Next Steps**: Immediate development priorities
5. **Key Constraints**: Any important limitations or requirements

## Ready for Development
After loading context, confirm you understand:
- The project's purpose and goals
- The technical architecture decisions
- The MVP scope and priorities
- The testing and deployment strategy

Then ask: "What would you like to work on next?"
