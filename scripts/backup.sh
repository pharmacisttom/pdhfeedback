#!/bin/bash
# ==============================================================
# PdhFeedback - Automated Database Backup Script
# ==============================================================
set -e

BACKUP_DIR="/var/backups/pdhfeedback"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/pdhfeedback_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting PdhFeedback database backup..."

# If running via docker-compose:
docker compose exec -T db mysqldump \
  -u root -p"${DB_ROOT_PASSWORD}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  pdhfeedback | gzip > "${BACKUP_FILE}"

# Retention policy: Remove backups older than 30 days
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +30 -delete

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE}"
echo "[$(date)] Backup size: $(du -h "${BACKUP_FILE}" | cut -f1)"
