# TubeRank Deployment Guide

## Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (recommended) or similar hosting platform

## Environment Setup

### 1. Supabase Configuration

1. Create a new Supabase project
2. Copy your project URL and anon key
3. Set up the database schema (see `supabase/migrations/`)

### 2. Environment Variables

Create `.env.local` with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (for migrations)
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT-REF.supabase.co:5432/postgres

# Cron Authentication
CRON_SECRET=your-random-secret-here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Migration

Run the database migration in Supabase SQL Editor:

```sql
-- Apply performance indexes
-- See database/performance-indexes.sql
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

3. **Set up Cron Jobs**
   - Vercel Pro: Use `vercel.json` cron configuration
   - Free tier: Use external cron service (cron-job.org)

### Option 2: Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Performance indexes created
- [ ] Cron jobs configured
- [ ] Health checks working (`/api/health`)
- [ ] Error tracking configured (optional)
- [ ] Backup strategy in place

## Monitoring

### Health Checks

The application provides health check endpoints:

- `/api/health` - Basic health status
- `/api/health/detailed` - Detailed system status

### Performance Monitoring

Monitor these key metrics:

- API response times
- Database query performance
- RSS feed processing success rate
- Job queue processing times

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check Supabase project status

2. **Authentication Issues**
   - Verify Supabase keys are correct
   - Check CORS settings in Supabase

3. **Cron Job Failures**
   - Verify CRON_SECRET is set
   - Check cron endpoint authentication

### Logs

Check application logs for:
- API errors
- Database query issues
- RSS processing failures
- Job queue problems
