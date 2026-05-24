# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /app

# Reduce peak RAM during Vite/Nuxt build (small VPS OOM otherwise).
ENV NODE_OPTIONS=--max-old-space-size=2048

# Lockfile is generated with npm 11; stock node:22-alpine ships npm 10.
RUN npm install -g npm@11

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nuxtjs

COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nuxtjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nuxtjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nuxtjs:nodejs /app/node_modules ./node_modules
COPY --chown=nuxtjs:nodejs scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
# Ops: db:seed:cities (idempotent catalog upsert)
COPY --from=builder --chown=nuxtjs:nodejs /app/scripts/seed-cities.ts ./scripts/seed-cities.ts
COPY --from=builder --chown=nuxtjs:nodejs /app/shared/catalog/cities-ru.json ./shared/catalog/cities-ru.json
COPY --from=builder --chown=nuxtjs:nodejs /app/shared/catalog/countries.ts ./shared/catalog/countries.ts
COPY --from=builder --chown=nuxtjs:nodejs /app/server/db/schema ./server/db/schema

RUN chmod +x ./scripts/docker-entrypoint.sh

USER nuxtjs

EXPOSE 3000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
