from django.db import models

from apps.users.utils.ids import cuid


class DistStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    LIVE = "LIVE", "Live"


class Platform(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)


class Distribution(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="distributions"
    )
    platform = models.ForeignKey(
        Platform, on_delete=models.PROTECT, related_name="distributions"
    )
    status = models.CharField(
        max_length=8, choices=DistStatus.choices, default=DistStatus.PENDING
    )
    live_at = models.DateTimeField(blank=True, null=True)
    streams = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "platform"], name="uniq_distribution_per_project_platform"
            ),
        ]
