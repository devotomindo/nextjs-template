# Dependency Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update all npm packages to latest versions, update Docker image tags, and migrate the monitoring stack from Promtail to Grafana Alloy.

**Architecture:** Three independent change surfaces — npm packages (package.json + config fixes), Docker image tags (docker-compose files), and monitoring stack (alloy config + docker-compose.monitoring.yml). Changes are applied sequentially so each verification step has a clean baseline.

**Tech Stack:** pnpm, TypeScript 5.9.3 (unchanged), Next.js 16.2.2, ESLint 9.x, Grafana Alloy v1.14.0 (River syntax), Loki 3.7.1, Prometheus 3.10.0

---

## File Map

**Modified:**
- `package.json` — bump all package versions, update pnpm overrides
- `docker-compose.yml` — bump postgres, redis image tags
- `docker-compose.production.yml` — bump redis, caddy image tags
- `docker-compose.monitoring.yml` — replace promtail with alloy service, bump all image tags, increase Prometheus retention
- `monitoring/loki-config.yml` — increase retention 7d → 30d

**Created:**
- `monitoring/alloy-config.alloy` — Grafana Alloy River config (replaces promtail)

**Deleted:**
- `monitoring/promtail-config.yml`

---

## Task 1: Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Replace package.json content**

Replace the entire `package.json` with the following. Key changes from current:
- `next` + `eslint-config-next`: `16.1.6 → 16.2.2`
- `typescript`: stays at `^5.9.3` (latest 5.x, intentionally not upgrading to 6)
- `eslint`: `9.39.2 → 9.39.4` (NOT 10 — not yet supported by eslint-config-next)
- `lucide-react`: `0.576.0 → 1.7.0` (brand icons removed in v1; audit confirmed none used here)
- `better-auth` + `@better-auth/drizzle-adapter`: `1.5.3 → 1.5.6` (safe — breaking changes in 1.5.x only affect api-key plugin, email-otp, and test adapter, none of which this project uses)
- `@types/node`: `^22.19.0 → ^22.19.17` (stays on 22.x branch)
- `@types/react` override: `19.2.10 → 19.2.14`

```json
{
  "name": "nextjs-template",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "check": "pnpm typecheck && pnpm lint",
    "typecheck": "tsc --noEmit",
    "lint": "oxlint && eslint",
    "format": "prettier --write src",
    "format:check": "prettier --check src",
    "db:generate": "pnpm drizzle-kit generate",
    "db:migrate": "pnpm drizzle-kit migrate",
    "db:push": "pnpm drizzle-kit push",
    "db:studio": "pnpm drizzle-kit studio",
    "db:seed": "pnpm with-env tsx src/db/seeds/index.ts",
    "with-env": "dotenv -e .env -- "
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.1023.0",
    "@aws-sdk/lib-storage": "^3.1023.0",
    "@aws-sdk/s3-request-presigner": "^3.1023.0",
    "@better-auth/drizzle-adapter": "^1.5.6",
    "@fortedigital/nextjs-cache-handler": "^3.2.0",
    "@hookform/resolvers": "^5.2.2",
    "@orpc/client": "^1.13.13",
    "@orpc/server": "^1.13.13",
    "@orpc/tanstack-query": "^1.13.13",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@t3-oss/env-nextjs": "^0.13.11",
    "@tanstack/match-sorter-utils": "^8.19.4",
    "@tanstack/react-query": "^5.96.2",
    "@tanstack/react-query-devtools": "^5.96.2",
    "@tanstack/react-table": "^8.21.3",
    "better-auth": "^1.5.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.45.2",
    "lucide-react": "^1.7.0",
    "next": "16.2.2",
    "next-themes": "^0.4.6",
    "nextjs-toploader": "^3.9.17",
    "pg": "^8.20.0",
    "pino": "^10.3.1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-hook-form": "^7.72.1",
    "redis": "^5.11.0",
    "server-only": "^0.0.1",
    "sharp": "^0.34.5",
    "sonner": "^2.0.7",
    "superjson": "^2.2.6",
    "tailwind-merge": "^3.5.0",
    "uuid": "^13.0.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.5",
    "@tailwindcss/postcss": "^4.2.2",
    "@tanstack/eslint-plugin-query": "^5.96.2",
    "@types/node": "^22.19.17",
    "@types/pg": "^8.20.0",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "babel-plugin-react-compiler": "^1.0.0",
    "dotenv-cli": "^11.0.0",
    "drizzle-kit": "^0.31.10",
    "eslint": "^9.39.4",
    "eslint-config-next": "16.2.2",
    "eslint-plugin-oxlint": "^1.58.0",
    "oxlint": "^1.58.0",
    "pino-pretty": "^13.1.3",
    "prettier": "^3.8.1",
    "prettier-plugin-organize-imports": "^4.3.0",
    "prettier-plugin-tailwindcss": "^0.7.2",
    "tailwindcss": "^4.2.2",
    "tsx": "^4.21.0",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5.9.3"
  },
  "pnpm": {
    "overrides": {
      "@types/react": "19.2.14",
      "@types/react-dom": "19.2.3"
    }
  }
}
```

