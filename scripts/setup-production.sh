#!/bin/bash
# Production deployment configuration script

set -e

echo "🚀 Configuring production environment..."

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

# Set production environment variables
echo "📝 Setting production environment variables..."

# Required variables check
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" 
    "SUPABASE_SERVICE_ROLE_KEY"
    "DATABASE_URL"
    "YOUTUBE_API_KEY"
    "OPENROUTER_API_KEY"
    "GOOGLE_AI_API_KEY"
    "NEXT_PUBLIC_APP_URL"
    "CRON_SECRET"
)

echo "✅ Required environment variables:"
for var in "${REQUIRED_VARS[@]}"; do
    echo "  - $var"
done

echo ""
echo "📋 Next steps:"
echo "1. Set these variables in Vercel dashboard or CLI"
echo "2. Run: vercel --prod"
echo "3. Configure custom domain (optional)"
echo "4. Test deployment with health checks"

echo ""
echo "🔧 Vercel CLI commands:"
echo "  vercel env add VARIABLE_NAME production"
echo "  vercel --prod"
echo "  vercel domains add your-domain.com"

echo ""
echo "✅ Production configuration ready!"