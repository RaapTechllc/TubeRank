#!/bin/bash

# TubeRank Backup and Recovery Script

set -e

echo "🔄 TubeRank Backup and Recovery System"
echo "====================================="

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

backup_database() {
    echo "📦 Creating database backup..."
    
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL not set"
        exit 1
    fi
    
    # Create database dump
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database_$TIMESTAMP.sql"
    
    # Compress backup
    gzip "$BACKUP_DIR/database_$TIMESTAMP.sql"
    
    echo "✅ Database backup created: database_$TIMESTAMP.sql.gz"
}

backup_files() {
    echo "📁 Creating file backup..."
    
    # Backup configuration and important files
    tar -czf "$BACKUP_DIR/files_$TIMESTAMP.tar.gz" \
        --exclude=node_modules \
        --exclude=.next \
        --exclude=.git \
        --exclude=backups \
        .
    
    echo "✅ File backup created: files_$TIMESTAMP.tar.gz"
}

restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo "❌ Please specify backup file"
        echo "Usage: $0 restore-db <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ Backup file not found: $backup_file"
        exit 1
    fi
    
    echo "🔄 Restoring database from $backup_file..."
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | psql "$DATABASE_URL"
    else
        psql "$DATABASE_URL" < "$backup_file"
    fi
    
    echo "✅ Database restored successfully"
}

cleanup_old_backups() {
    echo "🧹 Cleaning up old backups (keeping last 7 days)..."
    
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
    
    echo "✅ Old backups cleaned up"
}

case "$1" in
    "backup")
        backup_database
        backup_files
        cleanup_old_backups
        ;;
    "restore-db")
        restore_database "$2"
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore-db <file>|cleanup}"
        echo ""
        echo "Commands:"
        echo "  backup      - Create full backup (database + files)"
        echo "  restore-db  - Restore database from backup file"
        echo "  cleanup     - Remove backups older than 7 days"
        exit 1
        ;;
esac
