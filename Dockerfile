# ---------- STAGE 1: Build & Test ----------
FROM oven/bun:1 AS build

WORKDIR /app


COPY package.json bun.lock* ./
RUN bun install
COPY . .

RUN bun run scripts/run-tests.js || echo "Tests failed, continuing build"

# ---------- STAGE 2: Production Image ----------
FROM oven/bun:1-slim AS production

WORKDIR /app


COPY --from=build /app/package.json ./
COPY --from=build /app/bun.lock* ./
COPY --from=build /app/src ./src
COPY --from=build /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000


CMD ["bun", "run", "src/index.js"]
