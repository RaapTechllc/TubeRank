#!/bin/bash
# Post-response validation script
# Runs appropriate tests based on project type

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "VALIDATION RESULTS"
echo "═══════════════════════════════════════════════════════════"

VALIDATION_FAILED=0

# Node.js / TypeScript projects
if [ -f package.json ]; then
  echo ""
  echo "## Package.json detected - running Node validations"
  
  # Determine package manager
  if [ -f pnpm-lock.yaml ]; then
    PM="pnpm"
  elif [ -f yarn.lock ]; then
    PM="yarn"
  else
    PM="npm"
  fi
  
  # TypeScript check
  if grep -q '"typescript"' package.json 2>/dev/null || [ -f tsconfig.json ]; then
    echo ""
    echo "### TypeScript Compilation"
    $PM run typecheck 2>&1 | tail -15
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
      VALIDATION_FAILED=1
      echo "❌ TypeScript errors detected"
    else
      echo "✅ TypeScript compilation passed"
    fi
  fi
  
  # Lint check
  if grep -q '"lint"' package.json 2>/dev/null; then
    echo ""
    echo "### Linting"
    $PM run lint 2>&1 | tail -10
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
      echo "⚠️  Lint warnings/errors detected"
    else
      echo "✅ Linting passed"
    fi
  fi
  
  # Test check
  if grep -q '"test"' package.json 2>/dev/null; then
    echo ""
    echo "### Tests"
    timeout 60 $PM test 2>&1 | tail -20
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
      VALIDATION_FAILED=1
      echo "❌ Tests failed"
    else
      echo "✅ Tests passed"
    fi
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
if [ $VALIDATION_FAILED -eq 1 ]; then
  echo "❌ VALIDATION FAILED - Please fix the errors above"
  echo "Do not mark this task complete until validations pass."
else
  echo "✅ VALIDATION PASSED"
fi
echo "═══════════════════════════════════════════════════════════"

exit $VALIDATION_FAILED
