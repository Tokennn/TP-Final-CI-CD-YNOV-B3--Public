#!/usr/bin/env bash
# Sauvegarde PostgreSQL de ShopLite (pg_dump) avec horodatage et rétention.
#
# Usage:   ./scripts/backup.sh
# Config (env, valeurs par défaut adaptées à docker-compose.yml):
#   DB_CONTAINER  conteneur postgres        (def: shoplite_db)
#   POSTGRES_USER utilisateur               (def: shoplite)
#   POSTGRES_DB   base                       (def: shoplite)
#   BACKUP_DIR    dossier hôte des dumps     (def: ./backups)
#   RETENTION     nombre de dumps à garder   (def: 7)
set -euo pipefail

# Charge .env si présent (sans écraser les variables déjà exportées).
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

DB_CONTAINER="${DB_CONTAINER:-shoplite_db}"
POSTGRES_USER="${POSTGRES_USER:-shoplite}"
POSTGRES_DB="${POSTGRES_DB:-shoplite}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION="${RETENTION:-7}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/shoplite_${POSTGRES_DB}_${STAMP}.sql"

echo "[backup] dump de '$POSTGRES_DB' depuis le conteneur '$DB_CONTAINER'..."
docker exec "$DB_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists > "$OUT"

SIZE="$(wc -c < "$OUT" | tr -d ' ')"
echo "[backup] OK -> $OUT (${SIZE} octets)"

# Rétention : on ne garde que les N dumps les plus récents.
echo "[backup] application de la rétention (garde $RETENTION dumps)..."
ls -1t "$BACKUP_DIR"/shoplite_*.sql 2>/dev/null | tail -n +$((RETENTION + 1)) | while read -r old; do
  echo "[backup] suppression ancien dump: $old"
  rm -f "$old"
done

echo "[backup] dumps actuels:"
ls -1t "$BACKUP_DIR"/shoplite_*.sql 2>/dev/null || true
