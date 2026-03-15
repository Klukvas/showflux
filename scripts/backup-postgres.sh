#!/usr/bin/env bash
set -euo pipefail

# ------------------------------------------------------------------
# ShowFlux PostgreSQL Backup Script
# Runs pg_dump inside the Docker container, gzips output to BACKUP_DIR.
# Intended for host cron: 0 3 * * * /opt/showflux/scripts/backup-postgres.sh
# ------------------------------------------------------------------

CONTAINER="${POSTGRES_CONTAINER:-showflux-postgres}"
DB_USER="${DATABASE_USER:-showflux}"
DB_NAME="${DATABASE_NAME:-showflux}"
BACKUP_DIR="${BACKUP_DIR:-/opt/showflux/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="showflux_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date --iso-8601=seconds)] Starting backup of ${DB_NAME}..."

docker exec "${CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" \
  | gzip > "${FILEPATH}"

SIZE=$(du -h "${FILEPATH}" | cut -f1)
echo "[$(date --iso-8601=seconds)] Backup complete: ${FILEPATH} (${SIZE})"

# Prune backups older than RETENTION_DAYS
DELETED=$(find "${BACKUP_DIR}" -name "showflux_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)
if [ "${DELETED}" -gt 0 ]; then
  echo "[$(date --iso-8601=seconds)] Pruned ${DELETED} backup(s) older than ${RETENTION_DAYS} days"
fi

echo "[$(date --iso-8601=seconds)] Done."
