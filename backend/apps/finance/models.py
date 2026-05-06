from django.conf import settings
from django.db import models

from apps.users.utils.ids import cuid


class ExpenseCategory(models.TextChoices):
    MARKETING = "MARKETING", "Marketing"
    PRODUCTION = "PRODUCTION", "Production"
    MASTERING = "MASTERING", "Mastering"
    VIDEO = "VIDEO", "Video"
    LEGAL = "LEGAL", "Legal"
    OTHER = "OTHER", "Other"


class PayoutStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PAID = "PAID", "Paid"


class Expense(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="expenses"
    )
    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expenses_paid"
    )
    category = models.CharField(max_length=12, choices=ExpenseCategory.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    description = models.CharField(max_length=500, blank=True, null=True)
    spent_at = models.DateTimeField(auto_now_add=True)


class Revenue(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="revenues"
    )
    platform = models.ForeignKey(
        "distribution.Platform", on_delete=models.PROTECT, related_name="revenues"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["project", "-received_at"])]


class Payout(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="payouts"
    )
    revenue = models.ForeignKey(
        Revenue, on_delete=models.CASCADE, related_name="payouts"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payouts_received"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=8, choices=PayoutStatus.choices, default=PayoutStatus.PENDING
    )
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["project"]),
        ]
