# Musiky — Project Overview

> *Music made together, paid apart.*

A web and Android app that helps small music teams manage a song release together — uploading tracks, deciding who gets paid what, tracking expenses, and recording the money that comes back from streaming platforms.

This document explains what the project is and why it exists. **No prior knowledge required.**

---

## 1. The problem (told as a story)

Three people make a song:

- **Anna** wrote and sang it.
- **Ben** produced it.
- **Carla** paid for the music video.

They release it on Spotify and YouTube. Two months later, Spotify pays $4,000. YouTube pays $1,500.

Now the questions start:

- *How much does each person get?*
- *Did Anna remember that Ben already paid for the mastering?*
- *Did Carla actually receive her share, or is it still pending?*
- *What if Spotify pays again next month — does the same split apply?*

Today, most small music teams handle this with a group chat, a Google Sheet, and a lot of trust. Things go wrong:

- Someone forgets a payment they made.
- The percentages drift between conversations.
- New people join mid-project and the math has to be redone by hand.
- A collaborator asks "where's my money?" and nobody has a clear answer.

**Musiky is the simple workspace that replaces the spreadsheet.**

---

## 2. What Musiky does

Think of it as a shared notebook for one song or album, where every important fact is written down once and visible to everyone involved.

For each release, Musiky lets the team:

| Action | What it means |
|---|---|
| 🎤 **Add collaborators** | Invite people by email, give them a role (Producer, Vocalist, Manager…) and a percentage (Anna 40%, Ben 35%, Carla 25%). |
| 🎵 **Upload tracks** | Add the actual songs, with cover art, duration, and version history. |
| 📡 **Mark distributions** | Note where the song is live (Spotify, Apple Music, YouTube, TikTok…). |
| 💸 **Log expenses** | Record what was spent and by whom (mastering: $400, music video: $2,200…). |
| 💰 **Record revenue** | When money arrives from a platform, enter the amount. **Musiky automatically calculates everyone's share.** |
| ✅ **Track payouts** | Each person can see what they've received and what's still pending. |
| 📜 **See the history** | Every action is logged — who joined, who got paid, when the song went live. |

The magic is in step 5: when you record revenue, Musiky does the math automatically. Anna gets 40%, Ben 35%, Carla 25% — the numbers always add up to 100%, and the system makes sure nobody can accidentally break that.

---

## 3. Who is this for?

Musiky was built for **small music teams** — anywhere from 2 to 10 people working on a release together:

- **Independent artists** who collaborate with a producer and a vocalist.
- **Small labels** managing several artists at once.
- **Producers** who want to send a clear "here's your share" report to their collaborators every month.

It's **not** trying to replace:

- ❌ Distribution services (DistroKid, TuneCore, CDBaby) — Musiky tracks distribution, doesn't *do* it.
- ❌ Music streaming platforms (Spotify, Apple Music) — Musiky records what they pay, doesn't host songs.
- ❌ Bookkeeping software (QuickBooks, Xero) — Musiky is project-level, not company-level.

Musiky is the layer that sits **between the music and the money**, where small teams previously had nothing.

---

## 4. The two halves of the project

Like most modern web apps, Musiky has two pieces that work together:

```
   What you see (frontend)        What does the work (backend)
   ───────────────────────        ──────────────────────────
        Next.js                          Django
        React                            REST API
        TypeScript                       Python
        Tailwind CSS                     PostgreSQL database
```

### Frontend (the part you click on)

The **website** users see in their browser, and the **Android app** they tap on their phone. Both are built with the same code. It's responsible for:

- Showing the dashboard, project pages, forms.
- Sending what you type to the backend (e.g. "I want to add Ben as a collaborator").
- Displaying what comes back (e.g. "Here are your 6 projects").

### Backend (the part that does the thinking)

A server program that:

