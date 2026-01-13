# TubeRank Deployment Guide

## Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (recommended) or similar hosting platform
- YouTube API key (optional, for future features)
- OpenRouter API key (for AI processing)
- Google AI API key (for embeddings)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd tuberank
npm install
```

### 2. Environment Setup

Copy the production environment template:

```bash
cp .env.production.example .env.local
```

Edit `.env.local` with your values:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:your-db-password@db.your-project-ref.supabase.co:5432/postgres

# External APIs (Required)
YOUTUBE_API_KEY=your-youtube-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Application (Required)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
CRON_SECRET=your-secure-random-secret

# Rate Limiting (Optional - defaults provided)
RATE_LIMIT_GLOBAL_REQUESTS=100
RATE_LIMIT_GLOBAL_WINDOW=60000
RATE_LIMIT_PROFILE_REQUESTS=10
RATE_LIMIT_PROFILE_WINDOW=60000
```

### 3. Database Setup

#### Apply Migrations

In Supabase SQL Editor, run all migration files from `supabase/migrations/`:

```sql
-- Run each migration file in order
-- 1. Initial schema
-- 2. Performance indexes
-- 3. Additional features
```

#### Apply Performance Indexes

```bash
# Apply performance indexes
./scripts/apply-indexes.sh
```

Or manually in Supabase SQL Editor:

```sql
-- See database/performance-indexes.sql
```

### 4. Local Development

```bash
npm run dev
```

Visit `http://localhost:3000` to verify setup.

## Production Deployment

### Option 1: Vercel (Recommended)

#### Automatic Deployment

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   
   In Vercel dashboard, add all variables from `.env.production.example`:

   ```bash
   # Or use Vercel CLI
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   # ... add all required variables
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

#### Manual Setup Script

Use the provided setup script:

```bash
./scripts/setup-production.sh
```

This will guide you through:
- Environment variable setup
- Vercel configuration
- Domain setup (optional)

#### Cron Jobs (Vercel Pro)

Cron jobs are configured in `vercel.json`:

- **Channel ingestion**: Every 15 minutes
- **Keyword processing**: Every 30 minutes  
- **Category updates**: Every 6 hours
- **AI job processing**: Every 5 minutes
- **Daily digest**: 8 AM daily

For Vercel Free tier, use external cron service (see Alternative Cron Setup below).

### Option 2: Docker Deployment

#### Build Docker Image

```bash
# Build production image
docker build -t tuberank .

# Run container
docker run -p 3000:3000 --env-file .env.local tuberank
```

#### Docker Compose

```yaml
version: '3.8'
services:
  tuberank:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.local
```

### Option 3: Manual Server Deployment

#### Build and Start

```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start production server
npm start
```

#### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "tuberank" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

## Alternative Cron Setup (Free Tier)

If using Vercel Free tier or other platforms without cron support:

### External Cron Service

Use [cron-job.org](https://cron-job.org) or similar:

1. **Channel Ingestion** (every 15 min)
   ```
   POST https://your-domain.com/api/cron/ingest-channels
   Header: Authorization: Bearer YOUR_CRON_SECRET
   ```

2. **AI Job Processing** (every 5 min)
   ```
   POST https://your-domain.com/api/cron/process-ai-jobs
   Header: Authorization: Bearer YOUR_CRON_SECRET
   ```

3. **Daily Digest** (8 AM daily)
   ```
   POST https://your-domain.com/api/cron/daily-digest
   Header: Authorization: Bearer YOUR_CRON_SECRET
   ```

### GitHub Actions Cron

Create `.github/workflows/cron.yml`:

```yaml
name: Cron Jobs
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
    - cron: '0 8 * * *'     # Daily at 8 AM

jobs:
  trigger-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Channel Ingestion
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/ingest-channels" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Production Validation

### Automated Validation

Run the validation script:

```bash
./scripts/validate-production.sh
```

This checks:
- Required environment variables
- HTTPS URLs
- Database connectivity
- API endpoints

### Manual Health Checks

1. **Basic Health**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Detailed Health**
   ```bash
   curl https://your-domain.com/api/health/detailed
   ```

3. **Database Connectivity**
   - Create a test profile
   - Verify RSS ingestion works
   - Check analytics endpoints

## Monitoring & Maintenance

### Performance Monitoring

Monitor these metrics:

- **API Response Times**: < 500ms average
- **Database Queries**: < 100ms average
- **RSS Processing**: > 95% success rate
- **Job Queue**: < 5 minute processing time

### Health Check Endpoints

- `/api/health` - Basic status
- `/api/health/detailed` - Database, external APIs

### Log Monitoring

Key logs to monitor:

```bash
# API errors
grep "API error" logs/

# Database issues  
grep "Database error" logs/

# RSS processing
grep "RSS" logs/

# Job queue
grep "Job" logs/
```

### Backup Strategy

#### Database Backups

Supabase provides automatic backups, but also:

1. **Manual Backup**
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

2. **Automated Backup Script**
   ```bash
   ./scripts/backup-recovery.sh
   ```

#### Application Backups

- Code: Git repository
- Environment: Document all environment variables
- Configuration: Export Vercel/platform settings

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Symptoms**: 500 errors, "Database error" in logs

**Solutions**:
- Verify `DATABASE_URL` format
- Check Supabase project status
- Verify network connectivity
- Check connection pooling limits

#### 2. Authentication Issues

**Symptoms**: 401 errors, auth failures

**Solutions**:
- Verify Supabase keys are correct
- Check CORS settings in Supabase dashboard
- Verify JWT token format
- Check auth middleware configuration

#### 3. Cron Job Failures

**Symptoms**: No RSS updates, stale data

**Solutions**:
- Verify `CRON_SECRET` is set correctly
- Check cron endpoint authentication
- Verify external cron service configuration
- Check rate limiting settings

#### 4. Performance Issues

**Symptoms**: Slow response times, timeouts

**Solutions**:
- Check database indexes are applied
- Monitor database query performance
- Verify rate limiting configuration
- Check external API response times

#### 5. Build/Deployment Failures

**Symptoms**: Build errors, deployment failures

**Solutions**:
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check TypeScript compilation
- Verify environment variables are set

### Debug Mode

Enable debug logging:

```bash
# Local development
DEBUG=* npm run dev

# Production (temporary)
NODE_ENV=development npm start
```

### Support Channels

1. **Check logs** first (Vercel dashboard or server logs)
2. **Verify environment** with validation script
3. **Test health endpoints** for system status
4. **Check external services** (Supabase, APIs)

## Security Checklist

- [ ] All environment variables use secure values
- [ ] HTTPS enabled for all URLs
- [ ] Supabase RLS policies configured
- [ ] Rate limiting enabled
- [ ] CRON_SECRET is cryptographically secure
- [ ] API keys have minimal required permissions
- [ ] Database backups are encrypted
- [ ] Error messages don't expose sensitive data

## Performance Optimization

### Database

- [ ] Performance indexes applied
- [ ] Connection pooling configured
- [ ] Query optimization enabled
- [ ] Batch operations implemented

### Application

- [ ] Next.js optimizations enabled
- [ ] Static generation where possible
- [ ] Image optimization configured
- [ ] Bundle size optimized

### Monitoring

- [ ] Health checks configured
- [ ] Performance metrics tracked
- [ ] Error tracking enabled
- [ ] Uptime monitoring setup
