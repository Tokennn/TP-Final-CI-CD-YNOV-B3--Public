#!/bin/sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:8080}"

curl -fsS "$BASE_URL/api/health"
curl -fsS "$BASE_URL/api/products"

echo "Smoke test starter OK"
