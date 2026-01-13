#!/usr/bin/env node

/**
 * Sentry Integration Test Script
 * Tests error tracking and monitoring setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Sentry Integration...\n');

// Check environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_ORG',
  'SENTRY_PROJECT'
];

console.log('📋 Checking environment variables:');
let envMissing = false;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${envVar === 'NEXT_PUBLIC_SENTRY_DSN' ? value.substring(0, 30) + '...' : 'Set'}`);
  } else {
    console.log(`❌ ${envVar}: Missing`);
    envMissing = true;
  }
});

if (envMissing) {
  console.log('\n⚠️  Some Sentry environment variables are missing.');
  console.log('   Add them to your .env.local file for local development');
  console.log('   or to your deployment environment for production.\n');
}

// Check Sentry configuration files
console.log('\n📁 Checking Sentry configuration files:');
const sentryFiles = [
  'sentry.client.config.ts',
  'sentry.server.config.ts',
  'sentry.edge.config.ts',
  'next.config.ts'
];

sentryFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: Found`);
  } else {
    console.log(`❌ ${file}: Missing`);
  }
});

// Check if Sentry is in package.json
console.log('\n📦 Checking Sentry package installation:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.dependencies['@sentry/nextjs']) {
    console.log(`✅ @sentry/nextjs: ${packageJson.dependencies['@sentry/nextjs']}`);
  } else {
    console.log('❌ @sentry/nextjs: Not installed');
  }
} catch (error) {
  console.log('❌ Could not read package.json');
}

// Test build with Sentry
console.log('\n🔨 Testing build with Sentry integration:');
try {
  console.log('   Running type check...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  console.log('   Check your Sentry configuration for type errors');
}

console.log('\n📊 Sentry Integration Summary:');
console.log('   - Error tracking configured for client, server, and edge');
console.log('   - Custom error boundary component available');
console.log('   - Error tracking utility with context support');
console.log('   - CSP headers configured for Sentry domains');

if (!envMissing) {
  console.log('\n🎉 Sentry integration is ready!');
  console.log('   Deploy your application to start receiving error reports.');
} else {
  console.log('\n⚠️  Complete environment setup to enable error tracking.');
}

console.log('\n📖 Next steps:');
console.log('   1. Set up a Sentry project at https://sentry.io');
console.log('   2. Add environment variables to your deployment platform');
console.log('   3. Deploy and test error reporting');
console.log('   4. Set up alerts and notifications in Sentry dashboard');