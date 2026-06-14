#!/usr/bin/env bash
# Rollback de ShopLite vers une version d'image STABLE, SANS perte de données.
#
# Usage:   ./scripts/rollback.sh <version>     ex: ./scripts/rollback.sh v1.0.0
#
# Principes:
#   - on revient à une IMAGE TAGUÉE connue (pas une image inconnue) ;
#   - on NE supprime JAMAIS les volumes (jamais de `docker compose down -v`) ;
#   - les logs sont sauvegardés avant l'opération ;
#   - un smoke test valide le retour à la normale.
set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>   (ex: v1.0.0)" >&2
  exit 1
fi

API_IMAGE="shoplite-api:${VERSION}"
FRONT_IMAGE="shoplite-frontend:${VERSION}"
LOG_DIR="${LOG_DIR:-./logs}"
BASE_URL="${BASE_URL:-http://localhost:8080}"

# 1) Sauvegarde des logs API avant toute action.
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
echo "[rollback] sauvegarde des logs avant rollback -> $LOG_DIR/api_before_rollback_${STAMP}.log"
docker logs shoplite_api > "$LOG_DIR/api_before_rollback_${STAMP}.log" 2>&1 || true

# 2) Vérifier que l'image stable cible existe localement.
echo "[rollback] vérification de la présence de l'image $API_IMAGE..."
if ! docker image inspect "$API_IMAGE" >/dev/null 2>&1; then
  echo "[rollback] ERREUR: image $API_IMAGE introuvable en local." >&2
  echo "          Images disponibles:" >&2
  docker images shoplite-api --format '  {{.Repository}}:{{.Tag}} ({{.Size}})' >&2
  exit 1
fi

# 3) Redéploiement sur la version cible (recrée api/frontend, garde db + volume).
echo "[rollback] redéploiement vers $VERSION..."
export APP_VERSION="$VERSION"
docker compose up -d --no-deps api frontend

# 4) Vérification post-rollback.
echo "[rollback] attente du healthcheck puis smoke test..."
sleep 5
if BASE_URL="$BASE_URL" "$(dirname "$0")/smoke-test.sh"; then
  echo "[rollback] SUCCÈS: version $VERSION en service, données conservées."
else
  echo "[rollback] ÉCHEC du smoke test après rollback." >&2
  exit 1
fi
