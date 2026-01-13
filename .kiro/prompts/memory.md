---
description: Session ender - Save progress and update memory
---

# Memory: Save Session & Update Context

## Objective
Update memory files with session progress and prepare for next session handoff.

## Steps

### 1) Validate Memory System
Ensure memory system exists and is writable:
- Check if `memory/` directory exists, create if needed
- Verify `active_state.md` exists, create from template if missing
- Verify `system_patterns.md` exists, create from template if missing
- Ensure `adr/` directory exists for potential new ADRs

### 2) Update active_state.md (safe)
Read existing content, then update:
- Preserve existing structure and data
- Move completed items to "Done This Session" 
- Update "Current Focus" to next priority
- Add any new blockers or landmines discovered
- Update "Next Actions" checklist with new priorities
- Add notes for next session
- Update "Last Updated" timestamp
- Set "Last Session By" if relevant

### 3) Update system_patterns.md (conditional)
Only update if new learnings discovered:
- Add new coding standards discovered
- Add new gotchas encountered  
- Add patterns that worked well
- Update architecture principles if changed
- Preserve existing content, append new items

### 4) Create ADR (if significant decision made)
Only if major architectural/technical decision was made:
- Create new file: `memory/adr/XXX-decision-name.md`
- Use proper ADR template format
- Document context, options, decision, consequences
- Number sequentially (check existing ADRs for next number)

### 5) Backup & Validation
- Verify all file writes succeeded
- Validate updated files are readable
- Report any write failures or permission issues

## Output Format
```
✅ Memory Updated

Files Modified:
- active_state.md (next focus: [X])
- system_patterns.md (added: [Y]) [if applicable]
- adr/XXX-[decision].md (created) [if applicable]

Session Summary:
- Completed: [What was accomplished this session]
- Learned: [New patterns/gotchas discovered]
- Decisions: [Any significant choices made]
- Next: [Top priority for next session]

Next session starts here: [1-sentence summary]
```

## Error Handling
- If memory files don't exist → Create from templates, then update
- If files are read-only → Report error, suggest manual update
- If no significant progress made → Still update timestamp, note minimal session
- If unsure what was accomplished → Ask user to summarize before updating

## Validation
After @memory, verify:
- `active_state.md` shows current session in "Done This Session"
- Next priority is clearly identified in "Current Focus"
- Any new learnings are captured in appropriate files
- Timestamps are updated correctly
- Files are readable and properly formatted

## Safety Features
- Always preserve existing content (append, don't overwrite)
- Create backups before major updates
- Validate file structure before writing
- Graceful handling of permission errors
- Clear error messages with suggested fixes
