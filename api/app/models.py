"""SQLModel definitions mirroring the Prisma schema 1:1.

Tables, columns, enums and indexes were created by Prisma migrate.
These models simply bind to that existing schema — DO NOT call
`SQLModel.metadata.create_all`. Prisma owns the schema; FastAPI just reads
and writes through it.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlmodel import Field, SQLModel


# ─── Enums (must match Prisma enum names exactly) ────────────────

class Plan(str, Enum):
    STARTER = "STARTER"
    PRO = "PRO"
    TEAM = "TEAM"


class ProjectStatus(str, Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    LIVE = "LIVE"
    ARCHIVED = "ARCHIVED"


class CollabRole(str, Enum):
    OWNER = "OWNER"
    PRODUCER = "PRODUCER"
    COMPOSER = "COMPOSER"
    VOCALIST = "VOCALIST"
    MANAGER = "MANAGER"
    ARTIST = "ARTIST"
    OTHER = "OTHER"


class ExpenseCategory(str, Enum):
    MARKETING = "MARKETING"
    PRODUCTION = "PRODUCTION"
    MASTERING = "MASTERING"
    VIDEO = "VIDEO"
    LEGAL = "LEGAL"
    OTHER = "OTHER"


class DistStatus(str, Enum):
    PENDING = "PENDING"
    LIVE = "LIVE"


class PayoutStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"


class ActivityType(str, Enum):
    PROJECT_CREATED = "PROJECT_CREATED"
    TRACK_UPLOADED = "TRACK_UPLOADED"
    COLLAB_JOINED = "COLLAB_JOINED"
    DISTRIBUTED = "DISTRIBUTED"
    EXPENSE_LOGGED = "EXPENSE_LOGGED"
    REVENUE_RECEIVED = "REVENUE_RECEIVED"
    PAYOUT_SENT = "PAYOUT_SENT"


# Helper: bind to the Postgres enum types Prisma already created.
def _pg_enum(enum_cls: type[Enum], name: str) -> Column:
    return Column(
        PgEnum(*[e.value for e in enum_cls], name=name, create_type=False),
        nullable=False,
    )


def _pg_enum_default(enum_cls: type[Enum], name: str, default: Enum) -> Column:
    return Column(
        PgEnum(*[e.value for e in enum_cls], name=name, create_type=False),
        nullable=False,
        server_default=default.value,
    )


# ─── Models ──────────────────────────────────────────────────────

class User(SQLModel, table=True):
    __tablename__ = "User"

    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    name: Optional[str] = None
    passwordHash: Optional[str] = None
    image: Optional[str] = None
    plan: Plan = Field(sa_column=_pg_enum_default(Plan, "Plan", Plan.STARTER))
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class Project(SQLModel, table=True):
    __tablename__ = "Project"

    id: str = Field(primary_key=True)
    title: str
    coverUrl: Optional[str] = None
    status: ProjectStatus = Field(
        sa_column=_pg_enum_default(ProjectStatus, "ProjectStatus", ProjectStatus.DRAFT)
    )
    ownerId: str = Field(foreign_key="User.id", index=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    releasedAt: Optional[datetime] = None


class Track(SQLModel, table=True):
    __tablename__ = "Track"

    id: str = Field(primary_key=True)
    projectId: str = Field(foreign_key="Project.id", index=True)
    title: str
    fileUrl: str
    coverUrl: Optional[str] = None
    version: int = 1
    duration: Optional[int] = None
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)


class Collaborator(SQLModel, table=True):
    __tablename__ = "Collaborator"

    id: str = Field(primary_key=True)
    projectId: str = Field(foreign_key="Project.id", index=True)
    userId: Optional[str] = Field(default=None, foreign_key="User.id")
    role: CollabRole = Field(sa_column=_pg_enum(CollabRole, "CollabRole"))
    splitPct: Decimal
    joinedAt: datetime = Field(default_factory=datetime.utcnow)


class Expense(SQLModel, table=True):
    __tablename__ = "Expense"

    id: str = Field(primary_key=True)
    projectId: str = Field(foreign_key="Project.id", index=True)
    payerId: str = Field(foreign_key="User.id")
    category: ExpenseCategory = Field(
        sa_column=_pg_enum(ExpenseCategory, "ExpenseCategory")
    )
    amount: Decimal
    currency: str = "USD"
    description: Optional[str] = None
    spentAt: datetime = Field(default_factory=datetime.utcnow)


class Platform(SQLModel, table=True):
    __tablename__ = "Platform"

    id: str = Field(primary_key=True)
    name: str = Field(unique=True)
    slug: str = Field(unique=True)


class Distribution(SQLModel, table=True):
    __tablename__ = "Distribution"

    id: str = Field(primary_key=True)
    projectId: str = Field(foreign_key="Project.id")
    platformId: str = Field(foreign_key="Platform.id")
    status: DistStatus = Field(
        sa_column=_pg_enum_default(DistStatus, "DistStatus", DistStatus.PENDING)
    )
    liveAt: Optional[datetime] = None
    streams: int = 0


class Revenue(SQLModel, table=True):
    __tablename__ = "Revenue"

    id: str = Field(primary_key=True)
    projectId: str = Field(foreign_key="Project.id", index=True)
    platformId: str = Field(foreign_key="Platform.id")
    amount: Decimal
    currency: str = "USD"
    periodStart: datetime
    periodEnd: datetime
    receivedAt: datetime = Field(default_factory=datetime.utcnow)


class Payout(SQLModel, table=True):
    __tablename__ = "Payout"

    id: str = Field(primary_key=True)
    projectId: str = Field(foreign_key="Project.id", index=True)
    revenueId: str = Field(foreign_key="Revenue.id")
    userId: str = Field(foreign_key="User.id", index=True)
    amount: Decimal
    status: PayoutStatus = Field(
        sa_column=_pg_enum_default(PayoutStatus, "PayoutStatus", PayoutStatus.PENDING)
    )
    paidAt: Optional[datetime] = None


class Activity(SQLModel, table=True):
    __tablename__ = "Activity"

    id: str = Field(primary_key=True)
    projectId: Optional[str] = Field(default=None, foreign_key="Project.id", index=True)
    actorId: Optional[str] = Field(default=None, foreign_key="User.id")
    type: ActivityType = Field(sa_column=_pg_enum(ActivityType, "ActivityType"))
    payload: Optional[dict] = Field(default=None, sa_column=Column(
        __import__("sqlalchemy.dialects.postgresql", fromlist=["JSONB"]).JSONB
    ))
    createdAt: datetime = Field(default_factory=datetime.utcnow)
