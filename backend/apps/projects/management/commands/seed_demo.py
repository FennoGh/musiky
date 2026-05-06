"""Idempotent demo seeder.

Wipes user-generated rows (keeps Platform). Re-creates 3 demo accounts and 6
projects with full collaborator/expense/revenue/payout/activity graphs.

Run: python manage.py seed_demo
"""

from datetime import datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone as dj_tz

from apps.distribution.models import DistStatus, Distribution, Platform
from apps.finance.models import Expense, ExpenseCategory, Payout, PayoutStatus, Revenue
from apps.projects.models import (
    Activity,
    ActivityType,
    CollabRole,
    Collaborator,
    Project,
    ProjectStatus,
    Track,
)

User = get_user_model()
DEMO_PASSWORD = "musiky123"

PLATFORMS = [
    ("Spotify", "spotify"),
    ("Apple Music", "apple-music"),
    ("YouTube Music", "youtube-music"),
    ("Amazon Music", "amazon-music"),
    ("Deezer", "deezer"),
    ("Tidal", "tidal"),
    ("TikTok", "tiktok"),
    ("Instagram", "instagram"),
    ("Shazam", "shazam"),
    ("Pandora", "pandora"),
    ("SoundCloud", "soundcloud"),
    ("Napster", "napster"),
]


def days_ago(d):
    return dj_tz.now() - timedelta(days=d)


def slugify(s):
    out = []
    for ch in s.lower():
        if ch.isalnum():
            out.append(ch)
        elif out and out[-1] != "-":
            out.append("-")
    return "".join(out).strip("-")


