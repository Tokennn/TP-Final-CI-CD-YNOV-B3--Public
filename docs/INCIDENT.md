# Rapport d'incident — ShopLite

## Template

> Impact · Timeline · Diagnostic · Correction · Prévention.

---

## Incident #1 — `/api/products` renvoie 500 après la release v1.1.0

| Champ        | Valeur                                                       |
| ------------ | ----------------------------------------------------------- |
| Date         | 2026-06-14                                                   |
| Sévérité     | Majeure (catalogue indisponible, paiement non impacté)      |
| Environnement | staging puis détection avant prod                          |
| Version fautive | `v1.1.0` (image Docker)                                  |
| Version stable | `v1.0.0`                                                  |
| Statut       | **Clos** — rollback effectué, données conservées            |

### Impact

- `GET /api/products` retourne `500 Internal server error`.
- Le frontend affiche un catalogue vide ; le client signale que « les produits ne s'affichent plus ».
- `/api/health` et `/api/ready` restent **OK** : l'API et PostgreSQL fonctionnent, seul le code de la route est en cause. Aucune donnée perdue.

### Timeline

| Heure | Action | Responsable | Résultat |
| ----- | ------ | ----------- | -------- |
| 14:58 | Détection erreur `/api/products` | QA | Test/smoke rouge |
| 14:59 | Analyse des logs API | DevOps + Dév API | `column "stock_qty" does not exist` |
| 15:00 | Vérification PostgreSQL | DBA | `/health` db `ok`, 3 produits présents |
| 15:00 | Sauvegarde des logs + dump | DevOps + DBA | `logs/`, `backups/` créés |
| 15:01 | Décision de rollback | PO + Incident Manager | Rollback validé |
| 15:01 | `./scripts/rollback.sh v1.0.0` | DevOps | API redémarrée en v1.0.0 |
| 15:02 | Smoke test | QA | Vert, 3 produits |
| 15:03 | Communication finale | Incident Manager | Incident clos |

### Diagnostic

- **Git** : le commit de release v1.1.0 a introduit une colonne `stock_qty` dans la requête SQL de `/products`, colonne absente du schéma `database/init.sql`.
- **Logs** (JSON) : `{"level":"ERROR","message":"unhandled_error","error":"column \"stock_qty\" does not exist","request_id":"…"}`.
- **Tests** : le test d'intégration `products.integration.test.js` passe au rouge contre la base réelle ; les tests unitaires (DB mockée) ne suffisaient pas à eux seuls → la CI avec **service PostgreSQL** est ce qui aurait bloqué la release.

### Correction

1. Sauvegarde préventive : `./scripts/backup.sh` (dump horodaté).
2. Rollback image : `./scripts/rollback.sh v1.0.0` (recrée `api`/`frontend`, **sans** toucher au volume).
3. Côté code : `git revert <sha_du_commit_v1.1.0_cassé>` pour retirer la colonne fautive sur `main`.
4. Vérification : smoke test vert + `count = 3` produits → **aucune perte de données**.

### Message d'incident (communication)

> **Impact** : catalogue ShopLite indisponible (~5 min) en staging. **Cause** : régression SQL dans la release v1.1.0 (colonne inexistante). **Action** : rollback automatisé vers v1.0.0, données intactes. **Statut** : résolu, post-mortem ci-dessous.

### Prévention

- Rendre **bloquant** le test d'intégration `/products` en CI (déjà branché sur un service PostgreSQL).
- Faire échouer la CI sous 80 % de couverture (déjà en place).
- Toute modification de schéma passe par une **migration non destructive** + revue DBA.
- Smoke test post-déploiement obligatoire avant promotion staging → prod.

---

## Checklist sécurité (DevSecOps)

| Domaine | Contrôle | Statut | Risque |
| ------- | -------- | ------ | ------ |
| Secrets | Aucun mot de passe réel dans Git / Dockerfile / image / logs | ✅ | Critique si violé |
| Secrets | `.env*` gitignorés, seuls les `*.example` commités | ✅ | Critique |
| Logs    | Sanitization (passwords, tokens, `postgres://user:***@`) | ✅ | Moyen |
| Ports   | Seul `8080` exposé en dev ; `5432` publié uniquement en debug | ✅ | Moyen |
| Image   | Base figée `node:20-alpine`, non-root, multi-stage | ✅ | Faible |
| Deps    | `npm audit` + `npm outdated` + Trivy en CI | ✅ | Variable |

### Rotation des secrets (procédure)

- **Quand** : tous les 90 jours, et immédiatement après tout départ ou suspicion de fuite.
- **Comment** :
  1. Générer un nouveau `POSTGRES_PASSWORD` (gestionnaire de secrets).
  2. Mettre à jour les **GitHub Secrets** par environnement (`dev`/`staging`/`production`).
  3. Mettre à jour `.env` local et `DATABASE_URL`.
  4. Recréer les services : `docker compose up -d` (sans `-v`).
  5. Révoquer l'ancien secret.
