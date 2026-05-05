# Musiky — Infrastructure Design

## Server Instance

| Property       | Value                          |
|----------------|-------------------------------|
| Provider       | DigitalOcean                  |
| Plan           | Basic — $6/month              |
| vCPU           | 1                             |
| RAM            | 512 MB (+ 2 GB swap)          |
| Disk           | 10 GB SSD                     |
| OS             | Debian 12 (Bookworm)          |
| Region         | AMS3 (Amsterdam)              |
| IP             | 174.138.1.11                  |

## Architecture

```
Internet
    │
    ▼
 UFW Firewall
 (allow: 22, 80, 443 only)
    │
    ▼
 Docker Engine
    │
    ├─── frontend network ───────────────┐
    │         │                          │
    │    [web :3000]               [api :8000]
    │    Next.js                   FastAPI
    │                                   │
    └─── backend network ───────────────┤
                                        │
                                   [db :5432]
                                   PostgreSQL
                                   (no exposed ports)
```

**Network isolation rules:**
- `web` can only reach `api` (frontend network)
- `api` can reach both `db` (backend) and `web` (frontend)
- `db` is only reachable by `api` — the web container has zero direct database access

## Memory Budget

| Service   | Limit  | Reserved |
|-----------|--------|----------|
| db        | 200 MB | 100 MB   |
| api       | 180 MB | 100 MB   |
| web       | 180 MB | 100 MB   |
| OS + Docker | ~80 MB | —      |
| **Total** | **640 MB** | **300 MB** |

The 2 GB swap file (created by `init_server.sh`) covers the difference during cold start and traffic spikes. Under normal load, steady-state RAM usage is ~350–400 MB.

## Port Exposure

| Port | Service    | Exposed to Internet | Exposed to Docker network |
|------|------------|---------------------|--------------------------|
| 22   | SSH        | Yes (UFW)           | —                        |
| 80   | HTTP       | Yes (UFW)           | —                        |
| 443  | HTTPS      | Yes (UFW)           | —                        |
| 3000 | Next.js    | No                  | frontend network          |
| 8000 | FastAPI    | No                  | frontend + backend        |
| 5432 | PostgreSQL | No                  | backend network only      |

## Scale-Up Path

When to upgrade: RAM consistently above 80% (>410 MB) for more than 10 minutes.

| Plan    | Cost/mo | RAM   | vCPU |
|---------|---------|-------|------|
| Current | $6      | 512 MB | 1   |
| Next    | $12     | 1 GB  | 1    |
| After   | $18     | 2 GB  | 2    |

Upgrade via DigitalOcean console → Droplet → Resize. Zero data loss (disk resize optional).

## Secrets Management

- `.env.example` is committed to git and documents every required variable
- `.env` is listed in `.gitignore` and never committed
- JWT secret generated with: `openssl rand -hex 32`
- On the server, `.env` is placed manually by the deploying user

## Log Rotation

Each Docker service uses the `json-file` logging driver with:
- `max-size: 10m` — each log file is capped at 10 MB
- `max-file: 3` — at most 3 rotated files per service

Maximum disk usage for logs: 3 services × 30 MB = **90 MB total**.
