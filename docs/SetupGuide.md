# Musiky — Setup Guide

Step-by-step instructions to take a fresh clone of this repository and get the full stack running locally — web, API, database, and (optionally) the Android app.

If something goes wrong, jump to [Troubleshooting](#troubleshooting) at the bottom.

---

## 0. What you'll have at the end

| Surface | URL | Default credentials (after seeding) |
|---|---|---|
| Web app | http://localhost:3000 | `main@musiky.dev` / `musiky123` |
| API | http://localhost:8000 | JWT (obtain via `POST /auth/login`) |
| Health probe | http://localhost:8000/health | `{"status": "ok"}` |
| PostgreSQL | localhost:5432 | user `musiky`, password set in `.env` |

There are two parallel paths: **A) native** (run servers directly on your machine — fastest dev loop, hot reload) or **B) Docker** (one command, fully self-contained, closest to production). Pick one.

---

## A) Native setup (recommended for development)

### A.1 — Prerequisites

Install the following and verify versions:

```bash
node --version       # ≥ 20
python3 --version    # ≥ 3.10
psql --version       # ≥ 15
git --version        # any
```

If you're missing PostgreSQL: `sudo apt install postgresql-15` (Debian/Ubuntu) or `brew install postgresql@15` (macOS).

### A.2 — Clone

```bash
git clone <repo-url> musiky
cd musiky
```

### A.3 — Create the database

```bash
sudo -u postgres createuser -s musiky                                # superuser shortcut
sudo -u postgres createdb musiky -O musiky
sudo -u postgres psql -c "ALTER USER musiky PASSWORD 'musiky_dev'"
```

(On macOS, drop the `sudo -u postgres` prefix — your local user is the PG superuser.)

Verify with `psql -U musiky -h localhost -d musiky -c '\dt'` — should return `Did not find any relations.`

### A.4 — Configure environment

```bash
cp .env.example .env
```

Open `.env` in an editor and set:

```env
DATABASE_URL=postgres://musiky:musiky_dev@localhost:5432/musiky
DB_PASSWORD=musiky_dev
DJANGO_SECRET_KEY=anything-for-local-dev
DJANGO_DEBUG=True
JWT_SECRET=anything-for-local-dev
NEXT_PUBLIC_API_BASE=http://localhost:8000
SERVER_IP=localhost
```

The `CHANGE_ME` placeholders in `.env.example` are intentional — they force you to think about what value to use. For local dev, `musiky_dev` (matching the password from A.3) is the standard.

### A.5 — Install dependencies (3 places)

```bash
# Backend (Django)
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ..

# Frontend (Next.js)
cd frontend
npm install
cd ..

# Root (just `concurrently`, lets us run web + api with one command)
npm install
```

Total install time: ~2 minutes on a decent connection.

### A.6 — Apply migrations and seed demo data

```bash
npm run db:migrate    # creates 9 domain tables + Django auth/sessions tables
npm run db:seed       # inserts 3 users, 6 projects, 21 tracks, 13 collabs,
                      #          11 revenues, 24 payouts, 17 expenses, 12 platforms
```

Expected output ends with:
```
Seed complete.
Users: 3 · Projects: 6 · Tracks: 21 · Collaborators: 13
Revenues: 11 · Payouts: 24 · Expenses: 17

Demo password (all 3 accounts): musiky123
```

### A.7 — Run

```bash
npm run dev
```

This starts both servers in parallel via `concurrently`:

```
[web] - Local:        http://localhost:3000
[api] - Starting development server at http://0.0.0.0:8000/
```

Open http://localhost:3000 in a browser and sign in with `main@musiky.dev` / `musiky123`. You should see the dashboard with 6 demo projects.

---

## B) Docker setup (one-command, production-like)

### B.1 — Prerequisites

```bash
docker --version          # ≥ 20
docker compose version    # ≥ v2 (compose plugin, not docker-compose)
```

### B.2 — Clone

```bash
git clone <repo-url> musiky
cd musiky
```

### B.3 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` — for Docker, the only required values are:

