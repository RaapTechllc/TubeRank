# Kiro Orchestrator

Multi-agent orchestration framework for TubeRank development.

## Quick Start

```bash
# Start the orchestrator
kiro-cli --agent orchestrator

# PRD → Plan → Implement workflow
@create-prd "feature description"
@create-plan .kiro/specs/prds/X.prd.md
@implement-plan .kiro/specs/plans/X.plan.md
```

## Folder Structure

```
.kiro/
├── agents/           # Agent configurations
│   ├── orchestrator.json
│   ├── code-surgeon.json
│   ├── test-architect.json
│   ├── frontend-designer.json
│   ├── db-wizard.json
│   ├── devops-automator.json
│   ├── doc-smith.json
│   ├── security-specialist.json
│   ├── agent-creator.json
│   └── templates/    # Base templates
├── prompts/          # Reusable prompts (@command)
├── steering/         # Project context
├── scripts/          # Validation scripts
├── validation/       # Validation config
├── specs/            # Feature specifications
│   ├── prds/        # Product requirements
│   └── plans/       # Implementation plans
└── docs/            # Extended documentation
```

## Key Files (Project Root)

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Core rules for all agents |
| `LEARNINGS.md` | Captured corrections and patterns |
| `PLAN.md` | Task assignments |
| `PROGRESS.md` | Real-time status (single source of truth) |

## Completion Protocol

Agents signal completion with:
```
<promise>DONE</promise>
```

Stop hooks validate before accepting completion.

## Self-Improvement

When corrected, capture the learning:
```
@reflect
```

Or manually add to LEARNINGS.md.
