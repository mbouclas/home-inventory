# syntax=docker/dockerfile:1.7
FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN bun run build

FROM base AS prod-deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS release

ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/app/data/pharmacy.db

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json ./

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["bun", "./build/index.js"]
