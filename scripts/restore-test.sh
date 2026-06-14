#!/usr/bin/env bash
# Test de restauration : restaure un dump dans une base TEMPORAIRE puis vérifie
# l'intégrité (sans toucher à la base de production).
#
# Usage:   ./scripts/restore-test.sh [chemin_du_dump]
#          (par défaut: le dump le plus récent de ./backups)
set -euo pipefail

if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

DB_CONTAINER="${DB_CONTAINER:-shoplite_db}"
POSTGRES_USER="${POSTGRES_USER:-shoplite}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TEST_DB="shoplite_restore_test"

DUMP="${1:-$(ls -1t "$BACKUP_DIR"/shoplite_*.sql 2>/dev/null | head -1 || true)}"
if [ -z "${DUMP:-}" ] || [ ! -f "$DUMP" ]; then
  echo "[restore-test] ERREUR: aucun dump trouvé (arg ou $BACKUP_DIR vide)." >&2
  exit 1
fi

echo "[restore-test] dump utilisé: $DUMP"

cleanup() {
  docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d postgres \
    -c "DROP DATABASE IF EXISTS $TEST_DB;" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[restore-test] création base temporaire $TEST_DB..."
docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS $TEST_DB;" -c "CREATE DATABASE $TEST_DB;"

echo "[restore-test] restauration du dump..."
docker exec -i "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d "$TEST_DB" < "$DUMP" >/dev/null

COUNT="$(docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d "$TEST_DB" \
  -tAc "SELECT COUNT(*) FROM products;")"

echo "[restore-test] produits restaurés: $COUNT"
if [ "$COUNT" -ge 1 ]; then
  echo "[restore-test] SUCCÈS: la sauvegarde est restaurable."
else
  echo "[restore-test] ÉCHEC: aucune donnée restaurée." >&2
  exit 1
fi