```env
DB_PASSWORD=musiky_dev
DJANGO_SECRET_KEY=anything
JWT_SECRET=anything
SERVER_IP=localhost
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

`DATABASE_URL` is set inside `docker-compose.yml` automatically and points at the `db` service.

### B.4 — Build and run

```bash
docker compose up --build
```

First build takes ~3-5 minutes (downloads Postgres, Node, Python images, runs `npm ci`, runs `next build`, runs `pip install`).

The `api` container automatically applies migrations on startup (see `backend/Dockerfile` `CMD`).

### B.5 — Seed demo data (separate one-shot)

In a second terminal, while the stack is running:

```bash
docker compose exec api python manage.py seed_demo
```

Open http://localhost:3000 — same demo credentials as the native flow.

To stop everything: `Ctrl-C` in the compose terminal, then `docker compose down` to remove containers (data persists in the `pg_data` volume).

To start fresh: `docker compose down -v` (the `-v` wipes volumes too).

---

## C) Optional — Android (Capacitor)

Only do this if you want to run the Android app on a real device.

### C.1 — Prerequisites

- Android Studio (or `cmdline-tools` + JDK 17 + Android SDK 35)
- A physical Android device with USB debugging enabled, OR an emulator
- The laptop and the device on the **same Wi-Fi network**

### C.2 — Run

```bash
./bin/dev-mobile.sh
```

This script:

1. Detects your laptop's LAN IP (e.g. `192.168.1.42`).
2. Rewrites `frontend/.env.local` and `capacitor.config.ts` to point at that IP.
3. Updates Android's cleartext whitelist for that IP.
4. Restarts Django and Next on `0.0.0.0`.
5. Runs `npx cap sync` and `gradlew assembleDebug`.
6. Installs the APK on the connected device via `adb install -r`.
7. Launches the app.

If the IP hasn't changed since the last run and the APK is installed, step 5–7 are skipped (re-run with `FORCE=1` to force a full rebuild).

---

## D) Verifying everything works

Sanity checks you can run after starting the stack:

```bash
# 1. API health
curl http://localhost:8000/health
# → {"status": "ok"}

# 2. Login → get a token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"main@musiky.dev","password":"musiky123"}' \
  | python3 -c "import json,sys;print(json.load(sys.stdin)['access_token'])")
echo "Token length: ${#TOKEN}"

# 3. Authenticated /me
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/me

# 4. List projects (should be 6)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/projects \
  | python3 -c "import json,sys;print(len(json.load(sys.stdin)),'projects')"
```

In the browser:

1. Sign in at http://localhost:3000/login.
2. Click any project from the dashboard.
3. Click the **Collaborators**, **Revenues**, **Expenses**, **Distributions** tabs — all should load real demo data.
4. Open the browser dev tools' Network tab — every request should hit `localhost:8000/...` and return `200`.

---

## Troubleshooting

### "Failed to fetch" on login

The browser is trying to reach a URL that doesn't exist. Almost always one of:

- Your `.env` has `NEXT_PUBLIC_API_BASE` pointing somewhere unreachable (e.g. the production VPS IP). Set it to `http://localhost:8000` and **restart `npm run dev`** so Next.js re-reads the env.
- Django isn't actually listening — check the `[api]` lines in the terminal for an error. Most common: bad `DATABASE_URL` credentials.

### `psycopg.OperationalError: FATAL: password authentication failed`

The password in `DATABASE_URL` doesn't match the password on the local PG user. Re-run `ALTER USER musiky PASSWORD 'musiky_dev'` and update `.env` to match.

### `relation "users_user" does not exist`

Migrations weren't applied. Run `npm run db:migrate`.

### `next: not found`

You skipped `cd frontend && npm install`. Run it.

### `ModuleNotFoundError: No module named 'django'`

You skipped the backend venv setup, or the venv didn't finish installing (e.g. you Ctrl-C'd mid `pip install`). Recreate it:

```bash
rm -rf backend/.venv
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

### Port 3000 or 8000 already in use

```bash
lsof -tiTCP:3000 -sTCP:LISTEN | xargs -r kill
lsof -tiTCP:8000 -sTCP:LISTEN | xargs -r kill
```

### Docker: `bind: address already in use`

Same root cause — something else is on port 3000 or 8000. Kill it (above) or stop the existing `docker compose` instance first.

### CORS error in the browser console

The backend's CORS allowlist (`settings.CORS_ALLOWED_ORIGIN_REGEXES`) covers `localhost`, `127.0.0.1`, and RFC1918 LAN ranges. If you're hitting the API from somewhere else (a tunnel, a remote IP), add a regex for that origin.

---

## Where to go next

- For the product overview → [Overview.md](./Overview.md)
- For engineering details (every endpoint, every model field) → [TechnicalDocumentation.md](./TechnicalDocumentation.md)
- For the planned future features → [Roadmap.md](./Roadmap.md)
- For the database diagram → [ERD.md](./ERD.md)
