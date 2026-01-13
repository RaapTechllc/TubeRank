# Implementation Plan: Agent-Prompt Integration System

## Overview

This plan implements the agent-prompt integration system in dependency order: smoke tests first (foundation for verification), then new prompts, then agent config updates, and finally the evolution system.

## Tasks

- [ ] 1. Create Playwright Smoke Test Suite
  - [ ] 1.1 Create `tests/e2e/smoke.spec.ts` with @smoke tagged tests
    - Test homepage loads correctly
    - Test card creation flow
    - Test kanban board drag-drop interaction
    - Ensure all tests complete in < 30 seconds total
    - _Requirements: 2.1, 2.5, 2.6_

  - [ ]* 1.2 Write property test for smoke test duration
    - **Property: Smoke tests complete in under 30 seconds**
    - **Validates: Requirements 2.5**

- [ ] 2. Create New Prompts
  - [ ] 2.1 Create `@verify-changes` prompt
    - Run Playwright smoke tests after code changes
    - Report pass/fail with structured output
    - Invoke @rca on failure
    - _Requirements: 5.1, 2.2, 2.4_

  - [ ] 2.2 Create `@apply-evolution` prompt
    - Read evolution logs from `~/.kiro/evolution/`
    - Extract high-confidence (>=8) improvements
    - Generate JSON patches for agent configs
    - Apply patches and commit changes
    - _Requirements: 5.2, 3.3_

  - [ ] 2.3 Create `@verify-evolution` prompt
    - Test agent on sample task before/after evolution
    - Compare performance metrics
    - Trigger rollback if regression detected
    - _Requirements: 5.3, 3.4, 3.5_

  - [ ] 2.4 Create `@handoff-create` prompt
    - Generate structured handoff file at `.kiro/handoffs/`
    - Include all required fields (task, fileRefs, expectedOutput, successCriteria)
    - Validate delegation chain for circular references
    - _Requirements: 5.4, 4.1, 4.2, 4.6_

  - [ ] 2.5 Create `@handoff-complete` prompt
    - Update handoff file with results section
    - Include status, summary, filesModified, notes
    - _Requirements: 5.5, 4.4_

  - [ ] 2.6 Update `prompts/README.md` with new prompts
    - Document each new prompt
    - Add to appropriate category
    - _Requirements: 5.6_

- [ ] 3. Checkpoint - Verify prompts created
  - Ensure all 5 new prompts exist and are documented
  - Ask the user if questions arise

- [ ] 4. Create Core Integration Utilities
  - [ ] 4.1 Create `lib/agents/prompt-loader.ts`
    - Implement PromptLoader interface from design
    - Load prompts from `.kiro/prompts/`
    - Validate agent access to prompts
    - _Requirements: 1.6, 3.1_

  - [ ]* 4.2 Write property test for prompt loader
    - **Property 3: Available Prompts Accessibility**
    - **Validates: Requirements 1.6**

  - [ ] 4.3 Create `lib/agents/handoff-protocol.ts`
    - Implement HandoffProtocol interface from design
    - Create/read/complete handoff files
    - Detect circular delegation
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

  - [ ]* 4.4 Write property tests for handoff protocol
    - **Property 10: Handoff Creation Produces Valid Files**
    - **Property 11: Handoff Completion Updates File**
    - **Property 12: Circular Delegation Prevention**
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.6**

  - [ ] 4.5 Create `lib/agents/evolution-system.ts`
    - Implement EvolutionSystem interface from design
    - RBT analysis generation
    - Patch application with backup
    - Rollback on regression
    - _Requirements: 3.1, 3.3, 3.5, 3.6_

  - [ ]* 4.6 Write property tests for evolution system
    - **Property 6: Self-Reflect Produces Valid RBT Structure**
    - **Property 7: Evolution Application Produces Valid Patches**
    - **Property 8: Regression Triggers Rollback**
    - **Property 9: Evolution Changes Are Logged**
    - **Validates: Requirements 3.1, 3.3, 3.5, 3.6**

- [ ] 5. Checkpoint - Verify core utilities
  - Ensure all utility modules compile and tests pass
  - Ask the user if questions arise