def q2(d):
    return Decimal(d).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class Command(BaseCommand):
    help = "Wipe and re-seed Musiky demo data."

    @transaction.atomic
    def handle(self, *args, **opts):
        self.stdout.write("Wiping previous data…")
        Activity.objects.all().delete()
        Payout.objects.all().delete()
        Revenue.objects.all().delete()
        Expense.objects.all().delete()
        Distribution.objects.all().delete()
        Track.objects.all().delete()
        Collaborator.objects.all().delete()
        Project.objects.all().delete()
        User.objects.all().delete()
        # Keep Platform — custom platforms added through the UI survive a re-seed.

        self.stdout.write("Ensuring platforms…")
        for name, slug in PLATFORMS:
            Platform.objects.update_or_create(slug=slug, defaults={"name": name})
        platform_by_slug = {p.slug: p for p in Platform.objects.all()}

        self.stdout.write("Creating users…")
        main = User.objects.create_user(
            email="main@musiky.dev", password=DEMO_PASSWORD,
            name="Main Account", plan="PRO",
        )
        mohamed = User.objects.create_user(
            email="mohamed@musiky.dev", password=DEMO_PASSWORD,
            name="Mohamed", plan="STARTER",
        )
        yussef = User.objects.create_user(
            email="yussef@musiky.dev", password=DEMO_PASSWORD,
            name="Yussef", plan="STARTER",
        )

        self.stdout.write("Building 6 projects for the main account…")

        def build(*, owner, title, status, cover_url, released_at, roster,
                  tracks, distributions, expenses, revenues, activities):
            project = Project.objects.create(
                owner=owner, title=title, status=status,
                cover_url=cover_url, released_at=released_at,
            )
            for r in roster:
                Collaborator.objects.create(
                    project=project, user_id=r["userId"],
                    role=r["role"], split_pct=q2(r["splitPct"]),
                )
            for t in tracks:
                Track.objects.create(
                    project=project,
                    title=t["title"], version=1,
                    duration=t["duration"],
                    file_url=f"https://cdn.example.com/musiky/{project.id}/{slugify(t['title'])}.mp3",
                    cover_url=t.get("coverUrl") or cover_url,
                )
            for d in distributions:
                p = platform_by_slug.get(d["slug"])
                if not p:
                    continue
                Distribution.objects.create(
                    project=project, platform=p,
                    status=d["status"], live_at=d["liveAt"], streams=d["streams"],
                )
            for e in expenses:
                Expense.objects.create(
                    project=project, payer=e["payer"],
                    category=e["category"], amount=q2(e["amount"]),
                    currency="USD", description=e["description"], spent_at=e["spentAt"],
                )

            for r in revenues:
                p = platform_by_slug.get(r["slug"])
                if not p:
                    continue
                revenue = Revenue.objects.create(
                    project=project, platform=p,
                    amount=q2(r["amount"]), currency="USD",
                    period_start=r["periodStart"], period_end=r["periodEnd"],
                    received_at=r["receivedAt"],
                )
                # Fan out per roster, owner absorbs rounding remainder.
                distributed = Decimal("0.00")
                shares = []
                for collab in roster:
                    share = q2(Decimal(r["amount"]) * Decimal(collab["splitPct"]) / Decimal("100"))
                    distributed += share
                    shares.append({"userId": collab["userId"], "amount": share})
                remainder = q2(Decimal(r["amount"])) - distributed
                if remainder != 0:
                    for s in shares:
                        if s["userId"] == owner.id:
                            s["amount"] = q2(s["amount"] + remainder)
                            break
                paid_set = set(r.get("paidUserIds") or [])
                paid_at = r.get("paidAt") or r["receivedAt"]
                for s in shares:
                    is_paid = s["userId"] == owner.id or s["userId"] in paid_set
                    Payout.objects.create(
                        project=project, revenue=revenue, user_id=s["userId"],
                        amount=s["amount"],
                        status=PayoutStatus.PAID if is_paid else PayoutStatus.PENDING,
                        paid_at=paid_at if is_paid else None,
                    )

            for a in activities:
                act = Activity.objects.create(
                    project=project, actor_id=a["actorId"],
                    type=a["type"], payload=a.get("payload"),
                )
                # auto_now_add can't be overridden directly — patch via update.
                Activity.objects.filter(pk=act.pk).update(created_at=a["createdAt"])
            return project

        # ─── 1. Take Care ─────────────────────────────────────────
        build(
            owner=main, title="Take Care", status=ProjectStatus.LIVE,
            cover_url="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&q=80",
            released_at=days_ago(45),
            roster=[
                {"userId": main.id, "role": CollabRole.OWNER, "splitPct": 50},
                {"userId": mohamed.id, "role": CollabRole.PRODUCER, "splitPct": 30},
                {"userId": yussef.id, "role": CollabRole.VOCALIST, "splitPct": 20},
            ],
            tracks=[
                {"title": "Marvin's Room", "duration": 354},
                {"title": "Headlines", "duration": 235},
                {"title": "Take Care", "duration": 272},
                {"title": "The Motto", "duration": 181},
                {"title": "HYFR", "duration": 268},
            ],
            distributions=[
                {"slug": "spotify", "status": DistStatus.LIVE, "liveAt": days_ago(45), "streams": 1_842_000},
                {"slug": "apple-music", "status": DistStatus.LIVE, "liveAt": days_ago(45), "streams": 920_000},
                {"slug": "youtube-music", "status": DistStatus.LIVE, "liveAt": days_ago(44), "streams": 1_205_000},
                {"slug": "tidal", "status": DistStatus.LIVE, "liveAt": days_ago(43), "streams": 84_000},
                {"slug": "deezer", "status": DistStatus.LIVE, "liveAt": days_ago(43), "streams": 162_000},
            ],
            expenses=[
                {"category": ExpenseCategory.PRODUCTION, "amount": 1200, "description": "Studio + mixing engineer", "spentAt": days_ago(80), "payer": main},
                {"category": ExpenseCategory.MASTERING, "amount": 450, "description": "Mastering pass at Sterling", "spentAt": days_ago(70), "payer": main},
                {"category": ExpenseCategory.MARKETING, "amount": 800, "description": "Pre-save + playlist pitching", "spentAt": days_ago(55), "payer": main},
                {"category": ExpenseCategory.VIDEO, "amount": 2200, "description": "Music video — Marvin's Room", "spentAt": days_ago(48), "payer": main},
            ],
            revenues=[
                {"slug": "spotify", "amount": 4280, "periodStart": datetime(2026, 1, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 1, 31, tzinfo=timezone.utc), "receivedAt": days_ago(60), "paidUserIds": [main.id, mohamed.id], "paidAt": days_ago(55)},
                {"slug": "spotify", "amount": 3960, "periodStart": datetime(2026, 2, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 2, 28, tzinfo=timezone.utc), "receivedAt": days_ago(30), "paidUserIds": [main.id, mohamed.id], "paidAt": days_ago(25)},
                {"slug": "apple-music", "amount": 1840, "periodStart": datetime(2026, 2, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 2, 28, tzinfo=timezone.utc), "receivedAt": days_ago(28), "paidUserIds": [main.id], "paidAt": days_ago(20)},
                {"slug": "youtube-music", "amount": 1120, "periodStart": datetime(2026, 3, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 3, 31, tzinfo=timezone.utc), "receivedAt": days_ago(8)},
            ],
            activities=[
                {"actorId": main.id, "type": ActivityType.PROJECT_CREATED, "createdAt": days_ago(95), "payload": {"title": "Take Care"}},
                {"actorId": mohamed.id, "type": ActivityType.COLLAB_JOINED, "createdAt": days_ago(90), "payload": {"role": "PRODUCER", "splitPct": "30.00"}},
                {"actorId": yussef.id, "type": ActivityType.COLLAB_JOINED, "createdAt": days_ago(89), "payload": {"role": "VOCALIST", "splitPct": "20.00"}},
                {"actorId": main.id, "type": ActivityType.TRACK_UPLOADED, "createdAt": days_ago(80), "payload": {"title": "Take Care", "version": 1}},
                {"actorId": main.id, "type": ActivityType.DISTRIBUTED, "createdAt": days_ago(45), "payload": {"platforms": ["spotify", "apple-music", "youtube-music", "tidal", "deezer"]}},
                {"actorId": main.id, "type": ActivityType.REVENUE_RECEIVED, "createdAt": days_ago(60), "payload": {"amount": "4280.00", "currency": "USD"}},
                {"actorId": main.id, "type": ActivityType.PAYOUT_SENT, "createdAt": days_ago(55), "payload": {"amount": "1284.00"}},
            ],
        )

        # ─── 2. Scorpion ──────────────────────────────────────────
        build(
            owner=main, title="Scorpion", status=ProjectStatus.LIVE,
            cover_url="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=900&q=80",
            released_at=days_ago(20),
            roster=[{"userId": main.id, "role": CollabRole.OWNER, "splitPct": 100}],
            tracks=[
                {"title": "Nonstop", "duration": 238},
                {"title": "In My Feelings", "duration": 217},
                {"title": "God's Plan", "duration": 199},
                {"title": "Nice For What", "duration": 211},
            ],
            distributions=[
                {"slug": "spotify", "status": DistStatus.LIVE, "liveAt": days_ago(20), "streams": 2_640_000},
                {"slug": "apple-music", "status": DistStatus.LIVE, "liveAt": days_ago(20), "streams": 1_180_000},
                {"slug": "youtube-music", "status": DistStatus.LIVE, "liveAt": days_ago(20), "streams": 980_000},
                {"slug": "amazon-music", "status": DistStatus.LIVE, "liveAt": days_ago(18), "streams": 320_000},
                {"slug": "tiktok", "status": DistStatus.LIVE, "liveAt": days_ago(15), "streams": 4_120_000},
            ],
            expenses=[
                {"category": ExpenseCategory.PRODUCTION, "amount": 1800, "description": "Studio bookings + session players", "spentAt": days_ago(50), "payer": main},
                {"category": ExpenseCategory.MARKETING, "amount": 2400, "description": "Social campaign + influencer push", "spentAt": days_ago(22), "payer": main},
                {"category": ExpenseCategory.VIDEO, "amount": 3500, "description": "In My Feelings music video", "spentAt": days_ago(18), "payer": main},
            ],
            revenues=[
                {"slug": "spotify", "amount": 5680, "periodStart": datetime(2026, 3, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 3, 31, tzinfo=timezone.utc), "receivedAt": days_ago(10), "paidUserIds": [main.id], "paidAt": days_ago(5)},
                {"slug": "tiktok", "amount": 920, "periodStart": datetime(2026, 3, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 3, 31, tzinfo=timezone.utc), "receivedAt": days_ago(7)},
            ],
            activities=[
                {"actorId": main.id, "type": ActivityType.PROJECT_CREATED, "createdAt": days_ago(60), "payload": {"title": "Scorpion"}},
                {"actorId": main.id, "type": ActivityType.TRACK_UPLOADED, "createdAt": days_ago(35), "payload": {"title": "God's Plan", "version": 1}},
                {"actorId": main.id, "type": ActivityType.DISTRIBUTED, "createdAt": days_ago(20), "payload": {"platforms": ["spotify", "apple-music", "youtube-music"]}},
                {"actorId": main.id, "type": ActivityType.REVENUE_RECEIVED, "createdAt": days_ago(10), "payload": {"amount": "5680.00", "currency": "USD"}},
            ],
        )

        # ─── 3. After Hours ───────────────────────────────────────
        build(
            owner=main, title="After Hours", status=ProjectStatus.LIVE,
            cover_url="https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=900&q=80",
            released_at=days_ago(35),
            roster=[
                {"userId": main.id, "role": CollabRole.OWNER, "splitPct": 65},
                {"userId": mohamed.id, "role": CollabRole.PRODUCER, "splitPct": 35},
            ],
            tracks=[
                {"title": "Blinding Lights", "duration": 200},
                {"title": "Save Your Tears", "duration": 215},
                {"title": "In Your Eyes", "duration": 237},
                {"title": "Heartless", "duration": 198},
            ],
            distributions=[
                {"slug": "spotify", "status": DistStatus.LIVE, "liveAt": days_ago(35), "streams": 3_240_000},
                {"slug": "apple-music", "status": DistStatus.LIVE, "liveAt": days_ago(35), "streams": 1_410_000},
                {"slug": "youtube-music", "status": DistStatus.LIVE, "liveAt": days_ago(34), "streams": 2_880_000},
                {"slug": "shazam", "status": DistStatus.LIVE, "liveAt": days_ago(30), "streams": 510_000},
            ],
            expenses=[
                {"category": ExpenseCategory.PRODUCTION, "amount": 2200, "description": "Synthwave production setup", "spentAt": days_ago(70), "payer": main},
                {"category": ExpenseCategory.MASTERING, "amount": 600, "description": "Mastering — Blinding Lights", "spentAt": days_ago(45), "payer": main},
                {"category": ExpenseCategory.MARKETING, "amount": 1500, "description": "TV/Film sync placements", "spentAt": days_ago(36), "payer": main},
                {"category": ExpenseCategory.VIDEO, "amount": 4200, "description": "Cinematic music video — Blinding Lights", "spentAt": days_ago(32), "payer": main},
            ],
            revenues=[
                {"slug": "spotify", "amount": 6120, "periodStart": datetime(2026, 2, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 2, 28, tzinfo=timezone.utc), "receivedAt": days_ago(25), "paidUserIds": [main.id, mohamed.id], "paidAt": days_ago(20)},
                {"slug": "apple-music", "amount": 2340, "periodStart": datetime(2026, 2, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 2, 28, tzinfo=timezone.utc), "receivedAt": days_ago(22), "paidUserIds": [main.id]},
                {"slug": "youtube-music", "amount": 3120, "periodStart": datetime(2026, 3, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 3, 31, tzinfo=timezone.utc), "receivedAt": days_ago(6)},
            ],
            activities=[
                {"actorId": main.id, "type": ActivityType.PROJECT_CREATED, "createdAt": days_ago(85), "payload": {"title": "After Hours"}},
                {"actorId": mohamed.id, "type": ActivityType.COLLAB_JOINED, "createdAt": days_ago(80), "payload": {"role": "PRODUCER", "splitPct": "35.00"}},
                {"actorId": main.id, "type": ActivityType.TRACK_UPLOADED, "createdAt": days_ago(50), "payload": {"title": "Blinding Lights", "version": 1}},
                {"actorId": main.id, "type": ActivityType.DISTRIBUTED, "createdAt": days_ago(35), "payload": {"platforms": ["spotify", "apple-music", "youtube-music", "shazam"]}},
                {"actorId": main.id, "type": ActivityType.REVENUE_RECEIVED, "createdAt": days_ago(25), "payload": {"amount": "6120.00", "currency": "USD"}},
            ],
        )

        # ─── 4. Ma Bagheek ────────────────────────────────────────
        build(
            owner=main, title="Ma Bagheek", status=ProjectStatus.LIVE,
            cover_url="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80",
            released_at=days_ago(15),
            roster=[
                {"userId": main.id, "role": CollabRole.OWNER, "splitPct": 70},
                {"userId": yussef.id, "role": CollabRole.VOCALIST, "splitPct": 30},
            ],
            tracks=[
                {"title": "Ma Bagheek", "duration": 254},
                {"title": "Goulou Lemama", "duration": 219},
                {"title": "Habibi Layla", "duration": 268},
            ],
            distributions=[
                {"slug": "spotify", "status": DistStatus.LIVE, "liveAt": days_ago(15), "streams": 480_000},
                {"slug": "youtube-music", "status": DistStatus.LIVE, "liveAt": days_ago(14), "streams": 1_120_000},
                {"slug": "deezer", "status": DistStatus.LIVE, "liveAt": days_ago(13), "streams": 92_000},
                {"slug": "tiktok", "status": DistStatus.LIVE, "liveAt": days_ago(10), "streams": 2_650_000},
            ],
            expenses=[
                {"category": ExpenseCategory.PRODUCTION, "amount": 700, "description": "Studio sessions in Algiers", "spentAt": days_ago(40), "payer": main},
                {"category": ExpenseCategory.MASTERING, "amount": 280, "description": "Online mastering pass", "spentAt": days_ago(20), "payer": main},
                {"category": ExpenseCategory.MARKETING, "amount": 600, "description": "Maghreb radio + TikTok push", "spentAt": days_ago(13), "payer": main},
            ],
            revenues=[
                {"slug": "youtube-music", "amount": 1520, "periodStart": datetime(2026, 3, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 3, 31, tzinfo=timezone.utc), "receivedAt": days_ago(5), "paidUserIds": [main.id]},
                {"slug": "tiktok", "amount": 480, "periodStart": datetime(2026, 3, 1, tzinfo=timezone.utc), "periodEnd": datetime(2026, 3, 31, tzinfo=timezone.utc), "receivedAt": days_ago(3)},
            ],
            activities=[
                {"actorId": main.id, "type": ActivityType.PROJECT_CREATED, "createdAt": days_ago(50), "payload": {"title": "Ma Bagheek"}},
                {"actorId": yussef.id, "type": ActivityType.COLLAB_JOINED, "createdAt": days_ago(48), "payload": {"role": "VOCALIST", "splitPct": "30.00"}},
                {"actorId": main.id, "type": ActivityType.TRACK_UPLOADED, "createdAt": days_ago(30), "payload": {"title": "Ma Bagheek", "version": 1}},
                {"actorId": main.id, "type": ActivityType.DISTRIBUTED, "createdAt": days_ago(15), "payload": {"platforms": ["spotify", "youtube-music", "deezer", "tiktok"]}},
                {"actorId": main.id, "type": ActivityType.REVENUE_RECEIVED, "createdAt": days_ago(5), "payload": {"amount": "1520.00", "currency": "USD"}},
            ],
        )

        # ─── 5. Astroworld (READY, pre-launch) ───────────────────
        build(
            owner=main, title="Astroworld", status=ProjectStatus.READY,
            cover_url="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80",
            released_at=None,
            roster=[
                {"userId": main.id, "role": CollabRole.OWNER, "splitPct": 55},
                {"userId": mohamed.id, "role": CollabRole.PRODUCER, "splitPct": 25},
                {"userId": yussef.id, "role": CollabRole.ARTIST, "splitPct": 20},
            ],
            tracks=[
                {"title": "Sicko Mode", "duration": 312},
                {"title": "Stargazing", "duration": 270},
                {"title": "Stop Trying To Be God", "duration": 320},
            ],
            distributions=[
                {"slug": "spotify", "status": DistStatus.PENDING, "liveAt": None, "streams": 0},
                {"slug": "apple-music", "status": DistStatus.PENDING, "liveAt": None, "streams": 0},
            ],
            expenses=[
                {"category": ExpenseCategory.PRODUCTION, "amount": 3200, "description": "Maximalist trap production", "spentAt": days_ago(25), "payer": main},
                {"category": ExpenseCategory.MASTERING, "amount": 700, "description": "Mastering — full album", "spentAt": days_ago(12), "payer": main},
            ],
            revenues=[],
            activities=[
                {"actorId": main.id, "type": ActivityType.PROJECT_CREATED, "createdAt": days_ago(40), "payload": {"title": "Astroworld"}},
                {"actorId": mohamed.id, "type": ActivityType.COLLAB_JOINED, "createdAt": days_ago(38), "payload": {"role": "PRODUCER", "splitPct": "25.00"}},
                {"actorId": yussef.id, "type": ActivityType.COLLAB_JOINED, "createdAt": days_ago(37), "payload": {"role": "ARTIST", "splitPct": "20.00"}},
                {"actorId": main.id, "type": ActivityType.TRACK_UPLOADED, "createdAt": days_ago(20), "payload": {"title": "Sicko Mode", "version": 1}},
                {"actorId": main.id, "type": ActivityType.EXPENSE_LOGGED, "createdAt": days_ago(12), "payload": {"category": "MASTERING", "amount": "700.00"}},
            ],
        )

        # ─── 6. Currents (DRAFT) ─────────────────────────────────
        build(
            owner=main, title="Currents", status=ProjectStatus.DRAFT,
            cover_url="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80",
            released_at=None,
            roster=[
                {"userId": main.id, "role": CollabRole.OWNER, "splitPct": 75},
                {"userId": yussef.id, "role": CollabRole.COMPOSER, "splitPct": 25},
            ],
            tracks=[
                {"title": "Let It Happen", "duration": 467},
                {"title": "The Less I Know The Better", "duration": 216},
            ],
            distributions=[],
            expenses=[
                {"category": ExpenseCategory.PRODUCTION, "amount": 420, "description": "Bedroom synth setup", "spentAt": days_ago(7), "payer": main},
            ],
            revenues=[],
            activities=[
                {"actorId": main.id, "type": ActivityType.PROJECT_CREATED, "createdAt": days_ago(10), "payload": {"title": "Currents"}},
                {"actorId": yussef.id, "type": ActivityType.COLLAB_JOINED, "createdAt": days_ago(8), "payload": {"role": "COMPOSER", "splitPct": "25.00"}},
                {"actorId": main.id, "type": ActivityType.TRACK_UPLOADED, "createdAt": days_ago(5), "payload": {"title": "Let It Happen", "version": 1}},
            ],
        )

        users = User.objects.count()
        projects = Project.objects.count()
        tracks = Track.objects.count()
        collabs = Collaborator.objects.count()
        revenues = Revenue.objects.count()
        payouts = Payout.objects.count()
        expenses = Expense.objects.count()
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Seed complete."))
        self.stdout.write(f"Users: {users} · Projects: {projects} · Tracks: {tracks} · Collaborators: {collabs}")
        self.stdout.write(f"Revenues: {revenues} · Payouts: {payouts} · Expenses: {expenses}")
        self.stdout.write("")
        self.stdout.write(f"Demo password (all 3 accounts): {DEMO_PASSWORD}")
        self.stdout.write("  • main@musiky.dev    — Main Account, owns all 6 projects")
        self.stdout.write("  • mohamed@musiky.dev — collaborator on Take Care, After Hours, Astroworld")
        self.stdout.write("  • yussef@musiky.dev  — collaborator on Take Care, Ma Bagheek, Astroworld, Currents")
