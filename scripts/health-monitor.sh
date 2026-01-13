#!/bin/bash
# Health monitoring script

set -e

APP_URL=${1:-"http://localhost:3000"}
TIMEOUT=${2:-10}

echo "🏥 Health Check Monitor"
echo "Target: $APP_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Basic health check
echo "📊 Basic Health Check..."
BASIC_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_basic.json --max-time $TIMEOUT "$APP_URL/api/health" || echo "000")

if [ "$BASIC_RESPONSE" = "200" ]; then
    echo "✅ Basic health check passed"
    cat /tmp/health_basic.json | jq '.' 2>/dev/null || cat /tmp/health_basic.json
else
    echo "❌ Basic health check failed (HTTP $BASIC_RESPONSE)"
fi

echo ""

# Detailed health check
echo "🔍 Detailed Health Check..."
DETAILED_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_detailed.json --max-time $TIMEOUT "$APP_URL/api/health/detailed" || echo "000")

if [ "$DETAILED_RESPONSE" = "200" ]; then
    echo "✅ Detailed health check passed"
    cat /tmp/health_detailed.json | jq '.' 2>/dev/null || cat /tmp/health_detailed.json
elif [ "$DETAILED_RESPONSE" = "503" ]; then
    echo "⚠️  Service degraded (HTTP $DETAILED_RESPONSE)"
    cat /tmp/health_detailed.json | jq '.' 2>/dev/null || cat /tmp/health_detailed.json
else
    echo "❌ Detailed health check failed (HTTP $DETAILED_RESPONSE)"
fi

echo ""

# Cleanup
rm -f /tmp/health_basic.json /tmp/health_detailed.json

# Exit with appropriate code
if [ "$BASIC_RESPONSE" = "200" ] && [ "$DETAILED_RESPONSE" = "200" ]; then
    echo "🎉 All health checks passed!"
    exit 0
else
    echo "💥 Health checks failed!"
    exit 1
fi