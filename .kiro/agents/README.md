# TubeRank Agents

Specialized agents for multi-agent development workflows.

## Available Agents

| Agent | Specialty | Best For |
|-------|-----------|----------|
| `orchestrator` | Workflow coordination | Feature planning, task delegation |
| `code-surgeon` | Code review, security | Quality assurance, refactoring |
| `test-architect` | Testing, coverage | Test generation, coverage analysis |
| `frontend-designer` | UI/UX, accessibility | Visual work, responsive design |
| `db-wizard` | Database, queries | Schema design, optimization |
| `devops-automator` | CI/CD, deployment | Infrastructure, pipelines |
| `doc-smith` | Documentation | READMEs, API docs |
| `security-specialist` | Security audits | OWASP checks, hardening |
| `agent-creator` | Agent design | Creating new custom agents |

## Usage

```bash
# Start the orchestrator
kiro-cli --agent orchestrator

# Run a specific specialist
kiro-cli --agent code-surgeon
kiro-cli --agent frontend-designer
```

## Agent Features

### Hooks
All agents include:
- **agentSpawn**: Injects context (PLAN.md, PROGRESS.md, git status)
- **stop**: Validates changes before completion accepted

### Completion Protocol
Agents signal completion with:
```
<promise>DONE</promise>
```

The stop hook validates this claim - saying DONE without passing validation continues the loop.

## Creating Custom Agents

1. Copy `.kiro/agents/templates/specialist-base.json`
2. Customize name, prompt, tools, and permissions
3. Or use `kiro-cli --agent agent-creator`

## Agent Configuration Schema

```json
{
  "name": "agent-name",
  "description": "What this agent does",
  "prompt": "System prompt defining behavior",
  "model": "auto",
  "tools": ["read", "write", "glob", "grep", "shell"],
  "allowedTools": ["read", "write", "glob", "grep", "shell:pnpm"],
  "resources": ["file://CLAUDE.md", "file://PROGRESS.md"],
  "toolsSettings": {
    "read": { "allowedPaths": ["./app/**"] },
    "write": { "allowedPaths": ["./app/**"] }
  },
  "hooks": {
    "agentSpawn": [{ "command": "...", "timeout_ms": 5000 }],
    "stop": [{ "command": "...", "timeout_ms": 10000 }]
  }
}
```
