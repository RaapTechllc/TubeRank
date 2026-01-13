#!/bin/bash

# TubeRank Automated Backup Scheduler
# Sets up automated database backups using cron

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

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.sh"

# Default schedule: Daily at 2 AM
CRON_SCHEDULE="${BACKUP_SCHEDULE:-0 2 * * *}"

log "Setting up automated database backups..."
log "Project directory: $PROJECT_DIR"
log "Backup script: $BACKUP_SCRIPT"
log "Schedule: $CRON_SCHEDULE"

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    error "Backup script not found: $BACKUP_SCRIPT"
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Create cron job entry
CRON_JOB="$CRON_SCHEDULE cd $PROJECT_DIR && $BACKUP_SCRIPT >> $PROJECT_DIR/logs/backup.log 2>&1"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    warn "Backup cron job already exists"
    log "Current cron jobs:"
    crontab -l | grep "$BACKUP_SCRIPT" || true
    
    read -p "Do you want to update the existing cron job? (y/n): " update_cron
    if [ "$update_cron" != "y" ]; then
        log "Keeping existing cron job"
        exit 0
    fi
    
    # Remove existing cron job
    (crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT") | crontab -
    log "Removed existing cron job"
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
log "Added cron job: $CRON_SCHEDULE"

# Verify cron job was added
if crontab -l | grep -q "$BACKUP_SCRIPT"; then
    log "Cron job successfully added!"
    log "Backups will run: $CRON_SCHEDULE"
    log "Logs will be written to: $PROJECT_DIR/logs/backup.log"
else
    error "Failed to add cron job"
fi

# Test backup script
log "Testing backup script..."
if "$BACKUP_SCRIPT" --dry-run 2>/dev/null; then
    log "Backup script test passed"
else
    warn "Backup script test failed - check configuration"
fi

log "Automated backup setup completed!"
log ""
log "To manage backups:"
log "  - View logs: tail -f $PROJECT_DIR/logs/backup.log"
log "  - Manual backup: $BACKUP_SCRIPT"
log "  - List cron jobs: crontab -l"
log "  - Remove cron job: crontab -e"