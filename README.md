# Musiky

> *Music made together, paid apart.*

A web + Android workspace for independent musicians and small teams to manage a release end-to-end: track uploads, royalty splits, distribution status, expense ledger, revenue per platform, and the per-collaborator payouts that follow.

---
<img width="1024" height="1536" alt="408c2ceb-5abd-4852-a76f-9a54553e8027" src="https://github.com/user-attachments/assets/a485375b-3584-4503-ba6d-e0bbddc04345" />

## 📋 Enlaces de corrección

> Todos los diagramas, documentación, presentación, vídeo y documentación de seguimiento (Sprint 8) están en el Drive. El resto de enlaces de revisión se listan abajo.

| Elemento | Enlace |
|---|---|
| Web en producción | http://174.138.1.11:3000/ |
| GitHub | https://github.com/FennoGh/musiky.git |
| Documentación | https://drive.google.com/drive/u/0/folders/1QybwQm_nk6mtHty_D9hP5z-eICaLlqNg |
| Presentación final | https://drive.google.com/drive/u/0/folders/1QybwQm_nk6mtHty_D9hP5z-eICaLlqNg |
| Vídeo (web y móvil) | https://drive.google.com/drive/u/0/folders/1QybwQm_nk6mtHty_D9hP5z-eICaLlqNg |
| Documentación de seguimiento (Sprint 8) | https://drive.google.com/drive/u/0/folders/1QybwQm_nk6mtHty_D9hP5z-eICaLlqNg |
| Diagramas | https://drive.google.com/drive/u/0/folders/1QybwQm_nk6mtHty_D9hP5z-eICaLlqNg |
| Figma | https://www.figma.com/design/af5KLgAgLaFdRRSw0AgTra/Musiky-Figma?node-id=0-1&t=mkdrav43CB0Y0aVi-1 |

### Cuentas de prueba

| Email | Contraseña | Rol |
|---|---|---|
| `main@musiky.dev` | `musiky123` | Propietario (6 proyectos) |
| `mohamed@musiky.dev` | `musiky123` | Colaborador |
| `yussef@musiky.dev` | `musiky123` | Colaborador |

---

## ⚡ Quickstart (60 seconds, native dev)

Requires **Node 20+**, **Python 3.10+**, **PostgreSQL 15** running locally.

```bash
# 1. Database
sudo -u postgres createuser -s musiky
sudo -u postgres createdb musiky -O musiky
sudo -u postgres psql -c "ALTER USER musiky PASSWORD 'musiky_dev'"

# 2. Backend deps
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && cd ..

# 3. Frontend deps
cd frontend && npm install && cd ..

# 4. Root deps (concurrently)
npm install

# 5. Env (copy template, then edit creds)
cp .env.example .env

# 6. Schema + demo data
npm run db:migrate && npm run db:seed

# 7. Run web + api together
npm run dev
```

| URL | What |
|---|---|
| http://localhost:3000 | Web app |
| http://localhost:8000/health | API health probe |

For the **Docker** flow (`docker compose up --build`) and **Android** mobile launcher (`./bin/dev-mobile.sh`), see the SetupGuide in the Drive.

---

## 🏗️ Repo layout

```
musiky/
├── frontend/         Next.js 16 + React 19 + TS + Tailwind 4
├── backend/          Django 5 + DRF + SimpleJWT
├── android/          Capacitor 6 (WebView shell)
├── bin/              dev-mobile.sh — LAN-IP-aware launcher
├── infra/            Server bootstrap + deploy scripts
├── capacitor.config.ts
├── docker-compose.yml
├── package.json      Root concurrently script: `npm run dev`
└── README.md         (you are here)
```

---

## 🛠️ npm scripts (root)

| Script | What it does |
|---|---|
| `npm run dev` | Web + API together, hot reload (uses `concurrently`) |
| `npm run dev:web` | Just Next.js on `:3000` (delegates to `frontend/`) |
| `npm run dev:api` | Just Django runserver on `:8000` (delegates to `backend/`) |
| `npm run db:migrate` | Apply Django migrations |
| `npm run db:makemigrations` | Generate new migrations from model changes |
| `npm run db:seed` | Wipe + reseed demo data |
| `npm run db:shell` | Open Django shell |

For frontend-only commands (`build`, `lint`, `start`), `cd frontend && npm run …`.

---

## 🧱 Architecture at a glance

```
                  ┌──────────────┐         ┌──────────────┐
   Browser ─────▶│   Next.js    │────────▶│   Django     │
                  │  (port 3000) │  REST   │   + DRF      │
   Android ─────▶│  React 19    │  + JWT  │  (port 8000) │
                  │  Tailwind 4  │         │   SimpleJWT  │
                  └──────────────┘         └──────┬───────┘
                                                  │
                                            ┌─────▼──────┐
                                            │ PostgreSQL │
                                            │     15     │
                                            └────────────┘
```

- The web app is a **thin client** — every business rule (split residual logic, revenue fan-out, status guards) lives in the API.
- The Android app is **the same web app rendered in a Capacitor WebView**; one codebase, two surfaces.
- Three Docker services (`db`, `api`, `web`) on two isolated bridge networks. The web container has no direct DB access.

---

## 🚀 Production deployment

Live on a single DigitalOcean droplet via Docker Compose:

```bash
docker compose up -d --build
```

The `db`, `api` (Django + Gunicorn), and `web` (Next.js standalone) services are wired together via two isolated bridge networks. See [`infra/`](./infra/) for the rsync-based deploy flow and the TechnicalDocumentation in the Drive for production specifics.

---

## 🧪 Tech stack at a glance

**Frontend:** TypeScript, Next.js 16, React 19, Tailwind CSS v4, Framer Motion, ESLint
**Backend:** Python 3.12, Django 5.1, Django REST Framework 3.15, SimpleJWT, psycopg 3, Gunicorn
**Database:** PostgreSQL 15 (Django ORM + migrations)
**Mobile:** Capacitor 6, Gradle, JDK 17
**Production:** Debian 12 + Docker Compose on DigitalOcean (1 vCPU / 512 MB)
**Ops:** Bash + Python scripts, Locust for load testing

For the version-pinned full list, see the documentation in the Drive (link at the top).
