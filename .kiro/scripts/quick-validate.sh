#!/bin/bash
# Lightweight validation - runs quickly after every response

echo ""
echo "── Quick Validation ──"

# Determine package manager
if [ -f pnpm-lock.yaml ]; then
  PM="pnpm"
elif [ -f yarn.lock ]; then
  PM="yarn"
else
  PM="npm"
fi

# Check for syntax errors in recently modified files
RECENT_FILES=$(git diff --name-only HEAD 2>/dev/null | head -5)

if [ -n "$RECENT_FILES" ]; then
  for file in $RECENT_FILES; do
    if [ -f "$file" ]; then
      case "$file" in
        *.ts|*.tsx)
          npx tsc --noEmit "$file" 2>&1 | tail -3
          ;;
        *.json)
          python -m json.tool "$file" > /dev/null 2>&1 || echo "❌ Invalid JSON: $file"
          ;;
      esac
    fi
  done
  echo "✓ Syntax check complete"
else
  echo "No uncommitted changes to validate"
fi
