# Self-Reflection Protocol

Perform end-of-session self-reflection using the Roses-Buds-Thorns (RBT) framework.

## Instructions

Analyze this session and generate an evolution log entry:

### 1. Gather Session Context
- What task(s) were attempted?
- What was the approximate duration?
- What project context applies?

### 2. RBT Analysis

**🌹 Roses (What Worked)**
- Successful tool usages
- Effective prompt patterns
- Good outcomes achieved

**🌱 Buds (Opportunities)**
- Near-misses that could be improved
- Tools that would have helped
- Patterns worth formalizing

**🌵 Thorns (Failures)**
- Errors encountered
- Time wasted on wrong approaches
- Missing context that caused problems

### 3. Propose Improvements

For each Thorn, propose a specific fix:
- **Prompt addition**: Exact text to add to the agent prompt
- **Tool change**: Tool to add/remove/configure
- **Resource addition**: File pattern to include

### 4. Confidence Score

Rate 1-10 how confident you are these changes will help.
- 8-10: Apply automatically
- 5-7: Flag for review
- 1-4: Document but don't apply

### 5. Output Format

Generate a markdown entry following the evolution log format from the agent-evolution.md steering file.

If confidence >= 8, also output the specific JSON changes needed for the agent config.

## Example Output

```markdown
## Session: 2026-01-12 - Code Review for Auth Module

### Context
- Project: [project-name]
- Task: Security review of authentication flow
- Duration: ~30 minutes

### RBT Analysis

#### 🌹 Roses
- Found XSS vulnerability in user input handling
- grep tool was effective for finding patterns

#### 🌱 Buds
- Could benefit from OWASP cheat sheet in context
- Would help to have common vulnerability patterns pre-loaded

#### 🌵 Thorns
- Missed checking for rate limiting (not in my checklist)
- Wasted time looking for auth middleware (was in unexpected location)

### Proposed Changes

#### Prompt Improvements
Add to checklist:
"6. **Rate Limiting**: Check for brute force protection on auth endpoints"

#### Tool Recommendations
- None needed

#### Resource Suggestions
- Add common auth file patterns to resources

### Confidence Score
9 - High confidence, addresses specific gap in checklist

### JSON Changes (confidence >= 8)
```json
{
  "prompt_addition": "\n6. **Rate Limiting**: Check for brute force protection on auth endpoints, account lockout policies, and CAPTCHA on sensitive forms",
  "resources_add": ["file://src/**/auth/**/*.ts", "file://src/**/middleware/**/*.ts"]
}
```
```

## When to Trigger

- At the end of any task completion
- After encountering errors
- When explicitly asked with `@self-reflect`
- After sessions longer than 30 minutes