- [ ] 6. Update Agent Configurations
  - [ ] 6.1 Update `orchestrator.json` with prompt bindings
    - Add prompts: onStart=["prime"], onComplete=["self-reflect"], available=["plan-feature", "next-task", "workflow-status", "handoff-create"]
    - Add autoTrigger: afterError=["rca"]
    - _Requirements: 6.4_

  - [ ] 6.2 Update `code-surgeon.json` with prompt bindings
    - Add prompts: onComplete=["self-reflect"], available=["code-review", "security-audit", "rca"]
    - Add autoTrigger: afterWrite=["code-review-fix"], afterError=["rca"]
    - _Requirements: 6.1_

  - [ ] 6.3 Update `test-architect.json` with prompt bindings
    - Add prompts: onComplete=["self-reflect"], available=["test-coverage"]
    - Add autoTrigger: afterError=["rca"]
    - _Requirements: 6.2_

  - [ ] 6.4 Update `frontend-designer.json` with prompt bindings
    - Add prompts: onComplete=["self-reflect", "verify-changes"], available=["ui-review", "a11y-audit", "responsive-check"]
    - Add autoTrigger: afterWrite=["verify-changes"], afterError=["rca"]
    - Add hooks for Playwright smoke tests
    - _Requirements: 6.3_

  - [ ] 6.5 Update `db-wizard.json` with prompt bindings
    - Add prompts: onComplete=["self-reflect"], available=["db-optimize"]
    - Add autoTrigger: afterError=["rca"]
    - _Requirements: 6.1-6.5_

  - [ ] 6.6 Update `doc-smith.json` with prompt bindings
    - Add prompts: onComplete=["self-reflect"]
    - _Requirements: 6.1-6.5_

  - [ ] 6.7 Update `devops-automator.json` with prompt bindings
    - Add prompts: onComplete=["self-reflect"], available=["deploy-checklist"]
    - Add autoTrigger: afterError=["rca"]
    - _Requirements: 6.1-6.5_

  - [ ]* 6.8 Write property test for agent config bindings
    - **Property 1: Agent Config Schema Validation**
    - **Property 13: Agent Configs Have Correct Bindings**
    - **Validates: Requirements 1.1, 6.1-6.5**

- [ ] 7. Checkpoint - Verify agent configs
  - Ensure all 7 agents have valid prompt bindings
  - Run schema validation tests
  - Ask the user if questions arise

- [ ] 8. Implement Event Trigger System
  - [ ] 8.1 Create `lib/agents/event-triggers.ts`
    - Implement event emission for onStart, onComplete, afterWrite, afterError
    - Load and invoke prompts based on agent config
    - Maintain execution order guarantees
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ]* 8.2 Write property tests for event triggers
    - **Property 2: Event-Triggered Prompt Invocation**
    - **Property 4: File Writes Trigger Verification**
    - **Property 5: Test Failures Trigger RCA**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 2.2, 2.4**

- [ ] 9. Implement Confidence Scoring System
  - [ ] 9.1 Create `lib/agents/confidence-scoring.ts`
    - Implement confidence threshold logic
    - Auto-apply for >= 8
    - Flag for review for 5-7
    - Document only for 1-4
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ]* 9.2 Write property test for confidence scoring
    - **Property 15: Confidence Scoring Determines Action**
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [ ] 10. Implement Execution Loop
  - [ ] 10.1 Create `lib/agents/execution-loop.ts`
    - Implement full loop: prime → execute → verify-changes → self-reflect → apply-evolution → verify-evolution
    - Ensure step ordering
    - Handle errors at each step
    - _Requirements: 7.1_

  - [ ]* 10.2 Write property test for execution loop order
    - **Property 14: Execution Loop Order**
    - **Validates: Requirements 7.1**

  - [ ] 10.3 Implement evolution persistence
    - Save applied evolutions to agent config
    - Load evolutions on session start
    - _Requirements: 7.6_

  - [ ]* 10.4 Write property test for evolution persistence
    - **Property 16: Evolutions Persist Across Sessions**
    - **Validates: Requirements 7.6**

- [ ] 11. Update Documentation
  - [ ] 11.1 Update `agents/README.md`
    - Document prompt bindings for each agent
    - Document continuous improvement loop
    - Add sub-agent delegation protocol
    - _Requirements: 6.6, 8.5_

  - [ ] 11.2 Update or create `steering/agent-evolution.md`
    - Add Playwright verification requirements
    - Document prompt binding schema
    - Document delegation protocol
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 11.3 Create `.kiro/handoffs/` directory with README
    - Document handoff file format
    - Provide example handoff
    - _Requirements: 4.1_

- [ ] 12. Final Checkpoint - Full Integration Test
  - Run all property tests
  - Run smoke test suite
  - Verify full execution loop works end-to-end
  - Ensure all tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
