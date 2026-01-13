#!/bin/bash

# Individual Agent Runner
# Runs a specific agent in Ralph Loop mode

if [ $# -eq 0 ]; then
    echo "Usage: $0 <agent-name>"
    echo "Available agents: code-surgeon, db-wizard, frontend-designer, test-architect, doc-smith, devops-automator"
    exit 1
fi

AGENT_NAME=$1

# Validate agent exists
if [ ! -f ".kiro/agents/$AGENT_NAME.json" ]; then
    echo "❌ Agent '$AGENT_NAME' not found in .kiro/agents/"
    exit 1
fi

echo "🤖 Starting Ralph Loop for agent: $AGENT_NAME"
echo "============================================"

# Check prerequisites
if [ ! -f "PLAN.md" ] || [ ! -f "PROGRESS.md" ]; then
    echo "❌ PLAN.md or PROGRESS.md not found. Run setup first."
    exit 1
fi

echo "📋 Agent will:"
echo "  1. Read PLAN.md and PROGRESS.md"
echo "  2. Pick next TODO/DOING task assigned to $AGENT_NAME"
echo "  3. Implement the task"
echo "  4. Update PROGRESS.md"
echo "  5. Git commit changes"
echo "  6. Repeat until all tasks DONE"
echo ""

# This would typically call the specific agent
echo "Command to start agent:"
echo "kiro-cli chat --agent $AGENT_NAME"
echo ""
echo "Or use your preferred agent runner with:"
echo "Agent: $AGENT_NAME"
echo "Task: Execute Ralph Loop for assigned tasks"
