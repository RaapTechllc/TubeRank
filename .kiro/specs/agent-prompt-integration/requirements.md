# Requirements Document

## Introduction

This specification defines a comprehensive Agent-Prompt Integration System with Self-Evolution and Verification capabilities. The system creates a closed feedback loop where agents invoke prompts, verify changes with Playwright, self-reflect on performance, and automatically evolve their configurations based on learnings.

The goal is to transform disconnected agents and prompts into a unified, self-improving development system where each session makes the system 1% better.

## Glossary

- **Agent**: A specialized JSON-configured AI assistant with defined tools, permissions, and domain expertise
- **Prompt**: A reusable markdown instruction set that provides structured workflows for specific tasks
- **Prompt_Binding**: The formal mapping between an agent and its available/auto-triggered prompts
- **Auto_Trigger**: A prompt that fires automatically based on events (afterWrite, afterError, onComplete)
- **Handoff**: A structured context file passed between agents during delegation
- **Evolution_Log**: Persistent learning record at `~/.kiro/evolution/[agent-name]-evolution.md`
- **Smoke_Test**: Fast Playwright tests (<30s) covering critical paths, tagged with @smoke
- **RBT_Analysis**: Roses-Buds-Thorns reflection framework for session analysis
- **Confidence_Score**: 1-10 rating for proposed improvements (8+ = auto-apply)

## Requirements

### Requirement 1: Agent-Prompt Binding System

**User Story:** As a developer, I want formal mappings between agents and prompts, so that agents automatically invoke the right prompts at the right time.

#### Acceptance Criteria

1. THE Agent_Configuration SHALL include a `prompts` object with `onStart`, `onComplete`, `available`, and `autoTrigger` fields
2. WHEN an agent session begins, THE System SHALL invoke all prompts listed in `onStart` (e.g., "prime")
3. WHEN an agent completes a task, THE System SHALL invoke all prompts listed in `onComplete` (e.g., "self-reflect")
4. WHEN an agent writes files, THE System SHALL check `autoTrigger.afterWrite` and invoke matching prompts
5. WHEN an agent encounters an error, THE System SHALL check `autoTrigger.afterError` and invoke matching prompts (e.g., "rca")
6. THE Agent SHALL have access to all prompts listed in `available` for manual invocation

### Requirement 2: Playwright Verification Integration

**User Story:** As a developer, I want automatic Playwright verification after code changes, so that regressions are caught immediately.

#### Acceptance Criteria

1. THE System SHALL include a smoke test suite at `tests/e2e/smoke.spec.ts` with @smoke tagged tests
2. WHEN any agent writes code files, THE System SHALL run `npx playwright test --grep @smoke` for quick verification
3. IF smoke tests pass, THE System MAY run the full test suite for comprehensive verification
4. IF tests fail, THE System SHALL invoke the @rca prompt to diagnose the failure
5. THE Smoke_Tests SHALL complete in under 30 seconds
6. THE Smoke_Tests SHALL cover critical paths: homepage, card creation, kanban board interactions

### Requirement 3: Self-Evolution with Auto-Apply

**User Story:** As a developer, I want agents to automatically improve themselves based on session learnings, so that the system gets better over time.

#### Acceptance Criteria

1. WHEN @self-reflect runs, THE System SHALL generate a structured RBT analysis with proposed improvements
2. WHEN a proposed improvement has confidence >= 8, THE System SHALL generate a JSON patch for the agent config
3. THE @apply-evolution prompt SHALL read evolution logs and apply high-confidence improvements to agent configs
4. THE @verify-evolution prompt SHALL test the agent on a sample task and compare before/after performance
5. IF evolution causes regression, THE System SHALL rollback the change automatically
6. THE System SHALL log all evolution changes to DEVLOG.md with rationale

### Requirement 4: Structured Handoff Protocol

**User Story:** As a developer, I want structured context handoffs between agents, so that delegated tasks have all necessary information.

#### Acceptance Criteria

1. WHEN delegating to a specialist agent, THE Orchestrator SHALL create a handoff file at `.kiro/handoffs/[timestamp]-[agent]-[task].md`
2. THE Handoff_File SHALL include: task description, relevant file references, expected output format, and success criteria
3. WHEN a specialist receives a handoff, THE Agent SHALL read the handoff file and execute accordingly
4. WHEN a specialist completes a handoff, THE Agent SHALL write results back to the handoff file
5. THE Orchestrator SHALL read handoff results and continue its workflow
6. THE Delegation_Protocol SHALL prevent circular delegation by tracking delegation chains

### Requirement 5: New Prompt Creation

**User Story:** As a developer, I want new prompts for verification and evolution workflows, so that the system has complete tooling.

#### Acceptance Criteria

1. THE System SHALL include a @verify-changes prompt that runs Playwright verification after code changes
2. THE System SHALL include a @apply-evolution prompt that applies high-confidence improvements to agent configs
3. THE System SHALL include a @verify-evolution prompt that tests agent improvements and rolls back on regression
4. THE System SHALL include a @handoff-create prompt for structured delegation setup
5. THE System SHALL include a @handoff-complete prompt for delegation result handling
6. ALL new prompts SHALL follow the existing prompt format and be documented in the README

### Requirement 6: Agent Configuration Updates

**User Story:** As a developer, I want all agents updated with prompt bindings and hooks, so that the integration system works across all agents.

#### Acceptance Criteria

1. THE code-surgeon Agent SHALL have prompts binding with: onComplete=["self-reflect"], available=["code-review", "security-audit", "rca"], autoTrigger.afterWrite=["code-review-fix"]
2. THE test-architect Agent SHALL have prompts binding with: onComplete=["self-reflect"], available=["test-coverage"], autoTrigger.afterError=["rca"]
3. THE frontend-designer Agent SHALL have prompts binding with: onComplete=["self-reflect", "verify-changes"], available=["ui-review", "a11y-audit", "responsive-check"]
4. THE orchestrator Agent SHALL have prompts binding with: onStart=["prime"], onComplete=["self-reflect"], available=["plan-feature", "next-task", "workflow-status", "handoff-create"]
5. ALL agents SHALL include hooks for post-write Playwright smoke test verification
6. THE Agent_README SHALL document the prompt bindings for each agent

### Requirement 7: Continuous Improvement Loop

**User Story:** As a developer, I want a complete feedback loop from execution to evolution, so that every session improves the system.

#### Acceptance Criteria

1. THE Execution_Loop SHALL follow: prime → execute → verify-changes → self-reflect → apply-evolution → verify-evolution
2. WHEN confidence >= 8, THE System SHALL automatically apply evolution without human approval
3. WHEN confidence is 5-7, THE System SHALL flag the improvement for human review
4. WHEN confidence is 1-4, THE System SHALL document but not apply the improvement
5. THE System SHALL track improvement metrics over time (sessions, evolutions applied, regressions)
6. THE Next_Session SHALL start with all applied evolutions active

### Requirement 8: Steering Documentation Updates

**User Story:** As a developer, I want updated steering documentation, so that the integration system is well-documented.

#### Acceptance Criteria

1. THE agent-evolution.md steering file SHALL include Playwright verification requirements
2. THE agent-evolution.md steering file SHALL document the prompt binding schema
3. THE agent-evolution.md steering file SHALL document the sub-agent delegation protocol
4. THE prompts/README.md SHALL document which agents use which prompts
5. THE agents/README.md SHALL document the continuous improvement loop

