# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versionnage [SemVer](https://semver.org/lang/fr/).

## [Unreleased]

- Rien pour le moment.

## [v1.1.0] - 2026-06-14

### Added

- Route `GET /products/:id` (404 si introuvable, 400 si id invalide).
- Paramètre `?limit=N` sur `GET /products` (validation → 400).
- Route `/ready` (readiness) + healthcheck Compose associé.
- Version applicative exposée par `/health` et affichée dans le frontend.
- Logs JSON structurés : niveaux, `request_id`, sanitization des secrets.
- Tests `products.test.js` + test d'intégration PostgreSQL ; seuil de couverture 80 %.
- CI/CD complets (lint, tests matrix + service DB, audit, build, Trivy ; staging/prod, smoke test).
- Scripts `backup.sh`, `restore-test.sh`, `rollback.sh`, `smoke-test.sh` fonctionnels.
- Documentation : ARCHITECTURE, INCIDENT, DORA, RACI ; README professionnel.

### Notes

- `v1.1.0` a aussi servi de support à l'**incident contrôlé** (image cassée), résolu par rollback vers `v1.0.0`.

## [v1.0.0] - 2026-06-14

### Added

- Première version stable industrialisée : API + frontend + PostgreSQL via Docker Compose.
- Dockerfile API multi-stage (node:20-alpine, non-root, healthcheck) < 200 Mo (amd64).
- Healthcheck `/health` détaillé, logs JSON, `.env` séparé du code.

## [0.1.0] - starter

- Projet starter ShopLite (base applicative fournie).

[Unreleased]: https://github.com/Tokennn/TP-Final-CI-CD-YNOV-B3--Public/compare/v1.1.0...HEAD
[v1.1.0]: https://github.com/Tokennn/TP-Final-CI-CD-YNOV-B3--Public/compare/v1.0.0...v1.1.0
[v1.0.0]: https://github.com/Tokennn/TP-Final-CI-CD-YNOV-B3--Public/releases/tag/v1.0.0
