# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN groupadd --system app && useradd --system --gid app --create-home app
WORKDIR /app
COPY --from=build --chown=app:app /app/dist/standalone/ ./

USER app
EXPOSE 3000
CMD ["node", "server.js"]