- [ ] **Step 2: Install updated dependencies**

```bash
pnpm install
```

Expected: lock file updated, no unresolved peer dependency errors.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: update npm dependencies to latest versions"
```

---

## Task 2: Update Docker image tags

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docker-compose.production.yml`

- [ ] **Step 1: Update docker-compose.yml**

Change the following image tags (MinIO is unchanged):

```yaml
# postgres: 18.1 → 18.3
image: postgres:18.3

# edoburu/pgbouncer: already at latest v1.25.1-p0 — no change needed
```

Full updated `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:18.3
    restart: always
    command: ["postgres", "-c", "jit=off"]
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - ./docker_data/postgres_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgbouncer:
    image: edoburu/pgbouncer:v1.25.1-p0
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: ${POSTGRES_DB}
      LISTEN_PORT: 6432
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 50
      AUTH_TYPE: scram-sha-256
      ADMIN_USERS: ${POSTGRES_USER}
      # SERVER_TLS_SSLMODE: require # Uncomment if you need TLS between pgbouncer and postgres
    ports:
      - "${PGBOUNCER_PORT:-6432}:6432"
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U ${POSTGRES_USER} -h localhost -p 6432 -d ${POSTGRES_DB} || exit 1",
        ]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: quay.io/minio/minio:RELEASE.2025-04-22T22-12-26Z
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "${MINIO_PORT:-9000}:9000"
      - "${MINIO_CONSOLE_PORT:-9001}:9001"
    volumes:
      - ./docker_data/minio_data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
```

- [ ] **Step 2: Update docker-compose.production.yml**

Change the following image tags:

```yaml
# redis: 8.4-alpine → 8.6.2-alpine
image: redis:8.6.2-alpine

# caddy: 2.10.2-alpine → 2.11.2-alpine
image: caddy:2.11.2-alpine
```

Full updated `docker-compose.production.yml`:

```yaml
x-logging: &default-logging
  driver: "json-file"
  options:
    max-size: "20m"
    max-file: "10"

services:
  postgres:
    logging: *default-logging
    extends:
      file: docker-compose.yml
      service: postgres

  pgbouncer:
    logging: *default-logging
    extends:
      file: docker-compose.yml
      service: pgbouncer

  minio:
    logging: *default-logging
    extends:
      file: docker-compose.yml
      service: minio

  redis:
    logging: *default-logging
    image: redis:8.6.2-alpine
    restart: always
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - ./docker_data/redis_data:/data
    command: redis-server --save 60 1 --loglevel warning --requirepass ${REDIS_ACCESS_KEY}
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_ACCESS_KEY}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nextjs:
    depends_on:
      postgres:
        condition: service_healthy
      pgbouncer:
        condition: service_healthy
      minio:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
      - DATABASE_URL=${DATABASE_URL}
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - REDIS_URL=${REDIS_URL}
      - REDIS_ACCESS_KEY=${REDIS_ACCESS_KEY}
    build:
      context: .
      dockerfile: Dockerfile
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "10"
    restart: always
    expose:
      - 3000

  caddy:
    logging: *default-logging
    image: caddy:2.11.2-alpine
    restart: always
    ports:
      - ${CADDY_HTTP_PORT:-80}:80
      - ${CADDY_HTTPS_PORT:-443}:443
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./docker_data/caddy_data:/data
      - ./docker_data/caddy_config:/config
    depends_on:
      - nextjs
```

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml docker-compose.production.yml
git commit -m "chore: update docker image tags"
```

---

## Task 3: Migrate monitoring stack (Promtail → Grafana Alloy)

**Files:**
- Create: `monitoring/alloy-config.alloy`
- Delete: `monitoring/promtail-config.yml`
- Modify: `monitoring/loki-config.yml`
- Modify: `docker-compose.monitoring.yml`

- [ ] **Step 1: Create the Alloy config**

Create `monitoring/alloy-config.alloy` with the following content. This replicates the exact behaviour of the deleted promtail config: Docker container discovery, stripping the leading `/` from container names, parsing Pino's numeric log levels to strings, and promoting `level`, `module`, and `container_name` as Loki labels.

```alloy
// Discover all running Docker containers via the Docker socket.
discovery.docker "containers" {
  host             = "unix:///var/run/docker.sock"
  refresh_interval = "5s"
}

// Relabel discovered targets:
//   - Strip the leading "/" from container names (e.g. /myapp → myapp)
//   - Capture the log stream (stdout/stderr) as a label
discovery.relabel "docker" {
  targets = discovery.docker.containers.targets

  rule {
    source_labels = ["__meta_docker_container_name"]
    regex         = "/(.*)"
    target_label  = "container_name"
  }

  rule {
    source_labels = ["__meta_docker_container_log_stream"]
    target_label  = "stream"
  }
}

