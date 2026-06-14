# Architecture — ShopLite

## Vue d'ensemble (runtime)

```mermaid
flowchart LR
  user([Navigateur]) -->|HTTP 8080| proxy[nginx proxy]

  subgraph net["réseau docker: shoplite_net"]
    proxy -->|/| frontend[frontend<br/>nginx static]
    proxy -->|/api/*| api[API Node/Express<br/>:3000]
    api -->|SQL 5432| db[(PostgreSQL 16)]
  end

  db --- vol[("volume nommé<br/>shoplite_pgdata")]

  api -.->|/health /ready<br/>logs JSON| obs[[Observabilité]]
```

- **Point d'entrée unique** : le proxy nginx expose le port `8080` et route `/` vers le frontend et `/api/*` vers l'API.
- **Communication interne** : l'API joint la base via le **nom de service** `db` (DNS interne Docker), jamais via `localhost`.
- **Persistance** : la donnée vit dans le volume nommé `shoplite_pgdata`, indépendant du cycle de vie des conteneurs → survit aux `up`/`down` et aux rollbacks.
- **Démarrage ordonné** : `proxy` attend `api` (`service_healthy` sur `/ready`), qui attend `db` (`service_healthy` via `pg_isready`).

## Chaîne CI/CD

```mermaid
flowchart TB
  dev[feature/*] -->|PR| develop
  develop -->|push| ci{CI}
  ci -->|lint ∥ test+DB ∥ audit| build[build image + Trivy]
  develop -->|push| cd_s[CD: deploy staging<br/>+ smoke test]
  develop -->|PR| main
  main -->|tag v*| cd_p[CD: build+push GHCR<br/>deploy prod approuvé + smoke]
  cd_p -.->|incident| rollback[rollback.sh vX.Y.Z]
```

## Environnements

```mermaid
flowchart LR
  subgraph dev["dev (8080)"]
    d1[compose base]
  end
  subgraph stg["staging (8081)"]
    s1[+ compose.staging]
  end
  subgraph prod["production simulée (8082)"]
    p1[+ compose.prod<br/>images taguées]
  end
  d1 --> s1 --> p1
```

## Choix techniques

| Décision | Raison |
| -------- | ------ |
| Proxy nginx devant API + front | un seul port exposé, CORS simplifié, `X-Request-Id` injecté |
| Dockerfile multi-stage | image finale minimale (pas de devDeps ni cache de build) |
| Volume nommé pour PostgreSQL | persistance garantie, rollback sans perte |
| Images taguées en prod | déploiement déterministe, rollback vers un artefact connu |
| Logs JSON + request_id | corrélation des requêtes, prêts pour une centralisation |
