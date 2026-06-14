#!/usr/bin/env bash
# Smoke test post-déploiement / post-rollback.
# Vérifie /health, /ready et /api/products via le proxy.
#
# Usage:   ./scripts/smoke-test.sh
# Config:  BASE_URL (def: http://localhost:8080)
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
fail=0

check() {
  local label="$1" url="$2"
  printf '[smoke] %-28s ' "$label"
  if curl -fsS --max-time 10 "$url" >/dev/null; then
    echo "OK"
  else
    echo "ÉCHEC ($url)"
    fail=1
  fi
}

echo "[smoke] cible: $BASE_URL"
check "GET /api/health" "$BASE_URL/api/health"
check "GET /api/ready" "$BASE_URL/api/ready"
check "GET /api/products" "$BASE_URL/api/products"

# Vérifie que le catalogue contient au moins un produit.
printf '[smoke] %-28s ' "produits non vides"
COUNT="$(curl -fsS --max-time 10 "$BASE_URL/api/products" | grep -o '"id"' | wc -l | tr -d ' ')"
if [ "${COUNT:-0}" -ge 1 ]; then
  echo "OK ($COUNT produits)"
else
  echo "ÉCHEC (catalogue vide)"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "[smoke] RÉSULTAT: tous les tests passent ✅"
else
  echo "[smoke] RÉSULTAT: au moins un test a échoué ❌" >&2
fi
exit "$fail"
