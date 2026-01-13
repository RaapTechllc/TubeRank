#!/bin/bash

# TubeRank Database Restore Script
# Restores Supabase PostgreSQL database from backup

set -e

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

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz> [--force]"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/tuberank_backup_*.sql.gz 2>/dev/null || echo "No backups found in ./backups/"
    exit 1
fi

BACKUP_FILE="$1"
FORCE_RESTORE="$2"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
fi

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL environment variable is required"
fi

# Extract connection details from DATABASE_URL
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

# Warning about destructive operation
if [ "$FORCE_RESTORE" != "--force" ]; then
    warn "This will COMPLETELY REPLACE the current database!"
    warn "All existing data will be lost!"
    echo ""
    echo "Database: $DB_NAME"
    echo "Host: $DB_HOST"
    echo "Backup: $BACKUP_FILE"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled by user"
        exit 0
    fi
fi

log "Starting database restore..."
log "Backup file: $BACKUP_FILE"
log "Target database: $DB_NAME on $DB_HOST"

# Create temporary directory for decompression
TEMP_DIR=$(mktemp -d)
TEMP_SQL="$TEMP_DIR/restore.sql"

# Decompress backup
log "Decompressing backup..."
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL" || error "Failed to decompress backup"

# Verify SQL file
if [ ! -s "$TEMP_SQL" ]; then
    error "Decompressed SQL file is empty"
fi

# Test database connection
log "Testing database connection..."
psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --command="SELECT version();" > /dev/null || error "Cannot connect to database"

# Create backup of current state before restore
CURRENT_BACKUP="./backups/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
log "Creating backup of current state: $CURRENT_BACKUP"
mkdir -p ./backups
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --no-owner \
    --no-privileges | gzip > "$CURRENT_BACKUP" || warn "Failed to create pre-restore backup"

# Restore database
log "Restoring database..."
psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --file="$TEMP_SQL" \
    --quiet || error "Database restore failed"

# Clean up temporary files
rm -rf "$TEMP_DIR"

# Verify restore
log "Verifying restore..."
TABLE_COUNT=$(psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --tuples-only \
    --command="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    log "Restore completed successfully! ($TABLE_COUNT tables restored)"
    log "Pre-restore backup saved as: $CURRENT_BACKUP"
else
    error "Restore verification failed - no tables found"
fi

log "Database restore completed!"