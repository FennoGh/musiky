# Musiky — Roadmap

The current build delivers the operational ledger end-to-end: projects, collaborators, splits, distributions, revenues, payouts, expenses, and a per-project activity feed. This document is an honest accounting of what was originally scoped, what shipped, and what comes next.

---

## ✅ Shipped (v1.0)

| Area | What works |
|---|---|
| **Auth** | Email/password registration + login, JWT (HS256, 7-day access tokens), `/me` profile management, password change, account deletion, JSON data export. |
| **Projects** | CRUD with status lifecycle (`DRAFT → READY → LIVE → ARCHIVED`). Edit/delete guards on `LIVE`. Owner is auto-added as a `Collaborator` row with 100% split. |
| **Collaborators** | Add by email, role + split %, with **automatic residual-split logic** that keeps totals at exactly 100. Owner role/split are protected. |
| **Tracks** | Per-project track listing with title, version, duration, cover art, file URL. |
| **Distributions** | Per-platform live/pending status, manual stream-count entry, custom platforms can be created on the fly. |
| **Expenses** | Categorised ledger (Marketing, Production, Mastering, Video, Legal, Other) with currency-aware decimal amounts. |
| **Revenues** | Per-platform revenue events with reporting periods. **Atomic Payout fan-out** with rounding-to-owner and external-paid edit/delete guards. |
| **Payouts** | Auto-generated, owner's slice auto-`PAID`, recipients mark their own `PENDING` payouts as `PAID`. |
| **Activity feed** | Per-project + global feeds, indexed by `(project, -created_at)` for fast paginated reads. |
| **Analytics** | Per-project summary endpoint (total streams, revenue, expenses, break-even %). |
| **Uploads** | Cover (≤ 8 MB, image MIMEs) and audio (≤ 60 MB, audio MIMEs) endpoints with chunked save and size enforcement. |
| **Web app** | 16 routes covering landing, auth, dashboard, and per-project tabs. Tailwind 4 + Framer Motion. |
| **Android app** | Capacitor 6 WebView shell with a LAN-IP-aware dev script (`bin/dev-mobile.sh`). |
| **Infrastructure** | Three-service Docker Compose (db / api / web) on isolated bridge networks. Healthchecks, memory caps, named volumes, deploy + backup scripts in `infra/`. |
| **Stack migration** | Backend rewritten from FastAPI + SQLModel + Prisma to **Django 5 + DRF + Django ORM + SimpleJWT**. Schema and seed data preserved 1:1. |

---

## 🚧 Originally scoped, not delivered

