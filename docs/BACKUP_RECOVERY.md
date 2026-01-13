# TubeRank Backup and Recovery Procedures

## Overview

This document outlines the backup and recovery procedures for the TubeRank application, including database backups, disaster recovery, and data restoration processes.

## Backup Strategy

### Automated Backups

- **Schedule**: Daily at 2:00 AM UTC
- **Retention**: 7 days (configurable via `RETENTION_DAYS`)
- **Location**: `./backups/` directory
- **Format**: Compressed SQL dumps (`.sql.gz`)

### Backup Components

1. **Database**: Complete PostgreSQL dump including:
   - All tables and data
   - Indexes and constraints
   - Functions and triggers
   - User-defined types

2. **Configuration**: Environment variables and settings
3. **Application Code**: Version controlled in Git

## Backup Scripts

### 1. Manual Backup

```bash
# Create immediate backup
./scripts/backup-database.sh

# With custom retention
RETENTION_DAYS=30 ./scripts/backup-database.sh
```

### 2. Automated Backup Setup

```bash
# Set up daily automated backups
./scripts/setup-backup-cron.sh

# Custom schedule (e.g., every 6 hours)
BACKUP_SCHEDULE="0 */6 * * *" ./scripts/setup-backup-cron.sh
```

### 3. Database Restore

```bash
# List available backups
ls -lh ./backups/tuberank_backup_*.sql.gz

# Restore from backup (interactive)
./scripts/restore-database.sh ./backups/tuberank_backup_20240113_020000.sql.gz

# Force restore (non-interactive)
./scripts/restore-database.sh ./backups/tuberank_backup_20240113_020000.sql.gz --force
```

## Environment Variables

Required for backup operations:

```bash
# Database connection
DATABASE_URL=postgresql://postgres:password@host:port/database

# Optional: Cloud storage
AWS_S3_BUCKET=your-backup-bucket
GOOGLE_CLOUD_BUCKET=your-backup-bucket

# Backup configuration
BACKUP_DIR=./backups
RETENTION_DAYS=7
BACKUP_SCHEDULE="0 2 * * *"
```

## Recovery Scenarios

### 1. Data Corruption Recovery

**Symptoms**: Application errors, data inconsistencies, failed queries

**Steps**:
1. Identify the scope of corruption
2. Stop the application to prevent further damage
3. Create a backup of the current state (for forensics)
4. Restore from the most recent clean backup
5. Verify data integrity
6. Restart the application

```bash
# Stop application (if using PM2)
pm2 stop tuberank

# Create forensic backup
./scripts/backup-database.sh

# Restore from clean backup
./scripts/restore-database.sh ./backups/tuberank_backup_YYYYMMDD_HHMMSS.sql.gz --force

# Restart application
pm2 start tuberank
```

### 2. Complete Database Loss

**Symptoms**: Database server failure, data center outage

**Steps**:
1. Set up new database instance
2. Configure connection strings
3. Restore from most recent backup
4. Update DNS/load balancer settings
5. Test application functionality

### 3. Partial Data Loss

**Symptoms**: Missing records, incomplete data sets

**Steps**:
1. Identify affected tables/records
2. Extract specific data from backup
3. Merge with current database
4. Validate data consistency

```bash
# Extract specific table from backup
gunzip -c backup.sql.gz | grep -A 1000 "CREATE TABLE specific_table" > table_restore.sql
```

## Monitoring and Alerts

### Backup Monitoring

Check backup logs regularly:

```bash
# View recent backup logs
tail -f ./logs/backup.log

# Check backup file sizes
du -h ./backups/tuberank_backup_*.sql.gz
```

### Health Checks

Verify backup integrity:

```bash
# Test backup file
gunzip -t ./backups/tuberank_backup_latest.sql.gz

# Verify database connection
psql $DATABASE_URL -c "SELECT version();"
```

## Cloud Storage Integration

### AWS S3 Setup

```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure

# Enable S3 upload in backup script
export AWS_S3_BUCKET=your-backup-bucket
```

### Google Cloud Storage Setup

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Authenticate
gcloud auth login

# Enable GCS upload in backup script
export GOOGLE_CLOUD_BUCKET=your-backup-bucket
```

## Testing Recovery Procedures

### Monthly Recovery Test

1. Create test database instance
2. Restore from production backup
3. Verify data integrity
4. Test application functionality
5. Document any issues

### Disaster Recovery Drill

1. Simulate complete system failure
2. Follow recovery procedures
3. Measure recovery time (RTO)
4. Verify data completeness (RPO)
5. Update procedures based on findings

## Security Considerations

### Backup Security

- Encrypt backups at rest
- Use secure transfer protocols
- Implement access controls
- Regular security audits

### Access Control

```bash
# Restrict backup file permissions
chmod 600 ./backups/*.sql.gz

# Secure backup directory
chmod 700 ./backups/
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chmod +x ./scripts/*.sh
   ```

2. **Database Connection Failed**
   ```bash
   # Test connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Insufficient Disk Space**
   ```bash
   # Check disk usage
   df -h
   
   # Clean old backups
   find ./backups -name "*.sql.gz" -mtime +7 -delete
   ```

4. **Backup Corruption**
   ```bash
   # Test backup integrity
   gunzip -t backup.sql.gz
   
   # Use previous backup
   ls -lt ./backups/
   ```

## Recovery Time Objectives (RTO)

- **Minor data corruption**: < 30 minutes
- **Database failure**: < 2 hours
- **Complete system failure**: < 4 hours

## Recovery Point Objectives (RPO)

- **Maximum data loss**: 24 hours (daily backups)
- **Recommended**: 6 hours (with 4x daily backups)

## Contact Information

For backup and recovery support:
- DevOps Team: devops@company.com
- Emergency Hotline: +1-XXX-XXX-XXXX
- Documentation: https://docs.company.com/tuberank

## Changelog

- 2024-01-13: Initial backup and recovery procedures
- Future updates will be tracked here