// Tail logs from each discovered container and apply the relabeling rules.
loki.source.docker "docker" {
  host             = "unix:///var/run/docker.sock"
  targets          = discovery.relabel.docker.output
  forward_to       = [loki.process.pipeline.receiver]
  relabeling_rules = discovery.relabel.docker.rules
}

// Processing pipeline — equivalent to promtail's pipeline_stages.
loki.process "pipeline" {
  forward_to = [loki.write.default.receiver]

  // Unwrap Docker's JSON-file log driver format.
  // Sets the log line to the inner message and populates the "output" extracted variable.
  stage.docker {}

  // Extract "level" and "module" from Pino JSON logs.
  // source = "output" means: parse the inner log line (set by stage.docker) as JSON.
  // Non-Pino containers produce non-JSON output — the stage skips gracefully.
  stage.json {
    expressions = {
      level  = "level",
      module = "module",
    }
    source = "output"
  }

  // Convert Pino's numeric level to a human-readable string.
  // Non-numeric or missing values pass through unchanged.
  stage.template {
    source   = "level"
    template = "{{ if eq .Value \"10\" }}trace{{ else if eq .Value \"20\" }}debug{{ else if eq .Value \"30\" }}info{{ else if eq .Value \"40\" }}warn{{ else if eq .Value \"50\" }}error{{ else if eq .Value \"60\" }}fatal{{ else }}{{ .Value }}{{ end }}"
  }

  // Promote extracted variables to Loki stream labels.
  // Empty string value means: use the extracted variable with the same name as the key.
  stage.labels {
    values = {
      level          = "",
      module         = "",
      container_name = "",
    }
  }
}

// Push collected logs to Loki.
loki.write "default" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}
```

- [ ] **Step 2: Delete promtail config**

```bash
rm monitoring/promtail-config.yml
```

- [ ] **Step 3: Increase Loki retention to 30 days**

In `monitoring/loki-config.yml`, change `retention_period` from `168h` to `720h`:

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /loki
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: "2024-01-01"
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

storage_config:
  filesystem:
    directory: /loki/chunks

limits_config:
  retention_period: 720h # 30 days

compactor:
  working_directory: /loki/compactor
  compaction_interval: 10m
  retention_enabled: true
  retention_delete_delay: 2h
  delete_request_store: filesystem
```

- [ ] **Step 4: Update docker-compose.monitoring.yml**

Replace the entire file. Changes:
- `promtail` service removed, `alloy` service added
- `loki`: `3.4.3 → 3.7.1`
- `prometheus`: `v3.4.1 → v3.10.0`, retention `7d → 30d`
- `cadvisor`: `gcr.io/cadvisor/cadvisor:v0.51.0 → ghcr.io/google/cadvisor:v0.56.0` (registry moved at v0.53+)
- `grafana`: `11.6.0 → 12.4.2`

```yaml
services:
  alloy:
    image: grafana/alloy:v1.14.0
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./monitoring/alloy-config.alloy:/etc/alloy/config.alloy:ro
    command: run --server.http.listen-addr=0.0.0.0:12345 /etc/alloy/config.alloy
    depends_on:
      - loki

  loki:
    image: grafana/loki:3.7.1
    restart: always
    volumes:
      - ./monitoring/loki-config.yml:/etc/loki/config.yml:ro
      - ./docker_data/loki_data:/loki
    command: -config.file=/etc/loki/config.yml
    expose:
      - 3100

  prometheus:
    image: prom/prometheus:v3.10.0
    restart: always
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./docker_data/prometheus_data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=30d"
    expose:
      - 9090

  cadvisor:
    image: ghcr.io/google/cadvisor:v0.56.0
    restart: always
    privileged: true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /sys:/sys:ro
      - /var/lib/docker:/var/lib/docker:ro
    expose:
      - 8080

  grafana:
    image: grafana/grafana:12.4.2
    restart: always
    ports:
      - "${GRAFANA_PORT:-3100}:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./monitoring/grafana/dashboards:/etc/grafana/dashboards:ro
      - ./docker_data/grafana_data:/var/lib/grafana
    depends_on:
      - loki
      - prometheus
```

- [ ] **Step 5: Commit**

```bash
git add monitoring/alloy-config.alloy monitoring/loki-config.yml docker-compose.monitoring.yml
git rm monitoring/promtail-config.yml
git commit -m "chore: migrate monitoring from Promtail to Grafana Alloy, increase retention to 30d"
```

---

## Task 4: Verify

**Files:** none modified

- [ ] **Step 1: Run typecheck + lint**

```bash
pnpm check
```

Expected: exits with code 0. If lint errors appear from oxlint/eslint version bumps (new rules enabled), fix them — do not suppress with `// eslint-disable` unless the rule is genuinely inapplicable.

- [ ] **Step 2: Run production build**

```bash
pnpm build
```

Expected: build completes successfully. If Next.js 16.2.2 surfaces new warnings or errors, fix the root cause.

- [ ] **Step 3: Commit if any fixes were needed**

If `pnpm check` or `pnpm build` required code changes:

```bash
git add -A
git commit -m "fix: resolve issues surfaced by updated dependencies"
```
