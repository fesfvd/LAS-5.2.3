#!/bin/bash
# LAS v5.2.3 — Database Backup Script
# 用法: bash deploy/backup.sh
# 建议 crontab: 0 3 * * * /opt/las/deploy/backup.sh >> /opt/las/data/backup.log 2>&1

set -e

BACKUP_DIR="/opt/las/backups"
DB_PATH="/opt/las/data/las.db"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/las_$DATE.db"

# SQLite 在线备份（WAL 模式下安全）
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# 压缩
gzip "$BACKUP_FILE"

# 清理旧备份
find "$BACKUP_DIR" -name "las_*.db.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup OK: ${BACKUP_FILE}.gz ($(du -h ${BACKUP_FILE}.gz | cut -f1))"
