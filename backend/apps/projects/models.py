from django.conf import settings
from django.db import models

from apps.users.utils.ids import cuid


class ProjectStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    READY = "READY", "Ready"
    LIVE = "LIVE", "Live"
    ARCHIVED = "ARCHIVED", "Archived"


class CollabRole(models.TextChoices):
    OWNER = "OWNER", "Owner"
    PRODUCER = "PRODUCER", "Producer"
    COMPOSER = "COMPOSER", "Composer"
    VOCALIST = "VOCALIST", "Vocalist"
    MANAGER = "MANAGER", "Manager"
    ARTIST = "ARTIST", "Artist"
    OTHER = "OTHER", "Other"


class ActivityType(models.TextChoices):
    PROJECT_CREATED = "PROJECT_CREATED", "Project Created"
    TRACK_UPLOADED = "TRACK_UPLOADED", "Track Uploaded"
    COLLAB_JOINED = "COLLAB_JOINED", "Collaborator Joined"
    DISTRIBUTED = "DISTRIBUTED", "Distributed"
    EXPENSE_LOGGED = "EXPENSE_LOGGED", "Expense Logged"
    REVENUE_RECEIVED = "REVENUE_RECEIVED", "Revenue Received"
    PAYOUT_SENT = "PAYOUT_SENT", "Payout Sent"


class Project(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)
    title = models.CharField(max_length=200)
    cover_url = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(
        max_length=10, choices=ProjectStatus.choices, default=ProjectStatus.DRAFT
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_projects"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(blank=True, null=True)


class Track(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="tracks"
    )
    title = models.CharField(max_length=200)
    file_url = models.CharField(max_length=500)
    cover_url = models.CharField(max_length=500, blank=True, null=True)
    version = models.IntegerField(default=1)
    duration = models.IntegerField(blank=True, null=True)  # seconds
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Collaborator(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="collaborators"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="collaborations"
    )
    role = models.CharField(max_length=12, choices=CollabRole.choices)
    split_pct = models.DecimalField(max_digits=5, decimal_places=2)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"], name="uniq_collaborator_per_project"
            ),
        ]


class Activity(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="activities",
        blank=True, null=True,
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name="activities", blank=True, null=True,
    )
    type = models.CharField(max_length=20, choices=ActivityType.choices)
    payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["project", "-created_at"])]
