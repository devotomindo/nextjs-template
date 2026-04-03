# Dependency Update Design

**Date:** 2026-04-04

## Scope

Update all npm packages to latest versions and all Docker image tags (except MinIO), with accompanying config/syntax fixes. Migrate Promtail → Grafana Alloy in the monitoring stack.

---

## npm Package Updates

### Standard updates (latest minor/patch)

All packages updated to absolute latest. Notable jumps:

| Package | From | To |
|---|---|---|
| `next` + `eslint-config-next` | `16.1.6` | `16.2.2` |
| `@orpc/*` (client, server, tanstack-query) | `1.13.6` | `1.13.13` |
| `better-auth` + `@better-auth/drizzle-adapter` | `1.5.3` | `1.5.6` |
| `@tanstack/react-query` + devtools | `5.90.21` | `5.96.2` |
| `@tanstack/eslint-plugin-query` | `5.91.4` | `5.96.2` |
| `@aws-sdk/*` (client-s3, lib-storage, presigner) | `3.901.0` | `3.1023.0` |
| `@fortedigital/nextjs-cache-handler` | `3.0.1` | `3.2.0` |
| `drizzle-orm` | `0.45.1` | `0.45.2` |
| `drizzle-kit` | `0.31.9` | `0.31.10` |
| `lucide-react` | `0.576.0` | `1.7.0` |
| `react-hook-form` | `7.71.2` | `7.72.1` |
| `pg` + `@types/pg` | `8.19.0` / `8.18.0` | `8.20.0` |
| `tailwindcss` + `@tailwindcss/postcss` | `4.2.1` | `4.2.2` |
| `eslint-plugin-oxlint` + `oxlint` | `1.51.0` | `1.58.0` |
| `@t3-oss/env-nextjs` | `0.13.10` | `0.13.11` |

### Special cases

**TypeScript → `6.0.2`**
- Run `npx @andrewbranch/ts5to6` to automate mechanical migration
- Manual follow-up: audit `import * as X from "X"` patterns (interop tightened), ensure no `module Foo {}` (must be `namespace Foo {}`)
- ES2017 target is fine (ES5 is deprecated, ES2015 is minimum; project already above that)
- `strict: true` already set — no change needed

**ESLint → `9.39.4` (NOT 10)**
- `eslint-config-next` peer deps are incompatible with ESLint 10 as of March 2026 (vercel/next.js#91702, unresolved)
- Stay on latest 9.x; revisit when Next.js officially supports ESLint 10

**lucide-react → `1.7.0`**
- Only breaking change: brand icons removed
- Audit confirmed: codebase only uses utility icons (ChevronRight, Loader2, Eye, EyeOff, HomeIcon, PanelLeftIcon, XIcon, UserIcon, LucideIcon, CheckIcon, etc.)
- No migration work required

**`@types/node` → latest `22.x`**
- Pin to `^22` — do not jump to 25.x

**pnpm overrides**
- Update `@types/react` override from `19.2.10` → `19.2.14`

---

## Docker Image Updates

| Service | From | To | Notes |
|---|---|---|---|
| `postgres` | `18.1` | `18.3` | Patch |
| `edoburu/pgbouncer` | `v1.25.1-p0` | `v1.25.1-p0` | Already latest |
| `redis` | `8.4-alpine` | `8.6.2-alpine` | Minor |
| `caddy` | `2.10.2-alpine` | `2.11.2-alpine` | Minor |
| `prom/prometheus` | `v3.4.1` | `v3.10.0` | Minor |
| `grafana/loki` | `3.4.3` | `3.7.1` | Minor |
| `grafana/grafana` | `11.6.0` | `12.4.2` | Major — see below |
| `grafana/promtail` | `3.4.3` | **removed** | EOL March 2026 |
| `gcr.io/cadvisor/cadvisor` | `v0.51.0` | `ghcr.io/google/cadvisor:v0.56.0` | Registry changed at v0.53+ |
| MinIO | — | **unchanged** | Explicitly excluded |

**Grafana 12.4.2** — major version from 11.6.0. Pre-provisioned datasources (Loki, Prometheus) and pre-built dashboards (`docker-logs.json`, `docker-metrics.json`) remain compatible; provisioning format unchanged.

---

## Monitoring Stack: Promtail → Grafana Alloy

### What changes

- `monitoring/promtail-config.yml` — **deleted**
- `monitoring/alloy-config.alloy` — **new** (River syntax)
- `docker-compose.monitoring.yml` — `promtail` service replaced with `alloy` service

### Alloy config behaviour (equivalent to current Promtail pipeline)

1. `discovery.docker` — discovers all running Docker containers via `/var/run/docker.sock`
2. `discovery.relabel` — strips leading `/` from container names, captures log stream
3. `loki.source.docker` — tails container logs using discovered targets
4. `loki.process` — pipeline stages:
   - `stage.docker {}` — unwraps Docker JSON log format
   - `stage.json` — extracts `level` and `module` from Pino JSON logs
   - `stage.template` — converts Pino numeric levels to strings (10→trace, 20→debug, 30→info, 40→warn, 50→error, 60→fatal)
   - `stage.labels` — promotes `level`, `module`, `container_name` to Loki stream labels
5. `loki.write` — pushes to `http://loki:3100/loki/api/v1/push`

### Retention increase

| Store | From | To |
|---|---|---|
| Loki (`loki-config.yml` `retention_period`) | `168h` (7d) | `720h` (30d) |
| Prometheus (`docker-compose.monitoring.yml` `--storage.tsdb.retention.time`) | `7d` | `30d` |

Data persists across container rebuilds in `docker_data/loki_data` and `docker_data/prometheus_data` volumes.

### Log + metric correlation

No additional work required. Grafana Explore split view (Loki left, Prometheus right) synchronises time ranges — clicking a log line at any timestamp shows CPU/memory at that exact moment. Pre-provisioned datasources already wired.

---

## Verification

After all changes:

1. `pnpm install` — install updated deps
2. `pnpm check` — typecheck + lint (must pass clean)
3. `pnpm build` — production build (must succeed)
4. Review any TypeScript 6 errors surfaced by `ts5to6` tool output
