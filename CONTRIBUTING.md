# Contribuer à ShopLite

## Stratégie de branches

| Branche      | Rôle                                    | Déploiement        |
| ------------ | --------------------------------------- | ------------------ |
| `main`       | code stable, taggable (`v*`)            | production (tag)   |
| `develop`    | intégration continue des features       | staging (auto)     |
| `feature/*`  | nouvelle fonctionnalité                  | —                  |
| `hotfix/*`   | correctif urgent depuis `main`           | → `main` + `develop` |

Flux : `feature/*` → PR vers `develop` → (validation staging) → `develop` → PR vers `main` → tag `vX.Y.Z` → production.

Un **hotfix** part de `main`, est corrigé, mergé dans `main` **et** reporté dans `develop`.

## Commits conventionnels

Format : `type(scope): message court`.

| Type    | Usage                          |
| ------- | ------------------------------ |
| `feat`  | nouvelle fonctionnalité        |
| `fix`   | correction de bug              |
| `test`  | ajout/modif de tests           |
| `docs`  | documentation                  |
| `ci`    | CI/CD, workflows               |
| `chore` | tâches diverses, config        |
| `refactor` | refactorisation sans bug fix |

Exemples : `feat(api): ajoute /products/:id`, `fix(products): retire la colonne stock_qty`, `ci: ajoute le scan Trivy`.

## Pull Requests

- Une PR par fonctionnalité, vers `develop` (ou `main` pour un hotfix).
- Remplir le template (`.github/pull_request_template.md`) : objectif, vérifications, risques/rollback.
- **CI verte obligatoire** + **au moins une review** avant merge.
- Préférer le *squash merge* pour garder un historique lisible.

## Qualité avant de pousser

```bash
cd api
npm run lint
npm run format:check
npm test
```

## Protection de branche (`main` / `develop`)

À configurer dans GitHub → *Settings → Branches → Branch protection rules* :

- Require a pull request before merging (+ 1 approbation).
- Require status checks to pass (`CI`).
- Require branches to be up to date.
- (Optionnel) Require linear history.
