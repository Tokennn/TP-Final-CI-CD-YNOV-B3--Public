# syntax=docker/dockerfile:1

###############################################################################
# Stage 1 - deps : installe uniquement les dépendances de production.
# Isolé pour profiter du cache Docker (rebuild rapide si seul le code change).
###############################################################################
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

###############################################################################
# Stage 2 - runtime : image finale, minimale, sans devDependencies ni outils
# de build. On copie node_modules depuis `deps` et le code source.
###############################################################################
FROM node:20-alpine AS runtime

# Version applicative injectée au build (liée au tag Git / image Docker).
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=production
ENV API_PORT=3000

# Labels OCI : permettent d'identifier la version déployée lors d'un rollback
# (docker inspect ... | grep org.opencontainers).
LABEL org.opencontainers.image.title="shoplite-api" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.source="https://github.com/Tokennn/TP-Final-CI-CD-YNOV-B3--Public"

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

# Exécution sans privilèges (l'utilisateur `node` existe dans l'image officielle).
USER node

EXPOSE 3000

# Healthcheck conteneur sur /health (busybox wget est présent dans alpine).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
