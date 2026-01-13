#!/bin/bash
# Production environment validation script

set -e

echo "🔍 Validating production environment..."

# Check if we're in production mode
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  NODE_ENV is not set to production"
fi

# Validate required environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "DATABASE_URL"
    "YOUTUBE_API_KEY"
    "CRON_SECRET"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

# Validate URLs
if [[ ! "$NEXT_PUBLIC_SUPABASE_URL" =~ ^https:// ]]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL must use HTTPS"
    exit 1
fi

if [[ ! "$NEXT_PUBLIC_APP_URL" =~ ^https:// ]]; then
    echo "❌ NEXT_PUBLIC_APP_URL must use HTTPS in production"
    exit 1
fi

echo "✅ All required environment variables are set"
echo "✅ URLs are using HTTPS"
echo "✅ Production environment is valid"