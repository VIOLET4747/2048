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
COPY --from=build --chown=app:app /app/node_modules/react ./node_modules/react
COPY --from=build --chown=app:app /app/node_modules/react-dom ./node_modules/react-dom
COPY --from=build --chown=app:app /app/node_modules/scheduler ./node_modules/scheduler

RUN node -e "Promise.all([import('react'), import('react-dom/server.edge'), import('vinext/server/prod-server')])"

USER app
EXPOSE 3000
CMD ["node", "server.js"]
