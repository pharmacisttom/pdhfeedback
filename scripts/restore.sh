#!/bin/bash
# ==============================================================
# PdhFeedback - Database Restore Script
# ==============================================================
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  echo "Example: $0 /var/backups/pdhfeedback/pdhfeedback_backup_20261004.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "=========================================================="
echo "WARNING: This will overwrite the current 'pdhfeedback' database!"
echo "Restore Target File: ${BACKUP_FILE}"
echo "=========================================================="
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore aborted by user."
  exit 0
fi

echo "[$(date)] Restoring database from ${BACKUP_FILE}..."

# Decompress and stream into docker-compose MySQL container
gunzip -c "${BACKUP_FILE}" | docker compose exec -T db mysql \
  -u root -p"${DB_ROOT_PASSWORD}" \
  pdhfeedback

echo "[$(date)] Database restoration completed successfully!"
