# syntax=docker/dockerfile:1.7
FROM oven/bun:1-alpine AS bun-base
WORKDIR /app

FROM node:22-alpine AS node-base
WORKDIR /app

FROM bun-base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM node-base AS build
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN node ./node_modules/vite/bin/vite.js build

FROM bun-base AS prod-deps
RUN apk add --no-cache python3 make g++
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM node-base AS release

ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/app/data/pharmacy.db

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json ./

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "./build/index.js"]
