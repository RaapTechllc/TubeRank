#!/bin/bash

# TubeRank Backup Validation Script
# Validates backup files and monitors backup health

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
}

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-25}" # Alert if no backup in 25 hours

log "Validating TubeRank backups..."
log "Backup directory: $BACKUP_DIR"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    error "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# Find backup files
BACKUP_FILES=($(find "$BACKUP_DIR" -name "tuberank_backup_*.sql.gz" -type f | sort -r))

if [ ${#BACKUP_FILES[@]} -eq 0 ]; then
    error "No backup files found in $BACKUP_DIR"
    exit 1
fi

log "Found ${#BACKUP_FILES[@]} backup files"

# Check latest backup age
LATEST_BACKUP="${BACKUP_FILES[0]}"
LATEST_BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP" 2>/dev/null || stat -f %m "$LATEST_BACKUP")
CURRENT_TIME=$(date +%s)
AGE_HOURS=$(( (CURRENT_TIME - LATEST_BACKUP_TIME) / 3600 ))

log "Latest backup: $(basename "$LATEST_BACKUP")"
log "Backup age: ${AGE_HOURS} hours"

if [ $AGE_HOURS -gt $MAX_AGE_HOURS ]; then
    warn "Latest backup is older than $MAX_AGE_HOURS hours!"
else
    log "Backup age is acceptable"
fi

# Validate backup files
VALID_BACKUPS=0
INVALID_BACKUPS=0

for backup in "${BACKUP_FILES[@]}"; do
    backup_name=$(basename "$backup")
    backup_size=$(du -h "$backup" | cut -f1)
    
    # Test gzip integrity
    if gunzip -t "$backup" 2>/dev/null; then
        log "✅ $backup_name ($backup_size) - Valid"
        ((VALID_BACKUPS++))
    else
        error "❌ $backup_name ($backup_size) - Corrupted"
        ((INVALID_BACKUPS++))
    fi
done

# Summary
log "Validation Summary:"
log "  Valid backups: $VALID_BACKUPS"
log "  Invalid backups: $INVALID_BACKUPS"
log "  Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"

# Check disk space
AVAILABLE_SPACE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
USED_SPACE=$(du -s "$BACKUP_DIR" | cut -f1)
USAGE_PERCENT=$(( USED_SPACE * 100 / (USED_SPACE + AVAILABLE_SPACE) ))

log "Disk usage: ${USAGE_PERCENT}%"

if [ $USAGE_PERCENT -gt 80 ]; then
    warn "Backup directory is using more than 80% of available space"
fi

# Exit with appropriate code
if [ $INVALID_BACKUPS -gt 0 ] || [ $AGE_HOURS -gt $MAX_AGE_HOURS ]; then
    error "Backup validation failed!"
    exit 1
else
    log "All backups are valid and up to date!"
    exit 0
fi