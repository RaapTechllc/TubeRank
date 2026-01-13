#!/bin/bash

# Ralph Loop Agent Configuration Script
# Updates all agent JSON files with Ralph Loop instructions

echo "🔄 Configuring Ralph Loop agents..."

# Add Ralph Loop resources to all agents
for agent in code-surgeon db-wizard frontend-designer test-architect doc-smith devops-automator; do
    echo "Updating $agent..."
    
    # Add PLAN.md and PROGRESS.md to resources if not already present
    jq '.resources += ["file://PLAN.md", "file://PROGRESS.md"] | .resources |= unique' \
        ".kiro/agents/$agent.json" > ".kiro/agents/$agent.json.tmp" && \
        mv ".kiro/agents/$agent.json.tmp" ".kiro/agents/$agent.json"
    
    # Add write access to PROGRESS.md
    jq '.toolsSettings.write.allowedPaths += ["./PROGRESS.md"] | .toolsSettings.write.allowedPaths |= unique' \
        ".kiro/agents/$agent.json" > ".kiro/agents/$agent.json.tmp" && \
        mv ".kiro/agents/$agent.json.tmp" ".kiro/agents/$agent.json"
done

echo "✅ All agents configured for Ralph Loop system"
