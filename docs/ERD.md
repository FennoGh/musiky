# Musiky — Entity Relationship Diagram

Visual ERD of the Musiky database (Postgres + Prisma).
Renders natively in GitHub, GitLab, and VSCode (with the Markdown Preview Mermaid extension).
For a standalone image, paste the block into <https://mermaid.live> and export as PNG/SVG/PDF.

```mermaid
erDiagram
    USER ||--o{ PROJECT          : "owns"
    USER ||--o{ COLLABORATOR     : "is"
    USER ||--o{ SIGNATURE        : "signs"
    USER ||--o{ EXPENSE          : "pays"
    USER ||--o{ PAYOUT           : "receives"
    USER ||--o{ ACTIVITY         : "acts"

    PROJECT ||--o{ COLLABORATOR  : "has"
    PROJECT ||--o{ TRACK         : "contains"
    PROJECT ||--o{ CONTRACT      : "has"
    PROJECT ||--o{ EXPENSE       : "logs"
    PROJECT ||--o{ REVENUE       : "earns"
    PROJECT ||--o{ DISTRIBUTION  : "distributes via"
    PROJECT ||--o{ STREAM_STAT   : "tracked by"
    PROJECT ||--o{ PAYOUT        : "generates"
    PROJECT ||--o{ ACTIVITY      : "logs"

    CONTRACT ||--o{ SIGNATURE    : "collects"

    PLATFORM ||--o{ DISTRIBUTION : "hosts"
    PLATFORM ||--o{ STREAM_STAT  : "reports"
    PLATFORM ||--o{ REVENUE      : "pays"

    REVENUE  ||--o{ PAYOUT       : "splits into"

    USER {
        string  id PK
        string  email UK
        string  name
        string  passwordHash
        string  image
        Plan    plan
        datetime planRenewsAt
        datetime createdAt
    }

    PROJECT {
        string  id PK
        string  ownerId FK
        string  title
        string  coverUrl
        ProjectStatus status
        datetime createdAt
        datetime releasedAt
    }

    TRACK {
        string  id PK
        string  projectId FK
        string  title
        string  fileUrl
        int     version
        int     duration
        datetime uploadedAt
    }

    COLLABORATOR {
        string  id PK
        string  projectId FK
        string  userId FK "nullable (invited)"
        string  inviteEmail
        CollabRole role
        decimal splitPct "5,2"
        datetime joinedAt
    }

    CONTRACT {
        string  id PK
        string  projectId FK
        ContractStatus status
        string  documentUrl
        string  termsHash "sha256"
        datetime createdAt
        datetime executedAt
    }

    SIGNATURE {
        string  id PK
        string  contractId FK
        string  userId FK
        datetime signedAt
        string  ipAddress "eIDAS"
        string  userAgent
    }

    EXPENSE {
        string  id PK
        string  projectId FK
        string  payerId FK
        ExpenseCategory category
        decimal amount "12,2"
        string  currency
        string  description
        datetime spentAt
    }

    PLATFORM {
        string  id PK
        string  name UK
        string  slug UK
        string  iconUrl
    }

    DISTRIBUTION {
        string  id PK
        string  projectId FK
        string  platformId FK
        DistStatus status
        datetime liveAt
    }

    STREAM_STAT {
        string  id PK
        string  projectId FK
        string  platformId FK
        datetime date "daily bucket"
        string  country "ISO-2"
        int     streams
    }

    REVENUE {
        string  id PK
        string  projectId FK
        string  platformId FK
        decimal amount "12,2"
        string  currency
        datetime periodStart
        datetime periodEnd
        datetime receivedAt
    }

    PAYOUT {
        string  id PK
        string  projectId FK
        string  revenueId FK
        string  userId FK
        decimal amount "12,2"
        PayoutStatus status
        datetime paidAt
    }

    ACTIVITY {
        string  id PK
        string  projectId FK "nullable"
        string  actorId FK "nullable"
        ActivityType type
        json    payload
        datetime createdAt
    }
```

## Enums

| Enum              | Values                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Plan`            | `STARTER`, `PRO`, `TEAM`                                                                                                |
| `ProjectStatus`   | `DRAFT`, `READY`, `LIVE`, `ARCHIVED`                                                                                    |
| `CollabRole`      | `OWNER`, `PRODUCER`, `COMPOSER`, `VOCALIST`, `MANAGER`, `ARTIST`, `OTHER`                                               |
| `ContractStatus`  | `DRAFT`, `PENDING`, `SIGNED`, `EXECUTED`                                                                                |
| `ExpenseCategory` | `MARKETING`, `PRODUCTION`, `MASTERING`, `VIDEO`, `LEGAL`, `OTHER`                                                       |
| `DistStatus`      | `PENDING`, `LIVE`, `FAILED`, `TAKEDOWN`                                                                                 |
| `PayoutStatus`    | `PENDING`, `PAID`, `FAILED`                                                                                             |
| `ActivityType`    | `PROJECT_CREATED`, `TRACK_UPLOADED`, `COLLAB_INVITED`, `COLLAB_JOINED`, `CONTRACT_CREATED`, `CONTRACT_SIGNED`, `CONTRACT_EXECUTED`, `DISTRIBUTED`, `EXPENSE_LOGGED`, `REVENUE_RECEIVED`, `PAYOUT_SENT` |

## Cardinality Summary

- A **User** owns 0..N Projects, joins 0..N Projects as a Collaborator, signs 0..N Contracts, pays 0..N Expenses, receives 0..N Payouts.
- A **Project** has exactly 1 owner, 1..N Collaborators (one of which is the OWNER), 0..N Tracks, 0..N Contracts, 0..N Expenses, 0..N Distributions (one per Platform), 0..N Revenues, 0..N Payouts, 0..N Activities.
- A **Contract** belongs to exactly 1 Project and collects 1 Signature per signing Collaborator.
- A **Platform** is referenced by many Distributions, StreamStats and Revenues (e.g. Spotify, Apple Music, …).
- A **Revenue** event fans out into one **Payout** per Collaborator using `revenue.amount * splitPct / 100`, inside a single Postgres transaction.
- An **Activity** row records every meaningful event for the live activity feed (project created, track uploaded, contract signed, payout sent, …).
