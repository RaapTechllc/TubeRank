# Deployment Checklist

Pre-deployment verification for production readiness.

## Pre-Flight Checks

### 1. Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] ESLint clean (`npm run lint`)
- [ ] No `console.log` in production code
- [ ] No `TODO` or `FIXME` in critical paths
- [ ] Build succeeds (`npm run build`)

### 2. Database
- [ ] All migrations applied and tested
- [ ] No pending schema changes
- [ ] Seed data appropriate for environment
- [ ] Backup strategy in place
- [ ] Connection pooling configured

### 3. Environment Variables
- [ ] All required env vars documented in README
- [ ] `.env.example` or `.env.local.example` up to date
- [ ] No hardcoded secrets in code
- [ ] Production env vars set in hosting platform
- [ ] Sensitive vars not logged

### 4. Security
- [ ] Auth flows tested end-to-end
- [ ] Input validation on all user inputs
- [ ] CORS configured correctly (not wildcard)
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] HTTPS enforced
- [ ] Security headers configured (CSP, HSTS, etc.)

### 5. Performance
- [ ] Bundle size acceptable (check with `npm run build`)
- [ ] Images optimized (WebP, lazy loading)
- [ ] No obvious N+1 queries
- [ ] Caching strategy in place
- [ ] CDN configured for static assets

### 6. Monitoring & Logging
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Health check endpoint exists
- [ ] Key metrics being tracked
- [ ] Logs don't contain sensitive data

### 7. Documentation
- [ ] README updated with current setup instructions
- [ ] API changes documented
- [ ] CHANGELOG updated (if applicable)
- [ ] Deployment instructions current

### 8. Rollback Plan
- [ ] Previous version tagged in git
- [ ] Database rollback scripts ready (if schema changed)
- [ ] Feature flags for risky changes
- [ ] Monitoring alerts configured

## Deployment Commands

```bash
# Final checks
npm run lint
npm run test
npm run build

# Tag release
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x

# Deploy (platform-specific)
# Vercel: git push (auto-deploy)
# Manual: npm run deploy
```

## Post-Deployment Verification

- [ ] Site loads without errors
- [ ] Critical user flows work (login, main features)
- [ ] No new errors in monitoring
- [ ] Performance metrics acceptable
- [ ] Mobile experience works

## Output Format

```markdown
## Deployment Readiness Report

**Date**: [UTC timestamp]
**Version**: [git tag or commit]

### ✅ Passed
- [List of passing checks]

### ❌ Failed
- [List of failing checks with details]

### ⚠️ Warnings
- [Non-blocking issues to address]

### Recommendation
[READY TO DEPLOY / NEEDS FIXES / BLOCKED]
```
