#!/bin/bash
set -euo pipefail

# Automated PostgreSQL backup for DMCC
# Usage: ./scripts/backup-db.sh
# Cron:  0 3 * * * /root/media-content-creattion/scripts/backup-db.sh >> /var/log/dmcc-backup.log 2>&1

BACKUP_DIR="/root/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER="media-content-creattion-postgres-1"
DB_NAME="dmcc_db"
DB_USER="dmcc_app"
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of $DB_NAME..."

# Dump and compress
/usr/bin/docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verify file was created and has content
if [ -s "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date)] Backup successful: $BACKUP_FILE ($SIZE)"
else
  echo "[$(date)] ERROR: Backup file is empty or missing!"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Clean up old backups
DELETED=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date)] Cleaned up $DELETED old backup(s) (older than $RETENTION_DAYS days)"
fi

echo "[$(date)] Backup complete."
