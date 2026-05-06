# Musiky — Documentation Index

Everything in this folder, ordered by who should read what and in what sequence.

---

## For a first-time reader

Read these top to bottom — about 30 minutes total to fully understand the project.

| # | File | What it covers | Time |
|---|---|---|---|
| 1 | [Overview.md](./Overview.md) | What Musiky is, the problem it solves, who it's for, key features, architecture sketch. **Start here.** | ~10 min |
| 2 | [SetupGuide.md](./SetupGuide.md) | How to clone, install, configure, and run the full stack locally — both native and Docker paths. Includes troubleshooting. | ~15 min hands-on |
| 3 | [Roadmap.md](./Roadmap.md) | What shipped in v1.0, what was scoped but cut (contracts), and what comes next (payment control, auto-scraping streams, etc.). | ~5 min |

## For engineering deep-dives

| File | What it covers |
|---|---|
| [TechnicalDocumentation.md](./TechnicalDocumentation.md) | Repo layout, every API endpoint with auth requirements, business-logic deep-dives (residual-split allocation, atomic payout fan-out), data model with constraints, Docker/deploy mechanics, env-var table, verification checklist. |
| [ERD.md](./ERD.md) | Database entity-relationship diagram (Mermaid) with every column, every enum, and the cardinality summary. Renders natively on GitHub. |
| [ERD.png](./ERD.png) | Pre-rendered PNG of the ERD (for slides / non-Markdown contexts). |
| [ERD.pdf](./ERD.pdf) | Same ERD as a PDF. |
| [all_technologies_used.txt](./all_technologies_used.txt) | Version-pinned tech-stack manifest, organised by tier (frontend, backend, database, mobile, containers, dev tooling, ops scripts). |

---

## Suggested reading orders by role

**🧑‍💼 Project reviewer / evaluator**  →  [Overview.md](./Overview.md) → [Roadmap.md](./Roadmap.md) → skim [TechnicalDocumentation.md](./TechnicalDocumentation.md)

**👩‍💻 Engineer about to contribute**  →  [SetupGuide.md](./SetupGuide.md) → [TechnicalDocumentation.md](./TechnicalDocumentation.md) → [ERD.md](./ERD.md)

**📦 Devops / deployer**  →  [SetupGuide.md §B (Docker)](./SetupGuide.md#b-docker-setup-one-command-production-like) → [TechnicalDocumentation.md §7 (Docker / production)](./TechnicalDocumentation.md#7-docker--production)

**🎵 Product / non-technical reader**  →  [Overview.md](./Overview.md) → [Roadmap.md](./Roadmap.md). You can stop there.

---

## Outside this folder

- **Top-level [`README.md`](../README.md)** — the elevator pitch + quickstart. Pointers back into this folder for everything else.
- **[`infra/README.md`](../infra/README.md)** — operations runbook for the production VPS (deploy, backup, port audit, cost monitoring).