These were in the original product spec (still visible in the ERD's `CONTRACT` and `SIGNATURE` tables, and the activity types `CONTRACT_CREATED` / `CONTRACT_SIGNED` / `CONTRACT_EXECUTED`) but did not make it into the v1.0 cut:

### Contracts & e-signatures

> The whole point of recording who-owns-what was to back it with a signed agreement.

**What was planned:**

- A `Contract` table per project, with status `DRAFT → PENDING → SIGNED → EXECUTED`.
- A `Signature` table collecting one row per signing collaborator, capturing `userId`, `signedAt`, `ipAddress`, `userAgent` for an eIDAS-compliant audit trail.
- A `termsHash` (SHA-256 of the document) so any post-signature edit invalidates the contract.
- Workflow: owner drafts terms → invites every collaborator with an "X% role: Producer" line → each signs → contract becomes `EXECUTED` → only then can the project move to `LIVE`.

**What's there today:** the `ERD.md` documents the intended schema, but no models, migrations, endpoints, or UI exist. The `Activity` enum still references the contract types as a forward-looking placeholder.

**Why it was cut:** out of scope for the time available. The split-tracking core (which is the operational value) shipped cleanly; the contracts layer is a wrapper around it that adds notarised proof.

---

## 🎯 Next milestones

### Milestone 1 — Contracts & e-signatures (the unfinished v1)

The most-requested missing feature. Implementation sketch:

1. **Schema:** add `Contract`, `Signature` tables (matching ERD).
2. **Endpoints:**
   - `POST /projects/{id}/contracts` — draft from current collaborator roster.
   - `POST /contracts/{id}/sign` — record a signature (server captures IP + UA from request).
   - `GET /contracts/{id}` — full contract + signatures.
3. **State machine:** project cannot transition `READY → LIVE` while any contract is `PENDING`. Contract becomes `EXECUTED` when every collaborator listed has signed.
4. **Document generation:** PDF rendering of the terms (pdfkit or weasyprint), stored at `MEDIA_ROOT/contracts/{cuid}.pdf`, hash recorded as `termsHash`.
5. **Activity:** wire up the existing `CONTRACT_*` activity types.

Estimated effort: 1–2 weeks.

### Milestone 2 — Document storage per project

A general "files attached to this project" surface beyond just contracts and audio:

- Lyrics, mastering notes, cover art revisions, label correspondence.
- Versioned (like `Track.version`).
- Per-collaborator visibility (some files only the owner sees).

### Milestone 3 — Payment control

Move from "the owner manually marks payouts as paid" to actual money movement:

- **Stripe Connect** for transferring royalty shares directly to collaborators' bank accounts.
- Webhook listener for transfer events; payout status flips on Stripe confirmation, not manual click.
- Tax form collection (W-8/W-9) before first payout.

This finally connects the ledger to real money. Currently `apps/billing/` is a stubbed-out placeholder for exactly this.

### Milestone 4 — Automatic stream/revenue ingestion

Right now stream counts and revenue events are entered by hand. The future-state:

- **Stream scrapers / API integrations** for Spotify, Apple Music, YouTube Music — daily polling, store rows in a `StreamStat` table (already in the ERD).
- **Revenue ingestion** from distributor reports (DistroKid CSV, Spotify for Artists exports). Map platform + period → auto-create `Revenue` rows with the existing fan-out path.
- **Reconciliation UI** — flag mismatches between expected revenue (computed from streams × per-platform rate) and actual deposit.

This is the largest item on the list because every platform has a different export format and rate structure.

### Milestone 5 — Background jobs & notifications

Currently every request is synchronous. Adding a queue (Celery + Redis, or RQ) unlocks:

- Async PDF generation for contracts and large data exports.
- **Email notifications** when a payout is received, a collaborator joins, a revenue lands, a contract is signed. Notification preferences are already accepted at `PUT /me/notifications` but not persisted — that endpoint becomes real.
- Scheduled jobs (nightly scrape, monthly summary email).

### Milestone 6 — Multi-currency + FX

Today every amount is `USD` by default. Real release income arrives in EUR, GBP, JPY, and gets converted by the platform at unknown rates. Needed:

- Per-project default currency.
- FX rate snapshot at the moment of a `Revenue` row (so historical totals don't drift).
- Display layer that formats amounts in the user's preferred currency.

### Milestone 7 — Granular permissions

Today permissions are binary: owner vs. collaborator. Real teams need:

- A `Manager` role with revenue/expense write access but no project-deletion power.
- Per-resource view permissions (e.g., a Vocalist sees their own payouts but not the full breakdown).
- Audit log of every permission change.

### Milestone 8 — Public release pages

A read-only marketing surface per project:

- `musiky.app/p/{slug}` — cover, tracklist, distribution links, pre-save/follow buttons.
- SEO-friendly (server-rendered).
- Optionally embeddable as an iframe on the artist's own site.

---

## 🔧 Smaller technical debt items

Things that should be cleaned up but aren't on the critical path:

- **iOS Capacitor target.** Today only Android is configured.
- **Test coverage.** No unit/integration tests committed yet. The split logic and payout fan-out are the highest-risk surfaces and should get test coverage first.
- **Production env handling.** `NEXT_PUBLIC_API_BASE` is baked at Next build time; changing the API host means rebuilding the image. A runtime-config layer would avoid this.
- **Observability.** No structured logging, no metrics export, no error tracking (Sentry). Currently relying on `journalctl` snapshots.
- **Rate limiting.** None — `/auth/login` is brute-forceable. Add `django-ratelimit` or nginx-side limiting before scaling.
- **API versioning.** All endpoints live at `/`, not `/api/v1/`. A breaking change would need a coordinated frontend deploy.
- **Static asset CDN.** `/uploads/` is served straight from the Django container's volume. Putting a CDN in front becomes important once cover-image traffic is non-trivial.

---

## How decisions get made

Anything in **Milestone 1** is a hard "yes, eventually" — it was explicit scope. Beyond that, priority is set by what the demo audience asks for most. The roadmap is a forecast, not a contract.
