#!/bin/bash

# TubeRank Database Backup Script
# Backs up Supabase PostgreSQL database with compression and rotation

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="tuberank_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL environment variable is required"
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "Starting database backup..."
log "Backup directory: $BACKUP_DIR"
log "Backup file: $COMPRESSED_FILE"

# Extract connection details from DATABASE_URL
# Format: postgresql://postgres:password@host:port/database
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    error "Invalid DATABASE_URL format"
fi

# Set PostgreSQL password
export PGPASSWORD="$DB_PASS"

# Create backup with pg_dump
log "Creating database dump..."
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --no-owner \
    --no-privileges \
    > "$BACKUP_DIR/$BACKUP_FILE" || error "pg_dump failed"

# Compress backup
log "Compressing backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE" || error "Compression failed"

# Verify backup
if [ -f "$BACKUP_DIR/$COMPRESSED_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
    log "Backup created successfully: $COMPRESSED_FILE ($BACKUP_SIZE)"
else
    error "Backup file not found after creation"
fi

# Clean up old backups
log "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "tuberank_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete || warn "Failed to clean up old backups"

# List current backups
log "Current backups:"
ls -lh "$BACKUP_DIR"/tuberank_backup_*.sql.gz 2>/dev/null || log "No existing backups found"

log "Backup completed successfully!"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# if [ -n "$AWS_S3_BUCKET" ]; then
#     log "Uploading to S3..."
#     aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILE" "s3://$AWS_S3_BUCKET/backups/"
# fi

# if [ -n "$GOOGLE_CLOUD_BUCKET" ]; then
#     log "Uploading to Google Cloud Storage..."
#     gsutil cp "$BACKUP_DIR/$COMPRESSED_FILE" "gs://$GOOGLE_CLOUD_BUCKET/backups/"
# fi