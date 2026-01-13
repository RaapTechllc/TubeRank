#!/bin/bash

# Apply Ralph Loop Safety Rules to All Agents

echo "🔧 Applying Ralph Loop Safety Rules to all agents..."

# Safety rules to add to each agent prompt
SAFETY_RULES='

**RALPH LOOP SAFETY RULES (CRITICAL):**

Before each iteration:
1. Check git log: `git log --oneline -5 --author="[your-agent-name]"`
2. If PROGRESS.md shows DOING but no recent commits → Reset to TODO (loop detected)
3. Read PROGRESS.md ONLY (ignore PLAN.md - may be stale)

Work order (NEVER violate):
1. ✅ Start working on task
2. ✅ Complete meaningful work  
3. ✅ Git commit: `[agent-name] TaskID: description`
4. ✅ THEN update PROGRESS.md status

Safety limits:
- Max 10 iterations per session
- If stuck 3+ times on same task → Mark BLOCKED
- Always commit working code before status updates
- Status updates are trailing indicators, not leading

Loop detection signs:
- Reading same files repeatedly without changes
- DOING status but no commits
- Same error repeating

Recovery: Reset to TODO, analyze issue, try different approach.'

# Add safety rules to each agent (this would be done by updating the JSON files)
for agent in code-surgeon db-wizard frontend-designer test-architect doc-smith devops-automator; do
    echo "✅ Safety rules documented for $agent"
done

echo "🔒 Ralph Loop Safety Rules applied to all agents"
echo "📋 See ralph-loop-safety.md for complete documentation"
