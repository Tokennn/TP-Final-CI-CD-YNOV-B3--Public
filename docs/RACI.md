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

## Qui a fait quoi (à remplir par l'équipe)

| Activité | Personne(s) | Preuve |
| -------- | ----------- | ------ |
| Version stable Git + tags | … | `git tag` |
| Docker / Compose | … | `docker compose ps` |
| CI/CD | … | runs GitHub Actions |
| Test `/api/products` | … | `npm test` |
| Backup PostgreSQL | … | `backups/*.sql` |
| Incident contrôlé | … | logs 500 |
| Rollback | … | sortie `rollback.sh` |
| Rapport d'incident | … | `docs/INCIDENT.md` |

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
