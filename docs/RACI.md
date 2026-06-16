# RACI & organisation d'équipe — ShopLite

## Légende

| Lettre | Signification | Explication |
| ------ | ------------- | ----------- |
| **R** | Responsible | réalise concrètement l'action |
| **A** | Accountable | porte la responsabilité finale, valide |
| **C** | Consulted | consulté avant/pendant |
| **I** | Informed | tenu informé du résultat |

## Rôles

| Rôle | Responsabilité principale |
| ---- | ------------------------- |
| **PO** | Product Owner — priorise l'impact métier, valide l'acceptabilité |
| **API** | Développeur backend — analyse/corrige la route |
| **Front** | Développeur frontend — vérifie l'affichage et l'impact utilisateur |
| **DevOps** | Release Manager — CI/CD, Docker, tags, déploiement, rollback |
| **DBA** | Référent données — backup PostgreSQL, intégrité |
| **QA** | Testeur — exécute les tests, prouve rouge/vert |
| **IM** | Incident Manager — coordonne, timeline, compte rendu |

## Matrice RACI

| Activité | PO | API | Front | DevOps | DBA | QA | IM |
| -------- | -- | --- | ----- | ------ | --- | -- | -- |
| Créer la version stable Git | A | R | C | R | I | C | I |
| Mettre en place Docker Compose | I | C | C | **A/R** | C | I | I |
| Configurer la CI/CD | I | C | I | **A/R** | I | C | I |
| Ajouter le test `/api/products` | I | C | I | C | I | **A/R** | I |
| Sauvegarder PostgreSQL | I | I | I | C | **A/R** | I | I |
| Provoquer l'incident contrôlé | C | R | I | A | I | C | I |
| Diagnostiquer l'incident | C | **R** | C | **R** | C | C | A |
| Décider le rollback | **A** | C | I | C | C | I | **R** |
| Exécuter le rollback | I | C | I | **A/R** | C | I | I |
| Vérifier les données après rollback | I | I | I | C | **A/R** | C | I |
| Valider les tests après rollback | I | C | C | C | I | **A/R** | I |
| Rédiger le rapport d'incident | C | C | I | C | C | C | **A/R** |

> Cette matrice est une proposition cohérente avec le scénario ShopLite. À ajuster selon la composition réelle de l'équipe (3 à 5 personnes → cumul de rôles).

## Composition de l'équipe

| Membre | Rôles tenus | Contribution Git |
| ------ | ----------- | ---------------- |
| **Tokennn** | DevOps / Release Manager, Dév API, DBA, QA, Incident Manager | 21 commits (toute la chaîne DevOps) |
| **AKTAS Semih** | Développeur Frontend | 1 commit (ajustement de l'affichage catalogue) |

> Équipe réduite : les rôles sont cumulés. La répartition ci-dessous reflète la contribution réelle constatée dans l'historique Git (`git log --all`).

## Qui a réellement fait quoi

| Activité | Personne(s) | Preuve |
| -------- | ----------- | ------ |
| Version stable Git + tags | Tokennn | `git tag` → `v1.0.0`, `v1.1.0` |
| Docker / Compose | Tokennn | commit `feat(docker)` ; `docker compose ps` (services healthy) |
| CI/CD | Tokennn | commit `ci:` ; `.github/workflows/ci.yml` + `cd.yml` |
| Test `/api/products` | Tokennn | `api/tests/products.test.js` + `products.integration.test.js` ; `npm test` |
| Frontend / affichage catalogue | AKTAS Semih | commit `073070e` (`frontend/src/style.css`) |
| Sauvegarder PostgreSQL | Tokennn | `scripts/backup.sh` ; `backups/*.sql` |
| Incident contrôlé | Tokennn | commit fautif `caaf882` (colonne `stock_qty`) → `/products` 500 |
| Diagnostiquer l'incident | Tokennn | logs JSON API + test d'intégration rouge |
| Rollback | Tokennn | sortie `scripts/rollback.sh v1.0.0` |
| Vérifier les données après rollback | Tokennn | `/api/products` → `count: 3` (données conservées) |
| Rédiger le rapport d'incident | Tokennn | `docs/INCIDENT.md` |

## Timeline incident (rappel)

| Heure | Action | Responsable | Résultat |
| ----- | ------ | ----------- | -------- |
| 14:58 | Détection erreur `/api/products` | QA | Test rouge |
| 14:59 | Analyse logs API | DevOps + API | Erreur route products |
| 15:00 | Vérification PostgreSQL | DBA | Données présentes |
| 15:01 | Décision rollback | PO + IM | Rollback validé |
| 15:01 | `rollback.sh v1.0.0` | DevOps | API redémarrée |
| 15:02 | Smoke test | QA | Tests verts |
| 15:03 | Communication finale | IM | Incident clos |
