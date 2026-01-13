# Test Coverage Analysis

Analyze test coverage and identify gaps in the test suite.

## Analysis Steps

### 1. Current Coverage
Run coverage report:
```bash
# Vitest
npm test -- --coverage

# Jest
npm test -- --coverage

# Check output in coverage/ directory
```

Key metrics to check:
- **Line coverage**: % of code lines executed
- **Branch coverage**: % of if/else branches tested
- **Function coverage**: % of functions called
- **Statement coverage**: % of statements executed

### 2. Critical Paths (Must Have Tests)

**Authentication & Authorization**
- [ ] Login flow (success and failure)
- [ ] Logout flow
- [ ] Protected route access (with and without auth)
- [ ] Role-based access (if applicable)

**Data Mutations**
- [ ] Create operations (valid and invalid input)
- [ ] Update operations (valid, invalid, not found)
- [ ] Delete operations (success, not found, unauthorized)
- [ ] Bulk operations (if applicable)

**API Endpoints**
- [ ] Success responses (200, 201)
- [ ] Client errors (400, 401, 403, 404)
- [ ] Server errors (500) - error handling
- [ ] Input validation
- [ ] Rate limiting (if applicable)

**Business Logic**
- [ ] Core calculations/algorithms
- [ ] State transitions
- [ ] Edge cases (empty, null, max values)

**User Flows (E2E)**
- [ ] Primary user journey (happy path)
- [ ] Error recovery flows
- [ ] Mobile experience (if applicable)

### 3. Test Quality Assessment

**Good Tests**
- Test behavior, not implementation
- Have clear, descriptive names
- Are independent (no shared state)
- Use realistic test data
- Cover edge cases

**Red Flags**
- Tests that always pass (no assertions)
- Flaky tests (pass/fail randomly)
- Tests coupled to implementation details
- Missing error case coverage
- No integration tests

### 4. Gap Identification

For each untested area:
```markdown
### Gap: [Area/Feature]

**File(s)**: `path/to/file.ts`
**Priority**: High/Medium/Low
**Test Type**: Unit/Integration/E2E
**Risk if Untested**: [What could break]

**Suggested Tests**:
1. [Test scenario 1]
2. [Test scenario 2]
```

## Output Format

```markdown
## Test Coverage Report

**Date**: [UTC timestamp]
**Overall Coverage**: X%

### Coverage by Area
| Area | Coverage | Status |
|------|----------|--------|
| API Routes | X% | ✅/⚠️/❌ |
| Components | X% | ✅/⚠️/❌ |
| Utilities | X% | ✅/⚠️/❌ |
| Hooks | X% | ✅/⚠️/❌ |

### Critical Gaps (High Priority)
1. [Gap description] - [Suggested test]

### Recommended Improvements
1. [Improvement 1]
2. [Improvement 2]

### Test Quality Issues
- [Issue 1]
- [Issue 2]
```

## Quick Wins

Tests that provide high value with low effort:
1. **Utility functions** - Pure functions are easy to test
2. **API input validation** - Catch bad data early
3. **Error boundaries** - Ensure graceful failures
4. **Happy path E2E** - Verify core flow works
