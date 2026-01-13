import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: { status: 'unknown' },
      environment: { status: 'unknown' },
      memory: { status: 'unknown' }
    }
  };

  try {
    // Database connectivity check
    const supabase = await createClient();
    const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
    
    checks.checks.database = {
      status: dbError ? 'unhealthy' : 'healthy',
      ...(dbError && { error: dbError.message })
    };

    // Environment variables check
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    checks.checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      ...(missingEnvVars.length > 0 && { missing: missingEnvVars })
    };

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    checks.checks.memory = {
      status: memUsageMB < 512 ? 'healthy' : 'warning',
      heapUsedMB: memUsageMB,
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024)
    };

    // Overall status
    const hasUnhealthy = Object.values(checks.checks).some(check => check.status === 'unhealthy');
    checks.status = hasUnhealthy ? 'unhealthy' : 'healthy';

    const statusCode = checks.status === 'healthy' ? 200 : 503;
    return NextResponse.json(checks, { status: statusCode });

  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database.status = 'unhealthy';
    
    return NextResponse.json(checks, { status: 503 });
  }
}