# Ralph Loop Safety Rules

## Critical Rules to Prevent Agent Loops

### 1. Single Source of Truth
**PROGRESS.md is the ONLY authoritative file for task status.**
- PLAN.md is for reference only (may be stale)
- Always read PROGRESS.md first
- All status updates go to PROGRESS.md

### 2. Commit-Before-Status Rule
**NEVER update task status without a corresponding git commit.**

Wrong order (causes loops):
1. ❌ Update PROGRESS.md to DOING
2. ❌ Start working
3. ❌ Get interrupted/fail
4. ❌ Task stuck in DOING forever

Correct order:
1. ✅ Start working on task
2. ✅ Complete meaningful work
3. ✅ Git commit with `[agent-name] TaskID: description`
4. ✅ THEN update PROGRESS.md

### 3. Loop Detection
Before each iteration, check for loops:

```bash
# Check your recent commits
git log --oneline -5 --author="[your-agent-name]"
```

Signs you're in a loop:
- PROGRESS.md shows DOING but you have no recent commits
- You're reading the same files repeatedly without making changes
- Tests keep failing with the same error

### 4. Recovery Protocol
If you detect a loop:

1. Reset task status to TODO in PROGRESS.md
2. Add note: "Loop detected - [brief reason]"
3. Analyze what went wrong
4. Try a different approach
5. If stuck 3+ times, mark as BLOCKED

### 5. Abandoned Task Detection
A task is considered abandoned if:
- Status is DOING
- No commits from assigned agent in the session
- Agent status shows inactive

Recovery: Reset to TODO and restart fresh.

### 6. Git Commit Format
Always use: `[agent-name] TaskID: Brief description`

Examples:
- `[test-architect] T1: Add unit tests for profiles API`
- `[db-wizard] B1: Fix N+1 queries in RSS processing`
- `[frontend-designer] UI1: Implement responsive Kanban`

### 7. Safety Limits
- Maximum 10 iterations per session
- If stuck on same task 3+ times, mark as BLOCKED
- Always commit working code, even if incomplete
- Document blockers clearly for human review

## Implementation
All agents must follow these rules. Status updates are now a **trailing indicator** of work done, not a leading indicator of work planned.
