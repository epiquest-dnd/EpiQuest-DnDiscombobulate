# Image du serveur EpiQuest : API Express + site Vue construit (ADR-0007).
# Node exécute le TypeScript du serveur directement : pas d'étape de compilation pour le serveur.

ARG NODE_VERSION=22.22.2

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
# Fichiers nécessaires à `npm ci` dans un monorepo : chaque espace de travail doit exister.
COPY package.json package-lock.json .npmrc ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/rules-engine/package.json packages/rules-engine/

# --- Build du site web ---
FROM base AS web
# --ignore-scripts : le script `prepare` installe les hooks Git, inutiles ici.
RUN npm ci --ignore-scripts
COPY tsconfig.base.json ./
COPY packages packages
COPY apps/web apps/web
RUN npm run build --workspace @epiquest/web

# --- Image finale ---
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    WEB_DIST_DIR=/app/apps/web/dist
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY packages/shared/src packages/shared/src
COPY packages/rules-engine/src packages/rules-engine/src
COPY apps/server/src apps/server/src
COPY --from=web /app/apps/web/dist apps/web/dist

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "apps/server/src/index.ts"]
