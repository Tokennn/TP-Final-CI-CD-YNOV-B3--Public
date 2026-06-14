# ShopLite — TP final intégrateur DevOps

[![CI](https://github.com/Tokennn/TP-Final-CI-CD-YNOV-B3--Public/actions/workflows/ci.yml/badge.svg)](https://github.com/Tokennn/TP-Final-CI-CD-YNOV-B3--Public/actions/workflows/ci.yml)
[![CD](https://github.com/Tokennn/TP-Final-CI-CD-YNOV-B3--Public/actions/workflows/cd.yml/badge.svg)](https://github.com/Tokennn/TP-Final-CI-CD-YNOV-B3--Public/actions/workflows/cd.yml)
![Node](https://img.shields.io/badge/node-18%20%7C%2020-339933?logo=node.js&logoColor=white)
![Coverage](https://img.shields.io/badge/coverage-%E2%89%A580%25-success)
![License](https://img.shields.io/badge/license-pédagogique-blue)

Mini-application e-commerce **industrialisée** : API Node/Express + frontend statique + PostgreSQL, avec toute la chaîne DevOps (Git, Docker, Compose, CI/CD, observabilité, sécurité, backup, rollback).

> Objectif du TP : pouvoir **lancer**, **tester**, **casser volontairement**, **diagnostiquer** et **rollbacker sans perte de données**.

---

## Sommaire

- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Endpoints API](#endpoints-api)
- [Tests & qualité](#tests--qualité)
- [Environnements](#environnements)
- [CI/CD](#cicd)
- [Observabilité](#observabilité)
- [Backup & restauration](#backup--restauration)
- [Incident contrôlé & rollback](#incident-contrôlé--rollback)
- [Sécurité](#sécurité)
- [Documentation complémentaire](#documentation-complémentaire)

---

## Architecture

```
Navigateur ──▶ proxy nginx (8080) ──┬─▶ /          frontend (nginx static)
                                     └─▶ /api/*     api (Node/Express :3000) ──▶ PostgreSQL (:5432, volume nommé)
```

Détail complet (Mermaid) : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| Service    | Image                | Rôle                                  |
| ---------- | -------------------- | ------------------------------------- |
| `proxy`    | nginx:1.27-alpine    | Point d'entrée unique, route `/api/`  |
| `frontend` | build local (nginx)  | Dashboard statique (HTML/CSS/JS)      |
| `api`      | build local (node20) | API REST, healthchecks, logs JSON     |
| `db`       | postgres:16-alpine   | Catalogue produits (volume persistant) |

---

## Démarrage rapide

Prérequis : Docker + Docker Compose v2.

```bash
cp .env.example .env          # adapter POSTGRES_PASSWORD
docker compose up -d --build
```

Ouvrir : <http://localhost:8080>

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/products
```

Arrêt **sans** perte de données :

```bash
docker compose down           # garde le volume (JAMAIS `down -v`)
```

### Hors Docker (prise en main API)

```bash
cd api
npm install
npm test
npm start        # http://localhost:3000/health
```

---

## Endpoints API

| Méthode | Route            | Description                                   | Codes        |
| ------- | ---------------- | --------------------------------------------- | ------------ |
| GET     | `/`              | Métadonnées API (nom, version, endpoints)     | 200          |
| GET     | `/health`        | Healthcheck détaillé (api, db, version, ts)   | 200 / 503    |
| GET     | `/ready`         | Readiness (api + db prêts)                    | 200 / 503    |
| GET     | `/products`      | Catalogue (param `?limit=N` optionnel)        | 200 / 400 / 500 |
| GET     | `/products/:id`  | Un produit                                    | 200 / 400 / 404 |

> Via le proxy, préfixer par `/api` (ex: `/api/products`).

---

## Tests & qualité

```bash
cd api
npm run lint           # ESLint
npm run format:check   # Prettier
npm test               # Jest (unitaire + intégration)
npm run test:coverage  # échoue sous 80% de couverture
```

- **Tests unitaires** (`tests/health.test.js`, `tests/products.test.js`) : base mockée, couvrent 200/400/404/500 et le request_id.
- **Test d'intégration** (`tests/products.integration.test.js`) : exécuté quand `DATABASE_URL` est défini (PostgreSQL réel, en CI). **C'est ce test qui devient rouge pendant l'incident et vert après rollback.**
- **Seuil de couverture** : 80 % (configuré dans `api/package.json` → `jest.coverageThreshold`). Mesuré ~98 %.

---

## Environnements

Trois environnements isolés (ports distincts pour cohabiter en local) :

| Env        | Fichier                | Override Compose             | URL (proxy)             | Branche/déclencheur     |
| ---------- | ---------------------- | ---------------------------- | ----------------------- | ----------------------- |
| dev        | `.env`                 | `docker-compose.yml`         | <http://localhost:8080> | local                   |
| staging    | `.env.staging`         | `+ docker-compose.staging.yml` | <http://localhost:8081> | push sur `develop`      |
| production (simulée) | `.env.prod`  | `+ docker-compose.prod.yml`  | <http://localhost:8082> | tag `v*` (+ approbation) |

```bash
# staging local
docker compose -p shoplite-staging \
  -f docker-compose.yml -f docker-compose.staging.yml \
  --env-file .env.staging up -d --build
```

Les vrais fichiers `.env*` ne sont **jamais** commités (voir `.gitignore`). Des modèles `.env.example`, `.env.staging.example`, `.env.prod.example` documentent les variables attendues.

---

## CI/CD

| Workflow | Déclencheurs                              | Jobs                                                        |
| -------- | ----------------------------------------- | ---------------------------------------------------------- |
| **CI** (`.github/workflows/ci.yml`) | push, PR, tags `v*`, manuel | `lint` ∥ `test` (matrix Node 18/20 + service PostgreSQL) ∥ `audit` → `docker` (build + scan Trivy) |
| **CD** (`.github/workflows/cd.yml`) | push `develop`, tags `v*`, manuel | `build-and-push` (GHCR) → `deploy-staging` / `deploy-production` (smoke test) |

Points clés : cache npm, `needs:` (build après tests verts), `if:` (déploiement conditionné à la branche/tag), artefact de couverture, environnement `production` protégé par **validation manuelle**.

---

## Observabilité

- **`/health`** : `api`, `database`, `version`, `uptime_s`, `timestamp`.
- **`/ready`** : readiness consommée par le healthcheck Compose (le proxy attend l'API `service_healthy`).
- **Logs JSON structurés** avec niveaux `DEBUG/INFO/WARN/ERROR/FATAL`, **`request_id`** propagé (header `X-Request-Id`) et **sanitization** des secrets (mots de passe, tokens, chaînes de connexion masqués).
- **Rotation des logs** Docker (`json-file`, `max-size=10m`, `max-file=3`).
- **Centralisation (prod)** : en production réelle, ces logs JSON seraient expédiés vers une stack centralisée (Loki/Grafana, ELK ou Datadog) via un agent ; le format JSON les rend directement indexables.

Commandes de diagnostic :

```bash
docker compose ps
docker compose logs --tail=100 api
curl http://localhost:8080/api/health
docker inspect shoplite_api
```

### Tableau de suivi d'incident

| Heure | Symptôme | Cause | Commande utilisée | Résultat |
| ----- | -------- | ----- | ----------------- | -------- |
| 14:58 | `/api/products` → 500 | colonne `stock_qty` inexistante (release v1.1.0) | `docker compose logs api` | `column "stock_qty" does not exist` |
| 14:59 | catalogue vide côté front | idem | `./scripts/smoke-test.sh` | rouge |
| 15:00 | — | données OK | `curl /api/health` | db `ok` |
| 15:01 | retour stable | rollback image | `./scripts/rollback.sh v1.0.0` | vert, 3 produits |

---

## Backup & restauration

```bash
./scripts/backup.sh            # pg_dump horodaté dans ./backups + rétention 7
./scripts/restore-test.sh      # restaure le dernier dump dans une base TEMPORAIRE et vérifie
```

- Dumps stockés **hors conteneur** (`./backups`, monté depuis l'hôte).
- Rétention : 7 derniers dumps (configurable via `RETENTION`).
- `restore-test.sh` ne touche jamais la base de prod (base `shoplite_restore_test` jetable).

---

## Incident contrôlé & rollback

Scénario reproductible (validé de bout en bout) :

```bash
# 1. version stable
docker compose up -d --build           # v1.0.0, smoke test vert
./scripts/backup.sh                     # sauvegarde PostgreSQL

# 2. incident : déployer une image v1.1.0 cassée (colonne inexistante)
APP_VERSION=v1.1.0 docker compose up -d --no-deps api
curl -i http://localhost:8080/api/products      # -> 500
./scripts/smoke-test.sh                          # -> ROUGE

# 3. rollback SANS perte de données
./scripts/rollback.sh v1.0.0
./scripts/smoke-test.sh                          # -> VERT, 3 produits intacts
```

Deux mécanismes d'incident disponibles :

1. **Image/code** (canonique, ci-dessus) : image `v1.1.0` cassée → rollback vers `v1.0.0`, ou `git revert` du commit fautif.
2. **Config runtime** : `SIMULATE_INCIDENT=true` casse `/api/products` sans modifier le code (pratique pour casser un staging déjà déployé).

Détails : [docs/INCIDENT.md](docs/INCIDENT.md) · Rôles : [docs/RACI.md](docs/RACI.md).

> ⚠️ **Interdit pendant un rollback : `docker compose down -v`** (supprime le volume PostgreSQL).

---

## Sécurité

Checklist (détail dans [docs/INCIDENT.md](docs/INCIDENT.md) et le rapport) :

- [x] **Secrets** : aucun mot de passe réel dans Git/Dockerfile/image/logs ; `.env` gitignoré ; secrets masqués dans les logs.
- [x] **Ports** : seul `8080` (proxy) est exposé en dev ; `5432` n'est publié que pour le debug local (override).
- [x] **Dépendances** : `npm audit` + `npm outdated` en CI ; scan image **Trivy** (HIGH/CRITICAL).
- [x] **Image** : base figée `node:20-alpine`, multi-stage, utilisateur non-root, healthcheck.
- [x] **Rotation des secrets** : voir procédure dans [docs/INCIDENT.md](docs/INCIDENT.md).

### Taille de l'image API

Multi-stage (`api/Dockerfile`), `node_modules` de prod ≈ **6 Mo**. Le poids final est dominé par la base `node:20-alpine` :

| Plateforme         | Base node:20-alpine | Image finale |
| ------------------ | ------------------- | ------------ |
| linux/amd64 (CI)   | ~135 Mo             | **~145 Mo** ✅ (< 200 Mo) |
| arm64 (Apple Silicon) | ~194 Mo          | ~201 Mo (spécifique à l'arch) |

---

## Documentation complémentaire

| Document | Contenu |
| -------- | ------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagramme Mermaid (services, réseau, CI/CD) |
| [docs/INCIDENT.md](docs/INCIDENT.md)         | Rapport d'incident rempli + checklist sécurité |
| [docs/DORA.md](docs/DORA.md)                 | 4 indicateurs DORA |
| [docs/RACI.md](docs/RACI.md)                 | Matrice RACI + timeline incident |
| [CHANGELOG.md](CHANGELOG.md)                 | Historique des versions |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Branches, commits, PR, review |
