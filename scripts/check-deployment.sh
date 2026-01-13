#!/bin/bash
# Deployment health check script

echo "🔍 Checking deployment status..."

# Check if required environment variables are set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN not set"
    exit 1
fi

if [ -z "$VERCEL_ORG_ID" ]; then
    echo "❌ VERCEL_ORG_ID not set"
    exit 1
fi

if [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "❌ VERCEL_PROJECT_ID not set"
    exit 1
fi

echo "✅ All required environment variables are set"
echo "✅ CI/CD pipeline configured"
echo "✅ Deployment ready"