- Stores everything in a database.
- Checks who's allowed to do what (only the project owner can invite collaborators).
- Does the math (when revenue arrives, calculate each person's share).
- Returns results to the frontend.

The frontend never touches the database directly — it always asks the backend, which is the single source of truth.

---

## 5. How does the math work?

This is the most important part of Musiky, so it's worth a clear explanation.

### Splits always add up to 100%

When the project owner adds a collaborator, they pick a percentage. The system **automatically** keeps everything balanced:

| Action | Effect |
|---|---|
| Owner creates project | Owner has 100%. |
| Owner adds Ben at 35% | Owner now has 65%. (System took 35 from owner.) |
| Owner adds Carla at 25% | Owner now has 40%. (System took 25 more.) |
| Owner removes Carla | Owner gets back to 65%. (Carla's 25% returns to owner.) |
| Owner tries to add a 4th person at 70% | ❌ Refused — owner only has 40% to give. |

**You can never end up at 99% or 101%.** The system enforces 100% on every change.

### Splitting revenue automatically

When the owner records "Spotify paid $4,000":

1. System looks at the current splits: Anna 40%, Ben 35%, Carla 25%.
2. Calculates: Anna $1,600, Ben $1,400, Carla $1,000.
3. Creates three "payout" records — one for each collaborator.
4. The owner's share is **immediately marked as paid** (Spotify already deposited the money in the owner's account).
5. Other collaborators' shares are marked as **pending** until the owner sends them their cut.

If the math doesn't divide evenly (e.g. $100.01 split three ways), Musiky gives the leftover cent to the owner so the totals still match exactly.

### Safety: you can't accidentally erase money

Once the owner has actually paid Anna her $1,600, the system **refuses to let anyone change or delete that revenue record**. This prevents the worst-case scenario: silently losing track of a payment that already happened.

---

## 6. What the user actually sees

Picture the following happy path:

1. **Sign up** at `/register` with email + password. You're now the owner of an empty workspace.
2. **Create a project** called "Summer Vibes". You're auto-added as the owner with 100% split.
3. **Invite a producer** by email — they sign up, you add them at 30% (you keep 70%).
4. **Upload a track** with its cover art and duration.
5. **Mark distributions** — "Spotify: live", "Apple Music: live", "YouTube: pending".
6. **Log an expense** — "Mastering at Sterling: $400".
7. A month later: **record revenue** — "Spotify paid $1,200 for January." Musiky creates two payouts: yours ($840, marked paid) and the producer's ($360, pending).
8. You **transfer $360** to the producer via your bank.
9. The producer logs in, sees the pending payout, **clicks "mark as paid"** to confirm receipt.
10. Done. The activity feed shows the full history. Both of you can re-read the numbers any time.

That's the whole product loop, repeated for as many projects as you have.

---

## 7. The tech stack (in plain English)

If you're a beginner, here's what these names actually mean:

| Tool | What it is | Why we use it |
|---|---|---|
| **Next.js** | A framework built on top of React for building websites. | Industry-standard for production web apps. Handles routing, performance optimization, and the build process out of the box. |
| **React** | A library for building user interfaces by combining small reusable pieces called "components". | Most popular UI library in the world. Massive ecosystem, easy to find help. |
| **TypeScript** | JavaScript with type checking — catches typos and shape mismatches before the code runs. | Safer than plain JavaScript on a project this size. Almost zero extra cost. |
| **Tailwind CSS** | A way to write styles by using pre-made class names (`text-blue-500`, `p-4`) instead of writing custom CSS. | Fast, consistent, and the styles live next to the markup that uses them. |
| **Django** | A Python framework for building web servers. Comes with a database, admin tools, and security features built-in. | Mature, secure, well-documented, and great for building APIs. |
| **DRF** (Django REST Framework) | A library that adds API-building features to Django. | Lets us turn Python functions into JSON endpoints with very little code. |
| **JWT** (JSON Web Token) | A standard way to prove "I'm logged in" by carrying a signed token in each request. | No need for sessions stored on the server. Works the same on web and mobile. |
| **PostgreSQL** | A database. Stores users, projects, tracks, etc. as rows in tables. | Open-source, reliable, and good at the kind of math we do (decimals, money). |
| **Capacitor** | A tool that wraps a website into a real Android app. | Lets us ship the same code on web and mobile. No separate iOS/Android codebase. |
| **Docker** | A way to package the whole stack (database + backend + frontend) into containers that run anywhere. | "Works on my machine" stops being a problem. The reviewer runs one command and gets the same setup. |

Don't worry if these are unfamiliar — you don't need to know how a car engine works to drive a car. The [Setup Guide](./SetupGuide.md) has step-by-step commands you can copy-paste.

---

## 8. How the pieces fit together

```
       What the user sees                  What does the work
       ──────────────────                  ──────────────────

       ┌───────────────┐                  ┌────────────────┐
       │   Browser     │                  │   Django       │
       │  (Next.js)    │  ─── REST ─────▶ │   Backend      │
       │   port 3000   │     + JWT        │   port 8000    │
       └───────────────┘                  └────────┬───────┘
              ▲                                    │
              │                                    │
       ┌───────────────┐                  ┌────────▼───────┐
       │  Android app  │                  │   PostgreSQL   │
       │  (Capacitor)  │                  │   port 5432    │
       └───────────────┘                  └────────────────┘
```

In words:

- The **browser** or **Android app** shows you the interface.
- When you click something, it sends a message ("I want to add a collaborator") to the **Django backend**.
- The backend writes the change to the **PostgreSQL database** and sends back the updated data.
- The interface re-draws with the new information.

That's it. Every feature in Musiky follows this same pattern.

---

## 9. Try it yourself

After running `npm run db:seed`, you'll have three demo accounts to log in with — all use the password `musiky123`:

| Email | What they see when they log in |
|---|---|
| `main@musiky.dev` | The full picture — all 6 demo projects with realistic data (Take Care, Scorpion, After Hours, Ma Bagheek, Astroworld, Currents). |
| `mohamed@musiky.dev` | Producer view — sees only the projects he's a collaborator on (Take Care, After Hours, Astroworld). |
| `yussef@musiky.dev` | Vocalist/Composer view — sees Take Care, Ma Bagheek, Astroworld, Currents. |

Logging in as different users shows how the same data looks different depending on your role. The math always adds up to the same total — but each person sees their own slice.

---

## 10. Where to go next

| If you want to… | Read |
|---|---|
| Run the project on your own machine | [SetupGuide.md](./SetupGuide.md) |
| Understand the engineering details | [TechnicalDocumentation.md](./TechnicalDocumentation.md) |
| See what features are planned next | [Roadmap.md](./Roadmap.md) |
| Look at the database design | [ERD.md](./ERD.md) |
| Find the version of every library used | [all_technologies_used.txt](./all_technologies_used.txt) |
