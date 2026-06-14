# Indicateurs DORA — ShopLite

Les 4 métriques [DORA](https://dora.dev/) mesurent la performance de livraison. Valeurs ci-dessous mesurées/estimées dans le contexte pédagogique du TP.

| Indicateur | Définition | Mesure ShopLite | Comment on le mesure ici |
| ---------- | ---------- | --------------- | ------------------------ |
| **Deployment Frequency** | Fréquence des déploiements en prod | Plusieurs/jour (à la demande, sur tag `v*`) | Nombre de tags `v*` déployés via `cd.yml` |
| **Lead Time for Changes** | Délai commit → production | ~minutes (CI ~2-4 min + déploiement) | Horodatage commit vs run CD réussi |
| **Change Failure Rate** | % de déploiements causant un incident | 1 incident sur 2 releases ≈ 50 % (v1.1.0) — biaisé par l'incident pédagogique volontaire | Incidents / déploiements |
| **MTTR** (Mean Time To Restore) | Temps moyen de rétablissement | **~5 min** (détection 14:58 → résolu 15:03) | Timeline de `docs/INCIDENT.md` |

## Détail du calcul (incident #1)

- **Détection** : 14:58 (smoke test rouge).
- **Restauration** : 15:03 (smoke vert après `rollback.sh v1.0.0`).
- **MTTR** = 5 minutes.

## Leviers d'amélioration

| Métrique | Levier |
| -------- | ------ |
| Lead Time | cache npm + jobs CI parallèles (déjà en place) |
| Change Failure Rate | test d'intégration `/products` bloquant + smoke test pré-promotion |
| MTTR | rollback scripté vers image taguée (`rollback.sh`), logs JSON corrélés |
| Deployment Frequency | déploiement staging automatique sur `develop` |

> Note : le *Change Failure Rate* élevé reflète l'**incident volontaire** du TP. Hors exercice, l'objectif visé est < 15 %.
